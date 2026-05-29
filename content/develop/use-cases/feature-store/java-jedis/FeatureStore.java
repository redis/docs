import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.Pipeline;
import redis.clients.jedis.Response;

/**
 * Redis online feature store backed by per-entity Hashes.
 *
 * <p>Each entity (here, a user) lives at a deterministic key such as
 * {@code fs:user:{id}}. The hash holds every feature for that entity
 * as one field per feature — batch-materialized aggregates (refreshed
 * on a daily cycle) alongside streaming-updated signals (refreshed
 * every few seconds). One {@code HMGET} returns whichever subset the
 * model needs in one network round trip.</p>
 *
 * <p>Two TTL layers solve the <em>mixed staleness</em> problem:
 * <ul>
 *   <li>A key-level {@code EXPIRE} aligned with the batch
 *       materialization cycle causes the whole entity to disappear
 *       if its batch refresher fails, so inference sees a missing
 *       entity (which the model handler can detect and fall back on)
 *       rather than silently outdated values.</li>
 *   <li>A per-field {@code HEXPIRE} on each streaming field gives that
 *       field its own shorter expiry, independent of the rest of the
 *       hash. When the streaming pipeline stops updating a field, the
 *       field self-cleans while the rest of the entity stays
 *       populated.</li>
 * </ul></p>
 *
 * <p>{@code HEXPIRE} and {@code HTTL} require Redis 7.4 or later.
 * Jedis exposes them as {@code hexpire} / {@code httl} from 5.2.</p>
 *
 * <p>Concurrency is by construction: Redis is single-threaded per
 * shard, so overlapping {@code HSET} calls from a batch job and a
 * streaming worker on the same entity hash are applied atomically
 * without locks or version columns.</p>
 */
public class FeatureStore {

    /** Default batch feature schema. */
    public static final List<String> DEFAULT_BATCH_FIELDS = List.of(
        "country_iso",
        "risk_segment",
        "account_age_days",
        "tx_count_7d",
        "avg_amount_30d",
        "chargeback_count_180d"
    );

    /** Default streaming feature schema. */
    public static final List<String> DEFAULT_STREAMING_FIELDS = List.of(
        "last_login_ts",
        "last_device_id",
        "tx_count_5m",
        "failed_logins_15m",
        "session_country"
    );

    public static final long DEFAULT_BATCH_TTL_SECONDS = 24L * 60L * 60L;
    public static final long DEFAULT_STREAMING_TTL_SECONDS = 5L * 60L;
    public static final String DEFAULT_KEY_PREFIX = "fs:user:";

    private final JedisPool pool;
    private final String keyPrefix;
    private final long batchTtlSeconds;
    private final long streamingTtlSeconds;

    private final AtomicLong batchWritesTotal = new AtomicLong();
    private final AtomicLong streamingWritesTotal = new AtomicLong();
    private final AtomicLong readsTotal = new AtomicLong();
    private final AtomicLong readFieldsTotal = new AtomicLong();

    public FeatureStore(JedisPool pool) {
        this(pool, DEFAULT_KEY_PREFIX,
            DEFAULT_BATCH_TTL_SECONDS,
            DEFAULT_STREAMING_TTL_SECONDS);
    }

    public FeatureStore(JedisPool pool, String keyPrefix,
                        long batchTtlSeconds, long streamingTtlSeconds) {
        this.pool = pool;
        this.keyPrefix = keyPrefix;
        this.batchTtlSeconds = batchTtlSeconds;
        this.streamingTtlSeconds = streamingTtlSeconds;
    }

    public String getKeyPrefix() { return keyPrefix; }
    public long getBatchTtlSeconds() { return batchTtlSeconds; }
    public long getStreamingTtlSeconds() { return streamingTtlSeconds; }

    public String keyFor(String entityId) {
        return keyPrefix + entityId;
    }

    // ---------------------------------------------------------------
    // Batch ingestion (materialization)
    // ---------------------------------------------------------------

