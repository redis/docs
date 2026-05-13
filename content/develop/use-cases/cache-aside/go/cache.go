// Package cacheaside implements a Redis-backed cache-aside helper with TTL
// and Lua-backed single-flight stampede protection.
package cacheaside

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

const acquireLockScript = `
if redis.call('SET', KEYS[1], ARGV[1], 'NX', 'PX', ARGV[2]) then
    return 1
end
return 0
`

const releaseLockScript = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
end
return 0
`

// Loader fetches an entity from the primary store on a cache miss.
type Loader func(ctx context.Context, id string) (map[string]string, error)

// Config holds RedisCache configuration.
type Config struct {
	Client     *redis.Client
	Prefix     string
	TTL        time.Duration
	LockTTL    time.Duration
	WaitPoll   time.Duration
}

// RedisCache is a cache-aside helper backed by Redis hashes with TTL and single-flight.
type RedisCache struct {
	client   *redis.Client
	prefix   string
	ttl      time.Duration
	lockTTL  time.Duration
	waitPoll time.Duration

	acquireScript *redis.Script
	releaseScript *redis.Script

	mu                   sync.Mutex
	hits                 int
	misses               int
	stampedesSuppressed  int
}

// New creates a RedisCache. Defaults: prefix "cache:product:", TTL 30s,
// lock TTL 2s, wait poll 25ms.
func New(cfg Config) (*RedisCache, error) {
	if cfg.Client == nil {
		return nil, errors.New("cacheaside: Client is required")
	}
	if cfg.Prefix == "" {
		cfg.Prefix = "cache:product:"
	}
	if cfg.TTL == 0 {
		cfg.TTL = 30 * time.Second
	}
	if cfg.LockTTL == 0 {
		cfg.LockTTL = 2 * time.Second
	}
	if cfg.WaitPoll == 0 {
		cfg.WaitPoll = 25 * time.Millisecond
	}
	return &RedisCache{
		client:        cfg.Client,
		prefix:        cfg.Prefix,
		ttl:           cfg.TTL,
		lockTTL:       cfg.LockTTL,
		waitPoll:      cfg.WaitPoll,
		acquireScript: redis.NewScript(acquireLockScript),
		releaseScript: redis.NewScript(releaseLockScript),
	}, nil
}

func (c *RedisCache) cacheKey(id string) string { return c.prefix + id }
func (c *RedisCache) lockKey(id string) string  { return "lock:" + c.prefix + id }

// Result is returned by Get and includes timing and hit/miss information.
type Result struct {
	Record         map[string]string
	Hit            bool
	RedisLatencyMs float64
}

// Get returns the entity, loading it through the loader on a miss. Concurrent
// callers that miss are funnelled through a single primary read.
func (c *RedisCache) Get(ctx context.Context, id string, loader Loader) (Result, error) {
	cacheKey := c.cacheKey(id)

	start := time.Now()
	cached, err := c.client.HGetAll(ctx, cacheKey).Result()
	redisMs := float64(time.Since(start).Microseconds()) / 1000.0
	if err != nil {
		return Result{RedisLatencyMs: redisMs}, err
	}

	if len(cached) > 0 {
		c.recordHit()
		return Result{Record: cached, Hit: true, RedisLatencyMs: redisMs}, nil
	}

	c.recordMiss()
	record, err := c.loadWithSingleFlight(ctx, id, loader)
	return Result{Record: record, Hit: false, RedisLatencyMs: redisMs}, err
}

func (c *RedisCache) loadWithSingleFlight(ctx context.Context, id string, loader Loader) (map[string]string, error) {
	cacheKey := c.cacheKey(id)
	lockKey := c.lockKey(id)
	tokenBytes := make([]byte, 8)
	if _, err := rand.Read(tokenBytes); err != nil {
		return nil, err
	}
	token := hex.EncodeToString(tokenBytes)

	acquiredVal, err := c.acquireScript.Run(ctx, c.client,
		[]string{lockKey},
		token,
		c.lockTTL.Milliseconds(),
	).Int()
	if err != nil {
		return nil, err
	}

	if acquiredVal == 1 {
		defer func() {
			_, _ = c.releaseScript.Run(ctx, c.client, []string{lockKey}, token).Result()
		}()
		record, err := loader(ctx, id)
		if err != nil {
			return nil, err
		}
		if record == nil {
			return nil, nil
		}
		pipe := c.client.TxPipeline()
		pipe.Del(ctx, cacheKey)
		fields := make([]any, 0, len(record)*2)
		for k, v := range record {
			fields = append(fields, k, v)
		}
		pipe.HSet(ctx, cacheKey, fields...)
		pipe.Expire(ctx, cacheKey, c.ttl)
		if _, err := pipe.Exec(ctx); err != nil {
			return record, err
		}
		return record, nil
	}

	c.recordStampedeSuppressed()
	deadline := time.Now().Add(c.lockTTL)
	for time.Now().Before(deadline) {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-time.After(c.waitPoll):
		}
		cached, err := c.client.HGetAll(ctx, cacheKey).Result()
		if err == nil && len(cached) > 0 {
			return cached, nil
		}
	}
	return loader(ctx, id)
}

// Invalidate removes the cached entry for id.
func (c *RedisCache) Invalidate(ctx context.Context, id string) (bool, error) {
	n, err := c.client.Del(ctx, c.cacheKey(id)).Result()
	if err != nil {
		return false, err
	}
	return n == 1, nil
}

// UpdateField updates a single field in place if the entry is cached.
// It uses WATCH/MULTI/EXEC so a concurrent invalidate or repopulate cannot
// interleave with the field write.
func (c *RedisCache) UpdateField(ctx context.Context, id, field, value string) (bool, error) {
	cacheKey := c.cacheKey(id)
	for {
		var ok bool
		err := c.client.Watch(ctx, func(tx *redis.Tx) error {
			exists, err := tx.Exists(ctx, cacheKey).Result()
			if err != nil {
				return err
			}
			if exists == 0 {
				ok = false
				return nil
			}
			_, err = tx.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
				pipe.HSet(ctx, cacheKey, field, value)
				pipe.Expire(ctx, cacheKey, c.ttl)
				return nil
			})
			if err != nil {
				return err
			}
			ok = true
			return nil
		}, cacheKey)
		if errors.Is(err, redis.TxFailedErr) {
			continue
		}
		if err != nil {
			return false, err
		}
		return ok, nil
	}
}

// TTLRemaining returns the remaining TTL on the cached key in seconds, or
// -2/-1 per Redis semantics.
func (c *RedisCache) TTLRemaining(ctx context.Context, id string) (int, error) {
	d, err := c.client.TTL(ctx, c.cacheKey(id)).Result()
	if err != nil {
		return 0, err
	}
	if d < 0 {
		return int(d / time.Second), nil
	}
	return int(d.Seconds()), nil
}

// Stats returns hit/miss/stampede counters.
func (c *RedisCache) Stats() map[string]any {
	c.mu.Lock()
	defer c.mu.Unlock()
	total := c.hits + c.misses
	hitRate := 0.0
	if total > 0 {
		hitRate = float64(int(1000.0*float64(c.hits)/float64(total))) / 10.0
	}
	return map[string]any{
		"hits":                  c.hits,
		"misses":                c.misses,
		"stampedes_suppressed":  c.stampedesSuppressed,
		"hit_rate_pct":          hitRate,
	}
}

// ResetStats zeroes the in-process counters.
func (c *RedisCache) ResetStats() {
	c.mu.Lock()
	c.hits, c.misses, c.stampedesSuppressed = 0, 0, 0
	c.mu.Unlock()
}

func (c *RedisCache) recordHit()                 { c.mu.Lock(); c.hits++; c.mu.Unlock() }
func (c *RedisCache) recordMiss()                { c.mu.Lock(); c.misses++; c.mu.Unlock() }
func (c *RedisCache) recordStampedeSuppressed()  { c.mu.Lock(); c.stampedesSuppressed++; c.mu.Unlock() }
