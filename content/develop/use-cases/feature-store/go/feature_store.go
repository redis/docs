// Package featurestore is a Redis online feature store backed by per-entity
// Hashes.
//
// Each entity (here, a user) lives at a deterministic key such as
// "fs:user:{id}". The hash holds every feature for that entity as one
// field per feature — batch-materialized aggregates (refreshed on a
// daily cycle) alongside streaming-updated signals (refreshed every
// few seconds). One HMGET returns whichever subset the model needs in
// one network round trip.
//
// Two TTL layers solve the *mixed staleness* problem:
//
//   - A key-level EXPIRE aligned with the batch materialization cycle
//     causes the whole entity to disappear if its batch refresher
//     fails, so inference sees a missing entity (which the model
//     handler can detect and fall back on) rather than silently
//     outdated values.
//   - A per-field HEXPIRE on each streaming field gives that field
//     its own shorter expiry, independent of the rest of the hash.
//     When the streaming pipeline stops updating a field, the field
//     self-cleans while the rest of the entity stays populated.
//
// HEXPIRE and HTTL require Redis 7.4 or later. The go-redis v9 client
// exposes them as HExpire and HTTL on *redis.Client.
//
// Concurrency is by construction: Redis is single-threaded per shard,
// so overlapping HSET calls from a batch job and a streaming worker
// on the same entity hash are applied atomically without locks or
// version columns.
package featurestore

import (
	"context"
	"errors"
	"fmt"
	"sort"
	"strconv"
	"sync/atomic"
	"time"

	"github.com/redis/go-redis/v9"
)

// FeatureValue is the concrete type a single feature may take before
// it gets serialized as a Redis hash field. Hash field values are
// strings on the wire; the helper renders these types into strings
// via encode() so booleans round-trip cleanly through redis-cli.
type FeatureValue any

// FeatureMap is the set of fields written for one entity.
type FeatureMap map[string]FeatureValue

// DefaultBatchFields is the schema bulk-loaded once per batch cycle.
var DefaultBatchFields = []string{
	"country_iso",
	"risk_segment",
	"account_age_days",
	"tx_count_7d",
	"avg_amount_30d",
	"chargeback_count_180d",
}

// DefaultStreamingFields is the schema updated by the streaming worker
// with a per-field HEXPIRE so each field self-expires when its
// upstream pipeline stops.
var DefaultStreamingFields = []string{
	"last_login_ts",
	"last_device_id",
	"tx_count_5m",
	"failed_logins_15m",
	"session_country",
}

// Stats holds the helper's in-process counters. Read with FeatureStore.Stats.
type Stats struct {
	BatchWritesTotal     int64 `json:"batch_writes_total"`
	StreamingWritesTotal int64 `json:"streaming_writes_total"`
	ReadsTotal           int64 `json:"reads_total"`
	ReadFieldsTotal      int64 `json:"read_fields_total"`
}

// FeatureStore wraps a *redis.Client and exposes the four feature-store
// paths: batch ingest (BulkLoad), streaming ingest (UpdateStreaming),
// inference read (GetFeatures), and batch scoring (BatchGetFeatures).
type FeatureStore struct {
	rdb                 *redis.Client
	KeyPrefix           string
	BatchTTL            time.Duration
	StreamingTTL        time.Duration

	batchWritesTotal     atomic.Int64
	streamingWritesTotal atomic.Int64
	readsTotal           atomic.Int64
	readFieldsTotal      atomic.Int64
}

// NewFeatureStore returns a FeatureStore backed by rdb. Defaults match
// the Python and Node.js demos: a 24-hour key-level TTL and a 5-minute
// per-field streaming TTL.
func NewFeatureStore(rdb *redis.Client, keyPrefix string, batchTTL, streamingTTL time.Duration) *FeatureStore {
	if keyPrefix == "" {
		keyPrefix = "fs:user:"
	}
	if batchTTL == 0 {
		batchTTL = 24 * time.Hour
	}
	if streamingTTL == 0 {
		streamingTTL = 5 * time.Minute
	}
	return &FeatureStore{
		rdb:          rdb,
		KeyPrefix:    keyPrefix,
		BatchTTL:     batchTTL,
		StreamingTTL: streamingTTL,
	}
}

// KeyFor returns the Redis key for an entity ID.
func (fs *FeatureStore) KeyFor(entityID string) string {
	return fs.KeyPrefix + entityID
}

