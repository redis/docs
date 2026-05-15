import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.Pipeline;
import redis.clients.jedis.Transaction;
import redis.clients.jedis.params.ScanParams;
import redis.clients.jedis.resps.ScanResult;

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
 * fall-back trigger &mdash; the application treats it as an error or a
 * deliberate {@link #invalidate(String)} for testing. In production a
 * sustained miss rate means the prefetch or the sync pipeline is broken,
 * not that the primary should be re-queried on the request path.</p>
 */
public class PrefetchCache {

    public static final String DEFAULT_PREFIX = "cache:category:";
    public static final int DEFAULT_TTL_SECONDS = 3600;

    private final JedisPool pool;
    private final String prefix;
    private final int ttlSeconds;

    private final Object statsLock = new Object();
    private long hits;
    private long misses;
    private long prefetched;
    private long syncEventsApplied;
    private double syncLagMsTotal;
    private long syncLagSamples;

    public PrefetchCache(JedisPool pool) {
        this(pool, DEFAULT_PREFIX, DEFAULT_TTL_SECONDS);
    }

    public PrefetchCache(JedisPool pool, String prefix, int ttlSeconds) {
        if (pool == null) {
            throw new IllegalArgumentException("pool is required");
        }
        if (ttlSeconds < 1) {
            throw new IllegalArgumentException("ttlSeconds must be at least 1 second");
        }
        this.pool = pool;
        this.prefix = (prefix == null || prefix.isEmpty()) ? DEFAULT_PREFIX : prefix;
        this.ttlSeconds = ttlSeconds;
    }

    public String getPrefix() {
        return prefix;
    }

    public int getTtlSeconds() {
        return ttlSeconds;
    }

    /** Result of an {@link #get(String)} read. */
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
     * path (when the demo pauses the sync worker around the call).
     * Calling {@code bulkLoad} on a cache that is actively being read
     * and written to can briefly expose a key that has been deleted but
     * not yet rewritten; pause the writers first or rewrite this with a
     * transaction if that matters.</p>
     */
    public int bulkLoad(Iterable<Map<String, String>> records) {
        int loaded = 0;
        try (Jedis jedis = pool.getResource()) {
            Pipeline pipe = jedis.pipelined();
            for (Map<String, String> record : records) {
                if (record == null) {
                    continue;
                }
                String entityId = record.get("id");
                if (entityId == null || entityId.isEmpty()) {
                    continue;
                }
                String cacheKey = cacheKey(entityId);
                pipe.del(cacheKey);
                pipe.hset(cacheKey, record);
                pipe.expire(cacheKey, ttlSeconds);
                loaded++;
            }
            if (loaded > 0) {
                pipe.sync();
            }
        }
        synchronized (statsLock) {
            prefetched += loaded;
        }
        return loaded;
    }

    /**
     * Run {@code HGETALL} against Redis and return the cached record.
     *
     * <p>Prefetch-cache reads do not fall back to the primary. A miss is
     * a signal that the cache is incomplete, not a trigger to re-query
     * the source. The caller decides how to surface it.</p>
     */
    public Result get(String entityId) {
        String cacheKey = cacheKey(entityId);
        long startedNs = System.nanoTime();
        Map<String, String> cached;
        try (Jedis jedis = pool.getResource()) {
            cached = jedis.hgetAll(cacheKey);
        }
        double redisLatencyMs = (System.nanoTime() - startedNs) / 1_000_000.0;

        if (cached != null && !cached.isEmpty()) {
            synchronized (statsLock) {
                hits++;
            }
            return new Result(cached, true, redisLatencyMs);
        }
        synchronized (statsLock) {
            misses++;
        }
        return new Result(null, false, redisLatencyMs);
    }

    /**
     * Apply a primary change event to Redis.
     *
     * <p>The sync worker calls this for every event the primary emits.
     * For an upsert, the helper rewrites the hash and refreshes the
     * safety-net TTL inside a {@code MULTI}/{@code EXEC} transaction so
     * the cache never holds a stale mix of old and new fields. For a
     * delete, it removes the cache key.</p>
     */
    public void applyChange(Map<String, Object> change) {
        if (change == null) {
            return;
        }
        Object op = change.get("op");
        Object idValue = change.get("id");
        if (!(idValue instanceof String)) {
            return;
        }
        String entityId = (String) idValue;
        if (entityId.isEmpty()) {
            return;
        }
        String cacheKey = cacheKey(entityId);

        if ("upsert".equals(op)) {
            @SuppressWarnings("unchecked")
            Map<String, String> fields = (Map<String, String>) change.get("fields");
            if (fields == null || fields.isEmpty()) {
                // Malformed upsert with no fields. Skip rather than crash
                // the sync worker: HSET with an empty map raises and there
                // is nothing to write anyway. A real CDC consumer would
                // route this to a dead-letter queue and alert; the demo
                // just drops it.
                return;
            }
            try (Jedis jedis = pool.getResource()) {
                Transaction tx = jedis.multi();
                tx.del(cacheKey);
                tx.hset(cacheKey, fields);
                tx.expire(cacheKey, ttlSeconds);
                tx.exec();
            }
        } else if ("delete".equals(op)) {
            try (Jedis jedis = pool.getResource()) {
                jedis.del(cacheKey);
            }
        } else {
            return;
        }

        synchronized (statsLock) {
            syncEventsApplied++;
            Object ts = change.get("timestamp_ms");
            if (ts instanceof Number) {
                double timestampMs = ((Number) ts).doubleValue();
                double lagMs = Math.max(0.0, (System.currentTimeMillis()) - timestampMs);
                syncLagMsTotal += lagMs;
                syncLagSamples++;
            }
        }
    }

    /** Delete one cache key. Demo-only: simulates a broken sync pipeline. */
    public boolean invalidate(String entityId) {
        try (Jedis jedis = pool.getResource()) {
            return jedis.del(cacheKey(entityId)) == 1L;
        }
    }

    /** Delete every key under this cache's prefix and return the count. */
    public int clear() {
        int deleted = 0;
        String match = prefix + "*";
        ScanParams params = new ScanParams().match(match).count(500);
        try (Jedis jedis = pool.getResource()) {
            String cursor = ScanParams.SCAN_POINTER_START;
            do {
                ScanResult<String> scan = jedis.scan(cursor, params);
                cursor = scan.getCursor();
                List<String> keys = scan.getResult();
                if (keys != null && !keys.isEmpty()) {
                    // DEL accepts multiple keys; one round trip per batch.
                    deleted += (int) jedis.del(keys.toArray(new String[0]));
                }
            } while (!ScanParams.SCAN_POINTER_START.equals(cursor));
        }
        return deleted;
    }

    /** Return every entity id currently in the cache, sorted. */
    public List<String> ids() {
        List<String> result = new ArrayList<>();
        ScanParams params = new ScanParams().match(prefix + "*").count(500);
        try (Jedis jedis = pool.getResource()) {
            String cursor = ScanParams.SCAN_POINTER_START;
            do {
                ScanResult<String> scan = jedis.scan(cursor, params);
                cursor = scan.getCursor();
                for (String key : scan.getResult()) {
                    result.add(stripPrefix(key));
                }
            } while (!ScanParams.SCAN_POINTER_START.equals(cursor));
        }
        Collections.sort(result);
        return result;
    }

    public int count() {
        int n = 0;
        ScanParams params = new ScanParams().match(prefix + "*").count(500);
        try (Jedis jedis = pool.getResource()) {
            String cursor = ScanParams.SCAN_POINTER_START;
            do {
                ScanResult<String> scan = jedis.scan(cursor, params);
                cursor = scan.getCursor();
                n += scan.getResult().size();
            } while (!ScanParams.SCAN_POINTER_START.equals(cursor));
        }
        return n;
    }

    public long ttlRemaining(String entityId) {
        try (Jedis jedis = pool.getResource()) {
            return jedis.ttl(cacheKey(entityId));
        }
    }

    /** Hit/miss + sync counters with derived hit-rate and average sync lag. */
    public Map<String, Object> stats() {
        synchronized (statsLock) {
            long total = hits + misses;
            double hitRate = total == 0 ? 0.0
                    : Math.round(1000.0 * hits / total) / 10.0;
            double avgLag = syncLagSamples == 0 ? 0.0
                    : Math.round(100.0 * syncLagMsTotal / syncLagSamples) / 100.0;
            Map<String, Object> stats = new LinkedHashMap<>();
            stats.put("hits", hits);
            stats.put("misses", misses);
            stats.put("hit_rate_pct", hitRate);
            stats.put("prefetched", prefetched);
            stats.put("sync_events_applied", syncEventsApplied);
            stats.put("sync_lag_ms_avg", avgLag);
            return stats;
        }
    }

    public void resetStats() {
        synchronized (statsLock) {
            hits = 0;
            misses = 0;
            prefetched = 0;
            syncEventsApplied = 0;
            syncLagMsTotal = 0.0;
            syncLagSamples = 0;
        }
    }

    private String cacheKey(String entityId) {
        return prefix + entityId;
    }

    private String stripPrefix(String key) {
        return key.startsWith(prefix) ? key.substring(prefix.length()) : key;
    }
}