    /**
     * Materialize a batch of entities into Redis.
     *
     * <p>{@code rows} is keyed by entity ID. One {@code HSET} plus one
     * {@code EXPIRE} per entity, all queued through a single
     * {@link Pipeline} so the whole batch ships in one round trip.
     * The key-level {@code EXPIRE} is what makes the entity disappear
     * if a future batch run fails — inference reads the missing entity
     * rather than silently outdated values.</p>
     */
    public int bulkLoad(Map<String, Map<String, Object>> rows, long ttlSeconds) {
        if (rows.isEmpty()) return 0;
        try (Jedis jedis = pool.getResource()) {
            Pipeline pipe = jedis.pipelined();
            for (Map.Entry<String, Map<String, Object>> e : rows.entrySet()) {
                String key = keyFor(e.getKey());
                Map<String, String> encoded = encode(e.getValue());
                pipe.hset(key, encoded);
                pipe.expire(key, ttlSeconds);
            }
            pipe.sync();
        }
        batchWritesTotal.addAndGet(rows.size());
        return rows.size();
    }

    public int bulkLoad(Map<String, Map<String, Object>> rows) {
        return bulkLoad(rows, batchTtlSeconds);
    }

    /**
     * Update a single batch feature without touching the key TTL.
     * Used by the demo's "manually refresh one user" lever; real
     * pipelines flow through {@link #bulkLoad}.
     */
    public void updateBatchFeature(String entityId, String field, Object value) {
        try (Jedis jedis = pool.getResource()) {
            jedis.hset(keyFor(entityId), field, encodeValue(value));
        }
        batchWritesTotal.incrementAndGet();
    }

    // ---------------------------------------------------------------
    // Streaming ingestion
    // ---------------------------------------------------------------

    /**
     * Write streaming features with a per-field TTL.
     *
     * <p>Each field carries its own {@code HEXPIRE} so it self-expires
     * independently of the rest of the hash. If the streaming
     * pipeline stops, the streaming fields drop out while the
     * batch-materialized fields remain populated under their longer
     * key-level {@code EXPIRE}.</p>
     *
     * <p>{@code HEXPIRE} returns one status code per field:
     * <ul>
     *   <li>{@code 1}: TTL set / updated</li>
     *   <li>{@code 2}: the expiry was 0 or in the past, so Redis
     *       deleted the field instead of applying a TTL</li>
     *   <li>{@code 0}: an {@code NX | XX | GT | LT} conditional flag
     *       was specified and not met (we never use one here)</li>
     *   <li>{@code -2}: no such field, or no such key</li>
     * </ul>
     * We just {@code HSET} every field on the same call, so any code
     * other than {@code 1} means the per-field TTL invariant did not
     * hold — the mixed-staleness story relies on every streaming
     * field carrying a fresh TTL after the write, so failure is
     * loud.</p>
     */
    public void updateStreaming(String entityId, Map<String, Object> fields, long ttlSeconds) {
        if (fields.isEmpty()) return;
        String key = keyFor(entityId);
        Map<String, String> encoded = encode(fields);
        String[] names = encoded.keySet().toArray(new String[0]);

        List<Long> expireCodes;
        try (Jedis jedis = pool.getResource()) {
            Pipeline pipe = jedis.pipelined();
            pipe.hset(key, encoded);
            Response<List<Long>> expireResp = pipe.hexpire(key, ttlSeconds, names);
            pipe.sync();
            expireCodes = expireResp.get();
        }
        for (Long code : expireCodes) {
            if (code == null || code != 1L) {
                throw new IllegalStateException(
                    "HEXPIRE did not set every field TTL for " + key + ": " + expireCodes);
            }
        }
        streamingWritesTotal.addAndGet(fields.size());
    }

    public void updateStreaming(String entityId, Map<String, Object> fields) {
        updateStreaming(entityId, fields, streamingTtlSeconds);
    }

    // ---------------------------------------------------------------
    // Inference reads
    // ---------------------------------------------------------------