// -------------------------------------------------------------------
// Batch ingestion (materialization)
// -------------------------------------------------------------------

// BulkLoad materializes a batch of entities into Redis. rows is
// keyed by entity ID. One HSET plus one EXPIRE per entity, batched
// through go-redis's Pipeline so the whole batch ships in a single
// round trip. The key-level EXPIRE is what makes the entity
// disappear if a future batch run fails — inference reads the
// missing entity rather than silently outdated values.
func (fs *FeatureStore) BulkLoad(ctx context.Context, rows map[string]FeatureMap, ttl time.Duration) (int, error) {
	if ttl == 0 {
		ttl = fs.BatchTTL
	}
	if len(rows) == 0 {
		return 0, nil
	}

	pipe := fs.rdb.Pipeline()
	for entityID, fields := range rows {
		key := fs.KeyFor(entityID)
		encoded := make(map[string]any, len(fields))
		for name, value := range fields {
			encoded[name] = encode(value)
		}
		pipe.HSet(ctx, key, encoded)
		pipe.Expire(ctx, key, ttl)
	}
	if _, err := pipe.Exec(ctx); err != nil {
		return 0, fmt.Errorf("bulk load: %w", err)
	}
	fs.batchWritesTotal.Add(int64(len(rows)))
	return len(rows), nil
}

// UpdateBatchFeature overwrites one batch feature without touching
// the key TTL. Used by the demo's "manually refresh one user" lever;
// real pipelines flow through BulkLoad.
func (fs *FeatureStore) UpdateBatchFeature(ctx context.Context, entityID, field string, value FeatureValue) error {
	if err := fs.rdb.HSet(ctx, fs.KeyFor(entityID), field, encode(value)).Err(); err != nil {
		return err
	}
	fs.batchWritesTotal.Add(1)
	return nil
}

// -------------------------------------------------------------------
// Streaming ingestion
// -------------------------------------------------------------------

// UpdateStreaming writes streaming features with a per-field TTL.
//
// Each field carries its own HEXPIRE so it self-expires
// independently of the rest of the hash. If the streaming pipeline
// stops, the streaming fields drop out while the batch-materialized
// fields remain populated under their longer key-level EXPIRE.
//
// HEXPIRE returns one status code per field:
//
//   - 1: TTL set / updated
//   - 2: the expiry was 0 or in the past, so Redis deleted the field
//     instead of applying a TTL
//   - 0: an NX | XX | GT | LT conditional flag was specified and not
//     met (we never use one here)
//   - -2: no such field, or no such key
//
// Since we just HSET every field on the same call, any code other
// than 1 means the per-field TTL invariant did not hold — the
// mixed-staleness story relies on every streaming field carrying a
// fresh TTL after the write, so failure is loud.
func (fs *FeatureStore) UpdateStreaming(ctx context.Context, entityID string, fields FeatureMap, ttl time.Duration) error {
	if len(fields) == 0 {
		return nil
	}
	if ttl == 0 {
		ttl = fs.StreamingTTL
	}
	key := fs.KeyFor(entityID)
	encoded := make(map[string]any, len(fields))
	names := make([]string, 0, len(fields))
	for name, value := range fields {
		encoded[name] = encode(value)
		names = append(names, name)
	}

	pipe := fs.rdb.Pipeline()
	pipe.HSet(ctx, key, encoded)
	hexpireCmd := pipe.HExpire(ctx, key, ttl, names...)
	if _, err := pipe.Exec(ctx); err != nil {
		return fmt.Errorf("update streaming: %w", err)
	}
	codes, err := hexpireCmd.Result()
	if err != nil {
		return fmt.Errorf("update streaming: HEXPIRE: %w", err)
	}
	for _, code := range codes {
		if code != 1 {
			return fmt.Errorf("HEXPIRE did not set every field TTL for %s: %v", key, codes)
		}
	}
	fs.streamingWritesTotal.Add(int64(len(fields)))
	return nil
}

// -------------------------------------------------------------------
// Inference reads
// -------------------------------------------------------------------

