// Redis prefetch-cache helper.
//
// Each cached entity is stored as a Redis hash under cache:{prefix}:{id}
// with a long safety-net TTL that bounds memory if the sync pipeline
// ever stops, but is not the freshness mechanism. Freshness comes from
// the ApplyChange path, which the sync worker calls every time a
// primary mutation arrives.
//
// Reads run HGETALL against Redis only. A miss is not a fall-back
// trigger -- the application treats it as an error or a deliberate
// Invalidate for testing. In production a sustained miss rate means the
// prefetch or the sync pipeline is broken, not that the primary should
// be re-queried on the request path.
package prefetchcache

import (
	"context"
	"sort"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

// PrefetchCache is a prefetch-cache helper backed by Redis hashes with
// a safety-net TTL.
type PrefetchCache struct {
	client     *redis.Client
	prefix     string
	ttlSeconds int

	mu                sync.Mutex
	hits              int
	misses            int
	prefetched        int
	syncEventsApplied int
	syncLagMsTotal    float64
	syncLagSamples    int
}

// NewPrefetchCache returns a PrefetchCache. Pass an empty prefix to use
// the default "cache:category:" and 0 for ttlSeconds to use the default
// 3600.
func NewPrefetchCache(client *redis.Client, prefix string, ttlSeconds int) *PrefetchCache {
	if prefix == "" {
		prefix = "cache:category:"
	}
	if ttlSeconds == 0 {
		ttlSeconds = 3600
	}
	return &PrefetchCache{
		client:     client,
		prefix:     prefix,
		ttlSeconds: ttlSeconds,
	}
}

// Prefix returns the configured cache-key prefix.
func (c *PrefetchCache) Prefix() string { return c.prefix }

// TTLSeconds returns the configured safety-net TTL in seconds.
func (c *PrefetchCache) TTLSeconds() int { return c.ttlSeconds }

func (c *PrefetchCache) cacheKey(id string) string { return c.prefix + id }

func (c *PrefetchCache) stripPrefix(key string) string {
	if len(key) >= len(c.prefix) && key[:len(c.prefix)] == c.prefix {
		return key[len(c.prefix):]
	}
	return key
}

// BulkLoad pipelines DEL + HSET + EXPIRE for every record. Returns the
// number of records loaded.
//
// The pipeline is non-transactional: it is fast on startup (when
// nothing is reading the cache) and on the live /reprefetch path (when
// the demo pauses the sync worker around the call). Calling BulkLoad
// on a cache that is actively being read and written to can briefly
// expose a key that has been deleted but not yet rewritten; pause the
// writers first or rewrite this with TxPipeline if that matters.
func (c *PrefetchCache) BulkLoad(ctx context.Context, records []map[string]string) (int, error) {
	loaded := 0
	pipe := c.client.Pipeline()
	for _, record := range records {
		id := record["id"]
		if id == "" {
			continue
		}
		cacheKey := c.cacheKey(id)
		pipe.Del(ctx, cacheKey)
		fields := hashFields(record)
		pipe.HSet(ctx, cacheKey, fields...)
		pipe.Expire(ctx, cacheKey, time.Duration(c.ttlSeconds)*time.Second)
		loaded++
	}
	if loaded > 0 {
		if _, err := pipe.Exec(ctx); err != nil {
			return 0, err
		}
	}
	c.mu.Lock()
	c.prefetched += loaded
	c.mu.Unlock()
	return loaded, nil
}

// GetResult bundles the record, hit/miss flag, and Redis-side latency
// for a Get call.
type GetResult struct {
	Record         map[string]string
	Hit            bool
	RedisLatencyMs float64
}

// Get runs HGETALL against Redis and returns the cached hash with the
// hit flag and Redis-side latency in milliseconds.
//
// Prefetch-cache reads do not fall back to the primary. A miss is a
// signal that the cache is incomplete, not a trigger to re-query the
// source. The caller decides how to surface it.
func (c *PrefetchCache) Get(ctx context.Context, id string) (GetResult, error) {
	cacheKey := c.cacheKey(id)
	started := time.Now()
	cached, err := c.client.HGetAll(ctx, cacheKey).Result()
	latencyMs := float64(time.Since(started).Microseconds()) / 1000.0
	if err != nil {
		return GetResult{RedisLatencyMs: latencyMs}, err
	}
	if len(cached) > 0 {
		c.mu.Lock()
		c.hits++
		c.mu.Unlock()
		return GetResult{Record: cached, Hit: true, RedisLatencyMs: latencyMs}, nil
	}
	c.mu.Lock()
	c.misses++
	c.mu.Unlock()
	return GetResult{Record: nil, Hit: false, RedisLatencyMs: latencyMs}, nil
}

// ApplyChange applies a primary change event to Redis.
//
// For an upsert, the helper rewrites the cache hash and refreshes the
// safety-net TTL in one transactional pipeline so the cache never holds
// a stale mix of old and new fields. For a delete, it removes the cache
// key. An upsert with no fields is dropped silently: HSET with an empty
// mapping errors in most clients, and there is nothing to write.
func (c *PrefetchCache) ApplyChange(ctx context.Context, change Change) error {
	if change.ID == "" {
		return nil
	}
	cacheKey := c.cacheKey(change.ID)

	switch change.Op {
	case ChangeOpUpsert:
		if len(change.Fields) == 0 {
			// Malformed upsert with no fields. Skip rather than
			// crash the sync worker: HSET with an empty mapping
			// errors, and there's nothing to write anyway. A real
			// CDC consumer would route this to a dead-letter queue
			// and alert; the demo just drops it.
			return nil
		}
		pipe := c.client.TxPipeline()
		pipe.Del(ctx, cacheKey)
		pipe.HSet(ctx, cacheKey, hashFields(change.Fields)...)
		pipe.Expire(ctx, cacheKey, time.Duration(c.ttlSeconds)*time.Second)
		if _, err := pipe.Exec(ctx); err != nil {
			return err
		}
	case ChangeOpDelete:
		if err := c.client.Del(ctx, cacheKey).Err(); err != nil {
			return err
		}
	default:
		return nil
	}

	c.mu.Lock()
	c.syncEventsApplied++
	if change.TimestampMs > 0 {
		nowMs := float64(time.Now().UnixNano()) / 1e6
		lag := nowMs - change.TimestampMs
		if lag < 0 {
			lag = 0
		}
		c.syncLagMsTotal += lag
		c.syncLagSamples++
	}
	c.mu.Unlock()
	return nil
}

// Invalidate deletes one cache key. Returns true if a key was removed.
// Demo-only: simulates a broken sync pipeline.
func (c *PrefetchCache) Invalidate(ctx context.Context, id string) (bool, error) {
	n, err := c.client.Del(ctx, c.cacheKey(id)).Result()
	if err != nil {
		return false, err
	}
	return n == 1, nil
}

// Clear deletes every key under this cache's prefix using SCAN + DEL in
// batches. Returns the number of keys deleted.
func (c *PrefetchCache) Clear(ctx context.Context) (int, error) {
	var (
		cursor  uint64
		deleted int
	)
	for {
		keys, next, err := c.client.Scan(ctx, cursor, c.prefix+"*", 500).Result()
		if err != nil {
			return deleted, err
		}
		if len(keys) > 0 {
			n, err := c.client.Del(ctx, keys...).Result()
			if err != nil {
				return deleted, err
			}
			deleted += int(n)
		}
		cursor = next
		if cursor == 0 {
			break
		}
	}
	return deleted, nil
}

// IDs returns every entity ID currently in the cache, sorted, with the
// prefix stripped.
func (c *PrefetchCache) IDs(ctx context.Context) ([]string, error) {
	var (
		cursor uint64
		out    []string
	)
	for {
		keys, next, err := c.client.Scan(ctx, cursor, c.prefix+"*", 500).Result()
		if err != nil {
			return nil, err
		}
		for _, k := range keys {
			out = append(out, c.stripPrefix(k))
		}
		cursor = next
		if cursor == 0 {
			break
		}
	}
	sortStrings(out)
	return out, nil
}

// Count returns the number of keys under the cache prefix.
func (c *PrefetchCache) Count(ctx context.Context) (int, error) {
	var (
		cursor uint64
		count  int
	)
	for {
		keys, next, err := c.client.Scan(ctx, cursor, c.prefix+"*", 500).Result()
		if err != nil {
			return 0, err
		}
		count += len(keys)
		cursor = next
		if cursor == 0 {
			break
		}
	}
	return count, nil
}

// TTLRemaining returns the remaining TTL on the cached key in seconds
// (Redis TTL semantics: -2 = missing, -1 = no expiry).
//
// go-redis stores the sentinel -2/-1 values as raw nanosecond durations
// rather than multiplying by the seconds precision, so we have to
// translate them back to integer seconds explicitly.
func (c *PrefetchCache) TTLRemaining(ctx context.Context, id string) (int, error) {
	d, err := c.client.TTL(ctx, c.cacheKey(id)).Result()
	if err != nil {
		return 0, err
	}
	switch d {
	case -2 * time.Nanosecond:
		return -2, nil
	case -1 * time.Nanosecond:
		return -1, nil
	}
	return int(d.Seconds()), nil
}

// Stats returns the in-process counters and derived rates. JSON keys
// are snake_case to match the other client ports.
func (c *PrefetchCache) Stats() map[string]any {
	c.mu.Lock()
	defer c.mu.Unlock()
	total := c.hits + c.misses
	hitRate := 0.0
	if total > 0 {
		hitRate = roundTo(100.0*float64(c.hits)/float64(total), 1)
	}
	avgLag := 0.0
	if c.syncLagSamples > 0 {
		avgLag = roundTo(c.syncLagMsTotal/float64(c.syncLagSamples), 2)
	}
	return map[string]any{
		"hits":                c.hits,
		"misses":              c.misses,
		"hit_rate_pct":        hitRate,
		"prefetched":          c.prefetched,
		"sync_events_applied": c.syncEventsApplied,
		"sync_lag_ms_avg":     avgLag,
	}
}

// ResetStats zeroes every counter.
func (c *PrefetchCache) ResetStats() {
	c.mu.Lock()
	c.hits = 0
	c.misses = 0
	c.prefetched = 0
	c.syncEventsApplied = 0
	c.syncLagMsTotal = 0
	c.syncLagSamples = 0
	c.mu.Unlock()
}

// hashFields flattens a map into the [key1, val1, key2, val2, ...] slice
// go-redis expects for HSet.
func hashFields(record map[string]string) []any {
	fields := make([]any, 0, len(record)*2)
	for k, v := range record {
		fields = append(fields, k, v)
	}
	return fields
}

// roundTo rounds x to decimals digits after the decimal point.
func roundTo(x float64, decimals int) float64 {
	mul := 1.0
	for i := 0; i < decimals; i++ {
		mul *= 10
	}
	if x >= 0 {
		return float64(int64(x*mul+0.5)) / mul
	}
	return float64(int64(x*mul-0.5)) / mul
}

// sortStrings sorts a slice of IDs in place. Pulled out so callers can
// rely on a sorted result regardless of SCAN return order.
func sortStrings(s []string) {
	sort.Strings(s)
}
