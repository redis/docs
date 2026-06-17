import io.lettuce.core.ScriptOutputType;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.sync.RedisCommands;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.locks.ReentrantLock;
import java.util.function.Function;

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

    private final StatefulRedisConnection<String, String> connection;
    private final String prefix;
    private final int ttl;
    private final int lockTtlMs;
    private final int waitPollMs;

    private final AtomicLong hits = new AtomicLong();
    private final AtomicLong misses = new AtomicLong();
    private final AtomicLong stampedesSuppressed = new AtomicLong();

    /**
     * Serializes every MULTI/EXEC block because the demo shares a single
     * StatefulRedisConnection across threads — transactions are
     * connection-scoped, so concurrent MULTI blocks on the same connection
     * would queue commands into each other. Both the cache-miss repopulate
     * (in loadWithSingleFlight) and updateField acquire this lock. In
     * production, hand each transaction its own connection from a pool
     * instead and drop the lock.
     */
    private final ReentrantLock txLock = new ReentrantLock();

    public RedisCache(StatefulRedisConnection<String, String> connection) {
        this(connection, "cache:product:", 30, 2000, 25);
    }

    public RedisCache(
            StatefulRedisConnection<String, String> connection,
            String prefix,
            int ttl,
            int lockTtlMs,
            int waitPollMs) {
        if (connection == null) {
            throw new IllegalArgumentException("connection is required");
        }
        if (ttl < 1) {
            throw new IllegalArgumentException("ttl must be at least 1 second");
        }
        this.connection = connection;
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
        Map<String, String> record = loadWithSingleFlight(entityId, loader);
        return new Result(record, false, redisLatencyMs);
    }

    public boolean invalidate(String entityId) {
        return connection.sync().del(cacheKey(entityId)) == 1L;
    }

    /**
     * Update a single field in place if the entry is cached.
     *
     * <p>Uses MULTI/EXEC with WATCH so a concurrent invalidate or repopulate
     * cannot interleave with the field write.</p>
     */
    public boolean updateField(String entityId, String field, String value) {
        RedisCommands<String, String> sync = connection.sync();
        String cacheKey = cacheKey(entityId);
        txLock.lock();
        try {
            while (true) {
                sync.watch(cacheKey);
                if (sync.exists(cacheKey) == 0L) {
                    sync.unwatch();
                    return false;
                }
                sync.multi();
                sync.hset(cacheKey, field, value);
                sync.expire(cacheKey, ttl);
                io.lettuce.core.TransactionResult result = sync.exec();
                if (result.wasDiscarded()) {
                    continue; // WATCH detected a change — retry.
                }
                return true;
            }
        } finally {
            txLock.unlock();
        }
    }

    public long ttlRemaining(String entityId) {
        return connection.sync().ttl(cacheKey(entityId));
    }

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
        RedisCommands<String, String> sync = connection.sync();
        String cacheKey = cacheKey(entityId);
        String lockKey = lockKey(entityId);
        String token = randomToken();

        Long acquired = sync.eval(
                ACQUIRE_LOCK_SCRIPT,
                ScriptOutputType.INTEGER,
                new String[]{lockKey},
                token,
                Integer.toString(lockTtlMs));
        if (acquired != null && acquired == 1L) {
            try {
                Map<String, String> record = loader.apply(entityId);
                if (record == null) {
                    return null;
                }
                // Serialize MULTI/EXEC on the shared connection. The lock
                // also covers updateField, so a repopulate cannot interleave
                // with a field update on the same connection.
                txLock.lock();
                try {
                    sync.multi();
                    sync.del(cacheKey);
                    sync.hset(cacheKey, record);
                    sync.expire(cacheKey, ttl);
                    sync.exec();
                } finally {
                    txLock.unlock();
                }
                return record;
            } finally {
                try {
                    sync.eval(
                            RELEASE_LOCK_SCRIPT,
                            ScriptOutputType.INTEGER,
                            new String[]{lockKey},
                            token);
                } catch (Exception ignored) {
                    // Lock will expire on its own.
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
            Map<String, String> cached = sync.hgetall(cacheKey);
            if (cached != null && !cached.isEmpty()) {
                return cached;
            }
        }
        return loader.apply(entityId);
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