// GetFeatures returns a subset of features for one entity. Pass
// fieldNames=nil to fetch the full hash with HGETALL — useful for
// debugging but rarely the right call on the request path, where the
// model knows exactly which features it consumes.
func (fs *FeatureStore) GetFeatures(ctx context.Context, entityID string, fieldNames []string) (map[string]string, error) {
	key := fs.KeyFor(entityID)
	if fieldNames == nil {
		out, err := fs.rdb.HGetAll(ctx, key).Result()
		if err != nil {
			return nil, err
		}
		fs.readsTotal.Add(1)
		fs.readFieldsTotal.Add(int64(len(out)))
		return out, nil
	}
	if len(fieldNames) == 0 {
		return map[string]string{}, nil
	}
	values, err := fs.rdb.HMGet(ctx, key, fieldNames...).Result()
	if err != nil {
		return nil, err
	}
	out := make(map[string]string, len(fieldNames))
	for i, name := range fieldNames {
		if values[i] == nil {
			continue
		}
		s, ok := values[i].(string)
		if !ok {
			continue
		}
		out[name] = s
	}
	fs.readsTotal.Add(1)
	fs.readFieldsTotal.Add(int64(len(out)))
	return out, nil
}

// BatchGetFeatures pipelines HMGET across many entities for batch
// scoring. Returns one map per entity ID, in input order.
func (fs *FeatureStore) BatchGetFeatures(ctx context.Context, entityIDs, fieldNames []string) (map[string]map[string]string, error) {
	if len(entityIDs) == 0 || len(fieldNames) == 0 {
		return map[string]map[string]string{}, nil
	}

	pipe := fs.rdb.Pipeline()
	cmds := make([]*redis.SliceCmd, len(entityIDs))
	for i, id := range entityIDs {
		cmds[i] = pipe.HMGet(ctx, fs.KeyFor(id), fieldNames...)
	}
	if _, err := pipe.Exec(ctx); err != nil && !errors.Is(err, redis.Nil) {
		return nil, fmt.Errorf("batch get features: %w", err)
	}

	out := make(map[string]map[string]string, len(entityIDs))
	var seen int64
	for i, id := range entityIDs {
		values, err := cmds[i].Result()
		if err != nil {
			return nil, fmt.Errorf("batch get features: %s: %w", id, err)
		}
		row := make(map[string]string, len(fieldNames))
		for j, name := range fieldNames {
			if values[j] == nil {
				continue
			}
			if s, ok := values[j].(string); ok {
				row[name] = s
				seen++
			}
		}
		out[id] = row
	}
	fs.readsTotal.Add(int64(len(entityIDs)))
	fs.readFieldsTotal.Add(seen)
	return out, nil
}

// -------------------------------------------------------------------
// TTL inspection (used by the demo UI)
// -------------------------------------------------------------------

// KeyTTLSeconds returns the seconds until the entity key expires:
// positive means TTL remaining, -1 means no key-level TTL set,
// -2 means the key doesn't exist.
func (fs *FeatureStore) KeyTTLSeconds(ctx context.Context, entityID string) (int64, error) {
	d, err := fs.rdb.TTL(ctx, fs.KeyFor(entityID)).Result()
	if err != nil {
		return 0, err
	}
	// go-redis returns time.Duration(-1) for "no TTL" and
	// time.Duration(-2) for "missing key" (both literal nanosecond
	// values, not seconds). Positive durations carry the real TTL.
	if d < 0 {
		return int64(d), nil
	}
	return int64(d.Seconds()), nil
}

// FieldTTLsSeconds returns the per-field TTL for each named field
// via HTTL. Each value mirrors the TTL convention: positive means
// seconds remaining, -1 means the field has no TTL set, -2 means
// the field doesn't exist on this hash (or the key itself is
// missing).
func (fs *FeatureStore) FieldTTLsSeconds(ctx context.Context, entityID string, fieldNames []string) (map[string]int64, error) {
	if len(fieldNames) == 0 {
		return map[string]int64{}, nil
	}
	codes, err := fs.rdb.HTTL(ctx, fs.KeyFor(entityID), fieldNames...).Result()
	if err != nil {
		return nil, err
	}
	// HTTL on a missing key returns an array of -2s, one per field, so
	// the loop below produces the same shape as a present-but-empty
	// hash would. No defensive shim needed for this client.
	out := make(map[string]int64, len(fieldNames))
	for i, name := range fieldNames {
		if i < len(codes) {
			out[name] = codes[i]
		} else {
			out[name] = -2
		}
	}
	return out, nil
}

// -------------------------------------------------------------------
// Demo housekeeping
// -------------------------------------------------------------------

