import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

import io.lettuce.core.KeyScanCursor;
import io.lettuce.core.KeyValue;
import io.lettuce.core.LettuceFutures;
import io.lettuce.core.RedisException;
import io.lettuce.core.RedisFuture;
import io.lettuce.core.ScanArgs;
import io.lettuce.core.ScanCursor;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.async.RedisAsyncCommands;

/**
 * Redis online feature store backed by per-entity Hashes (Lettuce).
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
 *       materialization cycle.</li>
 *   <li>A per-field {@code HEXPIRE} on each streaming field gives
 *       that field its own shorter expiry, independent of the rest of
 *       the hash.</li>
 * </ul></p>
 *
 * <p>{@code HEXPIRE} and {@code HTTL} require Redis 7.4 or later.
 * Lettuce exposes them as {@code hexpire} / {@code httl} on
 * {@code RedisAsyncCommands} from 6.4 onwards; the demo pins
 * 7.5.2.RELEASE.</p>
 *
 * <h2>Lettuce vs. Jedis</h2>
 *
 * <p>Unlike Jedis, Lettuce is async-by-default and the
 * {@code StatefulRedisConnection} is <em>thread-safe and multiplexed</em>:
 * one connection serves the whole process and there is no per-call
 * pool checkout. Every async call returns a {@code RedisFuture<T>}
 * (which is also a {@code CompletionStage<T>}) — the helper blocks
 * with {@code .get()} where the calling context is synchronous, but
 * the underlying writes are pipelined onto the same connection
 * automatically.</p>
 *
 * <p>For batched writes (bulk-load, streaming-update,
 * batch-get-features) the helper switches the connection's
 * auto-flush off, queues every command, then flushes once and awaits
 * the resulting {@code RedisFuture}s with
 * {@link LettuceFutures#awaitAll}. That is Lettuce's canonical
 * pipelining idiom.</p>
 */
public class FeatureStore {

    public static final List<String> DEFAULT_BATCH_FIELDS = List.of(
        "country_iso",
        "risk_segment",
        "account_age_days",
        "tx_count_7d",
        "avg_amount_30d",
        "chargeback_count_180d"
    );

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

    /** Hard cap on how long we block waiting for any single batched flush. */
    private static final Duration BATCH_TIMEOUT = Duration.ofSeconds(10);

    /**
     * Shared connection used for non-pipelined reads (HMGET, HGETALL,
     * HTTL, TTL, SCAN, DEL). Safe to use concurrently from many
     * threads because Lettuce multiplexes auto-flushed commands.
     */
    private final StatefulRedisConnection<String, String> conn;
    private final RedisAsyncCommands<String, String> async;

    /**
     * Dedicated connection used for the pipelined batched paths
     * ({@link #bulkLoad}, {@link #updateStreaming},
     * {@link #batchGetFeatures}). These flip
     * {@code setAutoFlushCommands(false)} on the connection while
     * they queue commands — a *connection-level* state change — so
     * they cannot share the read connection without interfering with
     * other threads. A single lock serializes pipelined batches on
     * this connection; concurrent batches block each other rather
     * than corrupting the auto-flush flag.
     *
     * <p>If you need true batch concurrency, scale this design to a
     * small {@code BoundedAsyncPool<StatefulRedisConnection<K, V>>}
     * of pipeline connections and lease one per batch.</p>
     */
    private final StatefulRedisConnection<String, String> pipelineConn;
    private final RedisAsyncCommands<String, String> pipelineAsync;
    private final Object pipelineLock = new Object();

    private final String keyPrefix;
    private final long batchTtlSeconds;
    private final long streamingTtlSeconds;

    private final AtomicLong batchWritesTotal = new AtomicLong();
    private final AtomicLong streamingWritesTotal = new AtomicLong();
    private final AtomicLong readsTotal = new AtomicLong();
    private final AtomicLong readFieldsTotal = new AtomicLong();

    public FeatureStore(StatefulRedisConnection<String, String> conn,
                        StatefulRedisConnection<String, String> pipelineConn) {
        this(conn, pipelineConn, DEFAULT_KEY_PREFIX,
            DEFAULT_BATCH_TTL_SECONDS,
            DEFAULT_STREAMING_TTL_SECONDS);
    }

