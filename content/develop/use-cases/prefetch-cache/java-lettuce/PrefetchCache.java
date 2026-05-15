import io.lettuce.core.KeyScanCursor;
import io.lettuce.core.RedisFuture;
import io.lettuce.core.ScanArgs;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.async.RedisAsyncCommands;
import io.lettuce.core.api.sync.RedisCommands;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Redis prefetch-cache helper.
 *
 * <p>Each cached entity is stored as a Redis hash under
 * {@code <prefix><id>} with a long safety-net TTL that bounds memory if
 * the sync pipeline ever stops, but is not the freshness mechanism.
 * Freshness comes from the {@link #applyChange(Map)} path, which the
 * sync worker calls every time a primary mutation arrives.</p>
 *
 * <p>Reads run {@code HGETALL} against Redis only. A miss is not a
 * fall-back trigger — the application treats it as an error or a
 * deliberate {@link #invalidate(String)} for testing. In production a
 * sustained miss rate means the prefetch or the sync pipeline is broken,
 * not that the primary should be re-queried on the request path.</p>
 */
public class PrefetchCache {

    /**
     * Serializes every transactional sequence (MULTI/EXEC) because the
     * demo shares a single {@link StatefulRedisConnection} across HTTP
     * handler threads. Lettuce is thread-safe for individual commands,
     * but transactions are connection-scoped: two threads issuing
     * MULTI/EXEC over the same connection would interleave their queued
     * commands. The lock covers {@link #applyChange(Map)}'s upsert
     * transaction so a queued HSET in one thread cannot end up inside
     * another thread's transaction. In production, hand each transactional
     * caller its own connection from a {@code ConnectionPoolSupport} pool
     * and drop the lock.
     */
    private final ReentrantLock txLock = new ReentrantLock();

    private final StatefulRedisConnection<String, String> connection;
    private final String prefix;
    private final int ttlSeconds;

    private final AtomicLong hits = new AtomicLong();
    private final AtomicLong misses = new AtomicLong();
    private final AtomicLong prefetched = new AtomicLong();
    private final AtomicLong syncEventsApplied = new AtomicLong();

    // Sync-lag is recorded as a running total and sample count behind
    // a small lock so the average is computed without losing samples.
    private final Object lagLock = new Object();
    private double syncLagMsTotal = 0.0;
    private long syncLagSamples = 0L;

    public PrefetchCache(StatefulRedisConnection<String, String> connection) {
        this(connection, "cache:category:", 3600);
    }

    public PrefetchCache(
            StatefulRedisConnection<String, String> connection,
            String prefix,
            int ttlSeconds) {
        if (connection == null) {
            throw new IllegalArgumentException("connection is required");
        }
        if (ttlSeconds < 1) {
            throw new IllegalArgumentException("ttlSeconds must be at least 1");
        }
        this.connection = connection;
        this.prefix = (prefix == null || prefix.isEmpty()) ? "cache:category:" : prefix;
        this.ttlSeconds = ttlSeconds;
    }

    public int getTtlSeconds() {
        return ttlSeconds;
    }

    public String getPrefix() {
        return prefix;
    }

    /** Result of a cache read: the record (or null on miss), hit flag, and Redis round-trip in ms. */
    public static final class Result {
        public final Map<String, String> record;
        public final boolean hit;
        public final double redisLatencyMs;

        public Result(Map<String, String> record, boolean hit, double redisLatencyMs) {
            this.record = record;
            this.hit = hit;
            this.redisLatencyMs = redisLatencyMs;
        }
    }

    /**
     * Pipeline {@code DEL} + {@code HSET} + {@code EXPIRE} for every record.
     * Returns the count loaded.
     *
     * <p>The pipeline is non-transactional: it is fast on startup (when
     * nothing is reading the cache) and on the live {@code /reprefetch}
     * path (when the demo pauses the sync worker around the call). Calling
     * {@code bulkLoad} on a cache that is actively being read and written
     * to can briefly expose a key that has been deleted but not yet
     * rewritten; pause the writers first or rewrite this with
     * {@link RedisCommands#multi()} if that matters.</p>
     */
    public int bulkLoad(Iterable<Map<String, String>> records) {
        RedisAsyncCommands<String, String> async = connection.async();
        // Disable auto-flushing so all commands batch into one network
        // round trip, the Lettuce equivalent of a non-transactional
        // pipeline in redis-py. We use the async API here because the
        // sync API blocks on every command, which would defeat batching.
        connection.setAutoFlushCommands(false);
        List<RedisFuture<?>> futures = new ArrayList<>();
        int loaded = 0;
        try {
            for (Map<String, String> record : records) {
                if (record == null) continue;
                String entityId = record.get("id");
                if (entityId == null || entityId.isEmpty()) continue;
                String cacheKey = cacheKey(entityId);
                futures.add(async.del(cacheKey));
                futures.add(async.hset(cacheKey, record));
                futures.add(async.expire(cacheKey, ttlSeconds));
                loaded += 1;
            }
            connection.flushCommands();
            // Wait for every queued command to complete before returning.
            for (RedisFuture<?> future : futures) {
                try {
                    future.get();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("bulkLoad interrupted", e);
                } catch (java.util.concurrent.ExecutionException e) {
                    throw new RuntimeException("bulkLoad command failed", e.getCause());
                }
            }
        } finally {
            connection.setAutoFlushCommands(true);
        }
        if (loaded > 0) {
            prefetched.addAndGet(loaded);
        }
        return loaded;
    }

    /**
     * Return {@code (record, hit, redisLatencyMs)} for an {@code HGETALL}
     * against Redis. Prefetch-cache reads do not fall back to the
     * primary. A miss is a signal that the cache is incomplete, not a
     * trigger to re-query the source. The caller decides how to surface it.
     */
    public Result get(String entityId) {
        RedisCommands<String, String> sync = connection.sync();
        String cacheKey = cacheKey(entityId);

        long startedNs = System.nanoTime();
        Map<String, String> cached = sync.hgetall(cacheKey);
        double redisLatencyMs = (System.nanoTime() - startedNs) / 1_000_000.0;

        if (cached != null && !cached.isEmpty()) {
            hits.incrementAndGet();
            return new Result(cached, true, redisLatencyMs);
        }
        misses.incrementAndGet();
        return new Result(null, false, redisLatencyMs);
    }

    /**
     * Apply a primary change event to Redis.
     *
     * <p>The sync worker calls this for every event the primary emits.
     * For an upsert, the helper rewrites the hash and refreshes the
     * safety-net TTL inside a {@code MULTI}/{@code EXEC} block (serialized
     * by {@link #txLock} so a concurrent caller cannot interleave).
     * For a delete, it removes the cache key.</p>
     */
    public void applyChange(Map<String, Object> change) {
        if (change == null) return;
        Object opObj = change.get("op");
        Object idObj = change.get("id");
        if (!(opObj instanceof String) || !(idObj instanceof String)) return;
        String op = (String) opObj;
        String entityId = (String) idObj;
        if (entityId.isEmpty()) return;

        String cacheKey = cacheKey(entityId);
        RedisCommands<String, String> sync = connection.sync();

        if ("upsert".equals(op)) {
            Object fieldsObj = change.get("fields");
            if (!(fieldsObj instanceof Map)) return;
            @SuppressWarnings("unchecked")
            Map<String, String> fields = (Map<String, String>) fieldsObj;
            if (fields.isEmpty()) {
                // Malformed upsert with no fields. Skip rather than
                // crash the sync worker: HSET with an empty mapping
                // raises in Lettuce, and there is nothing to write
                // anyway. A real CDC consumer would route this to a
                // dead-letter queue and alert; the demo just drops it.
                return;
            }
            txLock.lock();
            try {
                sync.multi();
                sync.del(cacheKey);
                sync.hset(cacheKey, fields);
                sync.expire(cacheKey, ttlSeconds);
                sync.exec();
            } finally {
                txLock.unlock();
            }
        } else if ("delete".equals(op)) {
            sync.del(cacheKey);
        } else {
            return;
        }

        syncEventsApplied.incrementAndGet();
        Object tsObj = change.get("timestamp_ms");
        if (tsObj instanceof Number) {
            double lagMs = Math.max(0.0,
                    System.currentTimeMillis() - ((Number) tsObj).doubleValue());
            synchronized (lagLock) {
                syncLagMsTotal += lagMs;
                syncLagSamples += 1;
            }
        }
    }

    /** Delete one cache key. Demo-only: simulates a broken sync pipeline. */
    public boolean invalidate(String entityId) {
        return connection.sync().del(cacheKey(entityId)) == 1L;
    }

    /** Delete every key under this cache's prefix and return the count. */
    public long clear() {
        RedisCommands<String, String> sync = connection.sync();
        long deleted = 0;
        ScanArgs args = ScanArgs.Builder.matches(prefix + "*").limit(500);
        KeyScanCursor<String> cursor = sync.scan(args);
        while (true) {
            List<String> keys = cursor.getKeys();
            if (keys != null && !keys.isEmpty()) {
                String[] keyArray = keys.toArray(new String[0]);
                deleted += sync.del(keyArray);
            }
            if (cursor.isFinished()) {
                break;
            }
            cursor = sync.scan(cursor, args);
        }
        return deleted;
    }

    /** Return every entity id currently in the cache, sorted. */
    public List<String> ids() {
        RedisCommands<String, String> sync = connection.sync();
        List<String> ids = new ArrayList<>();
        ScanArgs args = ScanArgs.Builder.matches(prefix + "*").limit(500);
        KeyScanCursor<String> cursor = sync.scan(args);
        while (true) {
            List<String> keys = cursor.getKeys();
            if (keys != null) {
                for (String key : keys) {
                    ids.add(stripPrefix(key));
                }
            }
            if (cursor.isFinished()) {
                break;
            }
            cursor = sync.scan(cursor, args);
        }
        Collections.sort(ids);
        return ids;
    }

    public long count() {
        return ids().size();
    }

    /** Remaining TTL in seconds (Redis {@code TTL} semantics: -2 missing, -1 no expiry). */
    public long ttlRemaining(String entityId) {
        return connection.sync().ttl(cacheKey(entityId));
    }

    /**
     * Snapshot of the helper's counters: hits, misses, hit_rate_pct,
     * prefetched, sync_events_applied, sync_lag_ms_avg.
     */
    public Map<String, Object> stats() {
        long h = hits.get();
        long m = misses.get();
        long total = h + m;
        double hitRate = total == 0 ? 0.0 : Math.round(1000.0 * h / total) / 10.0;
        double avgLag;
        synchronized (lagLock) {
            avgLag = syncLagSamples == 0
                    ? 0.0
                    : Math.round(100.0 * syncLagMsTotal / syncLagSamples) / 100.0;
        }
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("hits", h);
        stats.put("misses", m);
        stats.put("hit_rate_pct", hitRate);
        stats.put("prefetched", prefetched.get());
        stats.put("sync_events_applied", syncEventsApplied.get());
        stats.put("sync_lag_ms_avg", avgLag);
        return stats;
    }

    public void resetStats() {
        hits.set(0);
        misses.set(0);
        prefetched.set(0);
        syncEventsApplied.set(0);
        synchronized (lagLock) {
            syncLagMsTotal = 0.0;
            syncLagSamples = 0L;
        }
    }

    private String cacheKey(String entityId) {
        return prefix + entityId;
    }

    private String stripPrefix(String key) {
        return key.startsWith(prefix) ? key.substring(prefix.length()) : key;
    }
}