    /**
     * Retrieve a subset of features for one entity. Pass
     * {@code fieldNames=null} (or call {@link #getAllFeatures}) to
     * fetch the full hash with {@code HGETALL} — useful for debugging
     * but rarely the right call on the request path, where the model
     * knows exactly which features it consumes.
     */
    public Map<String, String> getFeatures(String entityId, List<String> fieldNames) {
        String key = keyFor(entityId);
        Map<String, String> out = new LinkedHashMap<>();
        if (fieldNames == null) {
            try (Jedis jedis = pool.getResource()) {
                Map<String, String> all = jedis.hgetAll(key);
                if (all != null) out.putAll(all);
            }
            readsTotal.incrementAndGet();
            readFieldsTotal.addAndGet(out.size());
            return out;
        }
        if (fieldNames.isEmpty()) return out;
        List<String> values;
        try (Jedis jedis = pool.getResource()) {
            values = jedis.hmget(key, fieldNames.toArray(new String[0]));
        }
        for (int i = 0; i < fieldNames.size(); i++) {
            String v = values.get(i);
            if (v != null) out.put(fieldNames.get(i), v);
        }
        readsTotal.incrementAndGet();
        readFieldsTotal.addAndGet(out.size());
        return out;
    }

    public Map<String, String> getAllFeatures(String entityId) {
        return getFeatures(entityId, null);
    }

    /**
     * Pipeline {@code HMGET} across many entities for batch scoring.
     * One round trip for the whole batch.
     */
    public Map<String, Map<String, String>> batchGetFeatures(
            List<String> entityIds, List<String> fieldNames) {
        if (entityIds.isEmpty() || fieldNames.isEmpty()) {
            return Collections.emptyMap();
        }
        String[] names = fieldNames.toArray(new String[0]);
        Map<String, Map<String, String>> out = new LinkedHashMap<>();
        List<Response<List<String>>> responses = new ArrayList<>(entityIds.size());
        try (Jedis jedis = pool.getResource()) {
            Pipeline pipe = jedis.pipelined();
            for (String id : entityIds) {
                responses.add(pipe.hmget(keyFor(id), names));
            }
            pipe.sync();
        }
        long seenFields = 0;
        for (int i = 0; i < entityIds.size(); i++) {
            List<String> values = responses.get(i).get();
            Map<String, String> row = new LinkedHashMap<>();
            for (int j = 0; j < fieldNames.size(); j++) {
                String v = values.get(j);
                if (v != null) {
                    row.put(fieldNames.get(j), v);
                    seenFields++;
                }
            }
            out.put(entityIds.get(i), row);
        }
        readsTotal.addAndGet(entityIds.size());
        readFieldsTotal.addAndGet(seenFields);
        return out;
    }

    // ---------------------------------------------------------------
    // TTL inspection (used by the demo UI)
    // ---------------------------------------------------------------

    /**
     * Seconds until the entity key expires. Returns {@code -1} if no
     * key-level TTL is set, {@code -2} if the key doesn't exist.
     */
    public long keyTtlSeconds(String entityId) {
        try (Jedis jedis = pool.getResource()) {
            return jedis.ttl(keyFor(entityId));
        }
    }

    /**
     * Per-field TTL via {@code HTTL} (Redis 7.4+). Each value mirrors
     * the {@code TTL} convention: positive means seconds remaining,
     * {@code -1} means the field has no TTL set, {@code -2} means
     * the field doesn't exist on this hash (or the key itself is
     * missing).
     */
    public Map<String, Long> fieldTtlsSeconds(String entityId, List<String> fieldNames) {
        if (fieldNames.isEmpty()) return Collections.emptyMap();
        List<Long> codes;
        try (Jedis jedis = pool.getResource()) {
            codes = jedis.httl(keyFor(entityId), fieldNames.toArray(new String[0]));
        }
        Map<String, Long> out = new LinkedHashMap<>();
        for (int i = 0; i < fieldNames.size(); i++) {
            // HTTL on a missing key returns a flat list of -2s; jedis
            // surfaces null per element if the reply shape ever changes
            // upstream, so coerce to -2 defensively.
            Long c = i < codes.size() ? codes.get(i) : null;
            out.put(fieldNames.get(i), c == null ? -2L : c);
        }
        return out;
    }

    // ---------------------------------------------------------------
    // Demo housekeeping
    // ---------------------------------------------------------------