// ListEntityIDs returns up to limit entity IDs by scanning
// keyPrefix*. SCAN is non-blocking and is used to populate UI
// dropdowns, not as a serving primitive. The result is sorted.
func (fs *FeatureStore) ListEntityIDs(ctx context.Context, limit int64) ([]string, error) {
	if limit <= 0 {
		limit = 200
	}
	pattern := fs.KeyPrefix + "*"
	prefixLen := len(fs.KeyPrefix)
	ids := make([]string, 0, limit)
	iter := fs.rdb.Scan(ctx, 0, pattern, 200).Iterator()
	for iter.Next(ctx) {
		k := iter.Val()
		if len(k) <= prefixLen {
			continue
		}
		ids = append(ids, k[prefixLen:])
		if int64(len(ids)) >= limit {
			break
		}
	}
	if err := iter.Err(); err != nil {
		return nil, err
	}
	sort.Strings(ids)
	return ids, nil
}

// CountEntities returns the true count of entities under the key
// prefix. Iterates SCAN without an in-memory cap so the UI can report
// the real total even when more keys exist than the dropdown lists.
func (fs *FeatureStore) CountEntities(ctx context.Context) (int64, error) {
	var n int64
	pattern := fs.KeyPrefix + "*"
	iter := fs.rdb.Scan(ctx, 0, pattern, 500).Iterator()
	for iter.Next(ctx) {
		n++
	}
	if err := iter.Err(); err != nil {
		return 0, err
	}
	return n, nil
}

// DeleteEntity drops one entity by ID. Returns 1 if a key was
// deleted, 0 otherwise.
func (fs *FeatureStore) DeleteEntity(ctx context.Context, entityID string) (int64, error) {
	return fs.rdb.Del(ctx, fs.KeyFor(entityID)).Result()
}

// Reset drops every entity under the key prefix. Used by the demo
// reset path. Scans in batches and issues one variadic DEL per batch,
// so a large demo dataset doesn't land on the server as one giant
// synchronous delete.
func (fs *FeatureStore) Reset(ctx context.Context) (int64, error) {
	var deleted int64
	pattern := fs.KeyPrefix + "*"
	batch := make([]string, 0, 500)
	flush := func() error {
		if len(batch) == 0 {
			return nil
		}
		n, err := fs.rdb.Del(ctx, batch...).Result()
		if err != nil {
			return err
		}
		deleted += n
		batch = batch[:0]
		return nil
	}
	iter := fs.rdb.Scan(ctx, 0, pattern, 500).Iterator()
	for iter.Next(ctx) {
		batch = append(batch, iter.Val())
		if len(batch) >= 500 {
			if err := flush(); err != nil {
				return deleted, err
			}
		}
	}
	if err := iter.Err(); err != nil {
		return deleted, err
	}
	if err := flush(); err != nil {
		return deleted, err
	}
	return deleted, nil
}

// Stats returns a snapshot of the in-process counters.
func (fs *FeatureStore) Stats() Stats {
	return Stats{
		BatchWritesTotal:     fs.batchWritesTotal.Load(),
		StreamingWritesTotal: fs.streamingWritesTotal.Load(),
		ReadsTotal:           fs.readsTotal.Load(),
		ReadFieldsTotal:      fs.readFieldsTotal.Load(),
	}
}

// ResetStats zeroes every counter.
func (fs *FeatureStore) ResetStats() {
	fs.batchWritesTotal.Store(0)
	fs.streamingWritesTotal.Store(0)
	fs.readsTotal.Store(0)
	fs.readFieldsTotal.Store(0)
}

// encode renders a feature value as a string for hash storage.
// Booleans become "true" / "false" so they round-trip cleanly through
// other clients and redis-cli.
func encode(value FeatureValue) string {
	switch v := value.(type) {
	case nil:
		return ""
	case string:
		return v
	case bool:
		if v {
			return "true"
		}
		return "false"
	case int:
		return strconv.FormatInt(int64(v), 10)
	case int32:
		return strconv.FormatInt(int64(v), 10)
	case int64:
		return strconv.FormatInt(v, 10)
	case float32:
		return strconv.FormatFloat(float64(v), 'f', -1, 32)
	case float64:
		return strconv.FormatFloat(v, 'f', -1, 64)
	default:
		return fmt.Sprintf("%v", v)
	}
}