    public FeatureStore(StatefulRedisConnection<String, String> conn,
                        StatefulRedisConnection<String, String> pipelineConn,
                        String keyPrefix,
                        long batchTtlSeconds,
                        long streamingTtlSeconds) {
        this.conn = conn;
        this.async = conn.async();
        this.pipelineConn = pipelineConn;
        this.pipelineAsync = pipelineConn.async();
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
     * <p>One {@code HSET} plus one {@code EXPIRE} per entity. The
     * connection's auto-flush is disabled around the queue so all
     * commands ship as a single network frame; the helper then
     * blocks on {@link LettuceFutures#awaitAll} so the caller sees
     * the batch as a synchronous operation.</p>
     */
    public int bulkLoad(Map<String, Map<String, Object>> rows, long ttlSeconds) {
        if (rows.isEmpty()) return 0;

        synchronized (pipelineLock) {
            List<RedisFuture<?>> futures = new ArrayList<>(rows.size() * 2);
            pipelineConn.setAutoFlushCommands(false);
            try {
                for (Map.Entry<String, Map<String, Object>> e : rows.entrySet()) {
                    String key = keyFor(e.getKey());
                    Map<String, String> encoded = encode(e.getValue());
                    futures.add(pipelineAsync.hset(key, encoded));
                    futures.add(pipelineAsync.expire(key, ttlSeconds));
                }
                pipelineConn.flushCommands();
                // Await *inside* the auto-flush=false scope so the
                // futures resolve before any other code path can flip
                // the flag. With the dedicated pipelineConn + lock,
                // this is defense in depth; without it (a shared
                // connection design) the order matters for correctness.
                if (!LettuceFutures.awaitAll(BATCH_TIMEOUT,
                        futures.toArray(new RedisFuture<?>[0]))) {
                    throw new IllegalStateException(
                        "bulkLoad: timed out after " + BATCH_TIMEOUT);
                }
            } finally {
                pipelineConn.setAutoFlushCommands(true);
            }
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
        awaitOne(async.hset(keyFor(entityId), Map.of(field, encodeValue(value))));
        batchWritesTotal.incrementAndGet();
    }

    // ---------------------------------------------------------------
    // Streaming ingestion
    // ---------------------------------------------------------------

    /**
     * Write streaming features with a per-field TTL.
     *
     * <p>{@code HSET} and {@code HEXPIRE} are queued on the same
     * connection-level flush so they hit Redis in pipeline order:
     * the {@code HSET} runs first, then {@code HEXPIRE} attaches a
     * TTL to each field that was just written.</p>
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
     * other than {@code 1} means the per-field TTL invariant did
     * not hold — fail loudly rather than silently leave a streaming
     * field with no expiry.</p>
     */
    public void updateStreaming(String entityId, Map<String, Object> fields, long ttlSeconds) {
        if (fields.isEmpty()) return;
        String key = keyFor(entityId);
        Map<String, String> encoded = encode(fields);
        String[] names = encoded.keySet().toArray(new String[0]);

        List<Long> codes;
        synchronized (pipelineLock) {
            pipelineConn.setAutoFlushCommands(false);
            try {
                RedisFuture<Long> hsetFut = pipelineAsync.hset(key, encoded);
                RedisFuture<List<Long>> hexpireFut =
                    pipelineAsync.hexpire(key, ttlSeconds, names);
                pipelineConn.flushCommands();
                // Resolve both futures while auto-flush is still off,
                // so nothing else on this connection can run between
                // the queue and the wait.
                awaitOne(hsetFut);
                codes = awaitOne(hexpireFut);
            } finally {
                pipelineConn.setAutoFlushCommands(true);
            }
        }
        for (Long code : codes) {
            if (code == null || code != 1L) {
                throw new IllegalStateException(
                    "HEXPIRE did not set every field TTL for " + key + ": " + codes);
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
            Map<String, String> all = awaitOne(async.hgetall(key));
            if (all != null) out.putAll(all);
            readsTotal.incrementAndGet();
            readFieldsTotal.addAndGet(out.size());
            return out;
        }
        if (fieldNames.isEmpty()) return out;
        List<KeyValue<String, String>> values = awaitOne(
            async.hmget(key, fieldNames.toArray(new String[0])));
        for (KeyValue<String, String> kv : values) {
            if (kv != null && kv.hasValue()) {
                out.put(kv.getKey(), kv.getValue());
            }
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
     * One round trip for the whole batch via the connection-level
     * flush.
     */
    public Map<String, Map<String, String>> batchGetFeatures(
            List<String> entityIds, List<String> fieldNames) {
        if (entityIds.isEmpty() || fieldNames.isEmpty()) {
            return Collections.emptyMap();
        }
        String[] names = fieldNames.toArray(new String[0]);

        Map<String, Map<String, String>> out = new LinkedHashMap<>();
        long seenFields = 0;
        synchronized (pipelineLock) {
            List<RedisFuture<List<KeyValue<String, String>>>> futures =
                new ArrayList<>(entityIds.size());
            pipelineConn.setAutoFlushCommands(false);
            try {
                for (String id : entityIds) {
                    futures.add(pipelineAsync.hmget(keyFor(id), names));
                }
                pipelineConn.flushCommands();
                // Resolve every future inside the auto-flush=false
                // scope; restoring auto-flush before the awaits would
                // be merely cosmetic on a dedicated connection, but
                // is genuinely unsafe if someone reuses this method's
                // pattern against a shared connection later.
                for (int i = 0; i < entityIds.size(); i++) {
                    List<KeyValue<String, String>> values = awaitOne(futures.get(i));
                    Map<String, String> row = new LinkedHashMap<>();
                    for (KeyValue<String, String> kv : values) {
                        if (kv != null && kv.hasValue()) {
                            row.put(kv.getKey(), kv.getValue());
                            seenFields++;
                        }
                    }
                    out.put(entityIds.get(i), row);
                }
            } finally {
                pipelineConn.setAutoFlushCommands(true);
            }
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
        return awaitOne(async.ttl(keyFor(entityId)));
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
        List<Long> codes = awaitOne(
            async.httl(keyFor(entityId), fieldNames.toArray(new String[0])));
        Map<String, Long> out = new LinkedHashMap<>();
        for (int i = 0; i < fieldNames.size(); i++) {
            // HTTL on a missing key returns a flat list of -2s. Coerce
            // any unexpected nulls defensively in case a future
            // Lettuce release tweaks the reply shape.
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
        ScanCursor cursor = ScanCursor.INITIAL;
        ScanArgs args = ScanArgs.Builder.matches(keyPrefix + "*").limit(200);
        while (true) {
            KeyScanCursor<String> sr = awaitOne(async.scan(cursor, args));
            for (String k : sr.getKeys()) {
                if (k.length() > keyPrefix.length()) {
                    ids.add(k.substring(keyPrefix.length()));
                    if (ids.size() >= limit) {
                        Collections.sort(ids);
                        return ids;
                    }
                }
            }
            if (sr.isFinished()) break;
            cursor = ScanCursor.of(sr.getCursor());
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
        ScanCursor cursor = ScanCursor.INITIAL;
        ScanArgs args = ScanArgs.Builder.matches(keyPrefix + "*").limit(500);
        while (true) {
            KeyScanCursor<String> sr = awaitOne(async.scan(cursor, args));
            count += sr.getKeys().size();
            if (sr.isFinished()) break;
            cursor = ScanCursor.of(sr.getCursor());
        }
        return count;
    }

    public long deleteEntity(String entityId) {
        return awaitOne(async.del(keyFor(entityId)));
    }

    /**
     * Drop every entity under the key prefix. Used by the demo reset
     * path. Scans in batches and issues one variadic {@code DEL} per
     * batch.
     */
    public long reset() {
        long deleted = 0;
        ScanCursor cursor = ScanCursor.INITIAL;
        ScanArgs args = ScanArgs.Builder.matches(keyPrefix + "*").limit(500);
        while (true) {
            KeyScanCursor<String> sr = awaitOne(async.scan(cursor, args));
            List<String> batch = sr.getKeys();
            if (!batch.isEmpty()) {
                deleted += awaitOne(async.del(batch.toArray(new String[0])));
            }
            if (sr.isFinished()) break;
            cursor = ScanCursor.of(sr.getCursor());
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
    // Helpers
    // ---------------------------------------------------------------

    /**
     * Block until a single {@link RedisFuture} resolves, propagating
     * the underlying Redis exception as an unchecked one. Lettuce's
     * {@code LettuceFutures.awaitOrCancel} is the idiomatic single-
     * future blocking helper: it already unwraps execution exceptions
     * into Lettuce's own {@code RedisException} hierarchy, cancels
     * the future on timeout, and restores the thread interrupt flag.
     */
    private static <T> T awaitOne(RedisFuture<T> future) {
        try {
            return LettuceFutures.awaitOrCancel(
                future, BATCH_TIMEOUT.toSeconds(), TimeUnit.SECONDS);
        } catch (RedisException e) {
            // Already unchecked; surface as-is so call sites can
            // catch on the canonical Lettuce hierarchy.
            throw e;
        }
    }

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
