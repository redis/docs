import java.security.SecureRandom;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Function;

import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.Transaction;
import redis.clients.jedis.exceptions.JedisException;

/**
 * Cache-aside helper backed by Redis hashes with TTL and Lua-backed
 * single-flight stampede protection.
 */
public class RedisCache {

    private static final String ACQUIRE_LOCK_SCRIPT =
            "if redis.call('SET', KEYS[1], ARGV[1], 'NX', 'PX', ARGV[2]) then\n" +
            "    return 1\n" +
            "end\n" +
            "return 0\n";

    private static final String RELEASE_LOCK_SCRIPT =
            "if redis.call('GET', KEYS[1]) == ARGV[1] then\n" +
            "    return redis.call('DEL', KEYS[1])\n" +
            "end\n" +
            "return 0\n";

    private static final SecureRandom RANDOM = new SecureRandom();

    private final JedisPool pool;
    private final String prefix;
    private final int ttl;
    private final int lockTtlMs;
    private final int waitPollMs;

    private final AtomicLong hits = new AtomicLong();
    private final AtomicLong misses = new AtomicLong();
    private final AtomicLong stampedesSuppressed = new AtomicLong();

    public RedisCache(JedisPool pool) {
        this(pool, "cache:product:", 30, 2000, 25);
    }

    public RedisCache(JedisPool pool, String prefix, int ttl, int lockTtlMs, int waitPollMs) {
        if (pool == null) {
            throw new IllegalArgumentException("pool is required");
        }
        if (ttl < 1) {
            throw new IllegalArgumentException("ttl must be at least 1 second");
        }
        this.pool = pool;
        this.prefix = (prefix == null || prefix.isEmpty()) ? "cache:product:" : prefix;
        this.ttl = ttl;
        this.lockTtlMs = lockTtlMs;
        this.waitPollMs = waitPollMs;
    }

    public int getTtl() {
        return ttl;
    }

    /** Result of a cache-aside read. */
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

    /** Read through the cache, calling loader on a miss. */
    public Result get(String entityId, Function<String, Map<String, String>> loader) {
        String cacheKey = cacheKey(entityId);
        Map<String, String> cached;
        long startedNs = System.nanoTime();

        try (Jedis jedis = pool.getResource()) {
            cached = jedis.hgetAll(cacheKey);
        }
        double redisLatencyMs = (System.nanoTime() - startedNs) / 1_000_000.0;

        if (cached != null && !cached.isEmpty()) {
            hits.incrementAndGet();
            return new Result(cached, true, redisLatencyMs);
        }

        misses.incrementAndGet();
        Map<String, String> record = loadWithSingleFlight(entityId, loader);
        return new Result(record, false, redisLatencyMs);
    }

    /** Delete the cached entry for entityId. */
    public boolean invalidate(String entityId) {
        try (Jedis jedis = pool.getResource()) {
            return jedis.del(cacheKey(entityId)) == 1L;
        }
    }

    /**
     * Update a single field in place if the entry is cached.
     *
     * <p>Uses WATCH/MULTI/EXEC so a concurrent invalidate or repopulate cannot
     * interleave with the field write.</p>
     */
    public boolean updateField(String entityId, String field, String value) {
        String cacheKey = cacheKey(entityId);
        while (true) {
            try (Jedis jedis = pool.getResource()) {
                jedis.watch(cacheKey);
                if (!jedis.exists(cacheKey)) {
                    jedis.unwatch();
                    return false;
                }
                Transaction tx = jedis.multi();
                tx.hset(cacheKey, field, value);
                tx.expire(cacheKey, ttl);
                List<Object> result = tx.exec();
                if (result == null) {
                    continue; // WATCH detected a change — retry.
                }
                return true;
            }
        }
    }

    /** Remaining TTL in seconds, or -2/-1 per Redis semantics. */
    public long ttlRemaining(String entityId) {
        try (Jedis jedis = pool.getResource()) {
            return jedis.ttl(cacheKey(entityId));
        }
    }

    /** Hit/miss/stampede counters with the derived hit rate. */
    public Map<String, Object> stats() {
        long h = hits.get();
        long m = misses.get();
        long s = stampedesSuppressed.get();
        long total = h + m;
        double hitRate = total == 0 ? 0.0 : ((long) (1000.0 * h / total)) / 10.0;
        Map<String, Object> stats = new HashMap<>();
        stats.put("hits", h);
        stats.put("misses", m);
        stats.put("stampedes_suppressed", s);
        stats.put("hit_rate_pct", hitRate);
        return stats;
    }

    public void resetStats() {
        hits.set(0);
        misses.set(0);
        stampedesSuppressed.set(0);
    }

    private Map<String, String> loadWithSingleFlight(
            String entityId,
            Function<String, Map<String, String>> loader) {
        String cacheKey = cacheKey(entityId);
        String lockKey = lockKey(entityId);
        String token = randomToken();

        try (Jedis jedis = pool.getResource()) {
            Object acquired = jedis.eval(
                    ACQUIRE_LOCK_SCRIPT,
                    List.of(lockKey),
                    List.of(token, Integer.toString(lockTtlMs)));
            if (asInt(acquired) == 1) {
                try {
                    Map<String, String> record = loader.apply(entityId);
                    if (record == null) {
                        return null;
                    }
                    Transaction tx = jedis.multi();
                    tx.del(cacheKey);
                    tx.hset(cacheKey, record);
                    tx.expire(cacheKey, ttl);
                    tx.exec();
                    return record;
                } finally {
                    try {
                        jedis.eval(RELEASE_LOCK_SCRIPT, List.of(lockKey), List.of(token));
                    } catch (JedisException ignored) {
                        // Lock will expire on its own.
                    }
                }
            }
        }

        stampedesSuppressed.incrementAndGet();
        long deadline = System.nanoTime() + (long) lockTtlMs * 1_000_000L;
        while (System.nanoTime() < deadline) {
            try {
                Thread.sleep(waitPollMs);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return null;
            }
            try (Jedis jedis = pool.getResource()) {
                Map<String, String> cached = jedis.hgetAll(cacheKey);
                if (cached != null && !cached.isEmpty()) {
                    return cached;
                }
            }
        }
        return loader.apply(entityId);
    }

    private static int asInt(Object value) {
        if (value instanceof Long) {
            return ((Long) value).intValue();
        }
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        return 0;
    }

    private static String randomToken() {
        byte[] bytes = new byte[8];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String cacheKey(String id) {
        return prefix + id;
    }

    private String lockKey(String id) {
        return "lock:" + prefix + id;
    }
}