    /**
     * Enumerate entity IDs by scanning {@code keyPrefix*}. {@code SCAN}
     * is non-blocking; the demo uses it to populate UI dropdowns, not
     * as a serving primitive.
     */
    public List<String> listEntityIds(int limit) {
        List<String> ids = new ArrayList<>();
        String pattern = keyPrefix + "*";
        String cursor = "0";
        try (Jedis jedis = pool.getResource()) {
            do {
                redis.clients.jedis.params.ScanParams params = new redis.clients.jedis.params.ScanParams()
                    .match(pattern)
                    .count(200);
                redis.clients.jedis.resps.ScanResult<String> sr = jedis.scan(cursor, params);
                for (String k : sr.getResult()) {
                    if (k.length() > keyPrefix.length()) {
                        ids.add(k.substring(keyPrefix.length()));
                        if (ids.size() >= limit) {
                            Collections.sort(ids);
                            return ids;
                        }
                    }
                }
                cursor = sr.getCursor();
            } while (!"0".equals(cursor));
        }
        Collections.sort(ids);
        return ids;
    }

    /**
     * Count entities under the key prefix without an in-memory cap so
     * the UI can report the real total even when more keys exist than
     * the dropdown lists.
     */
    public long countEntities() {
        long count = 0;
        String pattern = keyPrefix + "*";
        String cursor = "0";
        try (Jedis jedis = pool.getResource()) {
            do {
                redis.clients.jedis.params.ScanParams params = new redis.clients.jedis.params.ScanParams()
                    .match(pattern)
                    .count(500);
                redis.clients.jedis.resps.ScanResult<String> sr = jedis.scan(cursor, params);
                count += sr.getResult().size();
                cursor = sr.getCursor();
            } while (!"0".equals(cursor));
        }
        return count;
    }

    public long deleteEntity(String entityId) {
        try (Jedis jedis = pool.getResource()) {
            return jedis.del(keyFor(entityId));
        }
    }

    /**
     * Drop every entity under the key prefix. Used by the demo reset
     * path. Scans in batches and issues one variadic {@code DEL} per
     * batch, so a large demo dataset doesn't land on the server as
     * one giant synchronous delete.
     */
    public long reset() {
        long deleted = 0;
        String pattern = keyPrefix + "*";
        String cursor = "0";
        try (Jedis jedis = pool.getResource()) {
            do {
                redis.clients.jedis.params.ScanParams params = new redis.clients.jedis.params.ScanParams()
                    .match(pattern)
                    .count(500);
                redis.clients.jedis.resps.ScanResult<String> sr = jedis.scan(cursor, params);
                List<String> batch = sr.getResult();
                if (!batch.isEmpty()) {
                    deleted += jedis.del(batch.toArray(new String[0]));
                }
                cursor = sr.getCursor();
            } while (!"0".equals(cursor));
        }
        return deleted;
    }

    public Stats stats() {
        return new Stats(
            batchWritesTotal.get(),
            streamingWritesTotal.get(),
            readsTotal.get(),
            readFieldsTotal.get()
        );
    }

    public void resetStats() {
        batchWritesTotal.set(0);
        streamingWritesTotal.set(0);
        readsTotal.set(0);
        readFieldsTotal.set(0);
    }

    // ---------------------------------------------------------------
    // Encoding helpers
    // ---------------------------------------------------------------

    private static Map<String, String> encode(Map<String, Object> fields) {
        Map<String, String> out = new LinkedHashMap<>(fields.size());
        for (Map.Entry<String, Object> e : fields.entrySet()) {
            out.put(e.getKey(), encodeValue(e.getValue()));
        }
        return out;
    }

    /** Render a feature value as a string for hash storage. */
    public static String encodeValue(Object value) {
        if (value == null) return "";
        if (value instanceof Boolean b) return b ? "true" : "false";
        return value.toString();
    }

    /** Immutable snapshot of the helper's in-process counters. */
    public static record Stats(
        long batchWritesTotal,
        long streamingWritesTotal,
        long readsTotal,
        long readFieldsTotal
    ) {}
}
