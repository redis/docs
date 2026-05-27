import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.Pipeline;
import redis.clients.jedis.Response;

/**
 * Redis-backed session storage for Java web applications.
 *
 * <p>This class stores session data in Redis hashes and uses key expiration
 * to remove inactive sessions automatically.</p>
 */
public class RedisSessionStore {

    private static final Set<String> RESERVED_SESSION_FIELDS = Set.of(
            "created_at",
            "last_accessed_at",
            "session_ttl"
    );

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final DateTimeFormatter TIMESTAMP_FORMATTER =
            DateTimeFormatter.ofPattern("uuuu-MM-dd'T'HH:mm:ssXXX");

    private final JedisPool jedisPool;
    private final String prefix;
    private final int ttl;

    public RedisSessionStore(JedisPool jedisPool, String prefix, int ttl) {
        if (jedisPool == null) {
            throw new IllegalArgumentException("jedisPool is required");
        }

        this.jedisPool = jedisPool;
        this.prefix = prefix == null || prefix.isEmpty() ? "session:" : prefix;
        this.ttl = normalizeTtl(ttl);
    }

    public RedisSessionStore(JedisPool jedisPool) {
        this(jedisPool, "session:", 1800);
    }

    private int normalizeTtl(Integer value) {
        int normalized = value == null ? ttl : value;
        if (normalized < 1) {
            throw new IllegalArgumentException("TTL must be at least 1 second");
        }
        return normalized;
    }

    private String sessionKey(String sessionId) {
        return prefix + sessionId;
    }

    private String timestamp() {
        return OffsetDateTime.now(ZoneOffset.UTC)
                .withNano(0)
                .format(TIMESTAMP_FORMATTER);
    }

    private boolean isValidSession(Map<String, String> session) {
        if (session == null || session.isEmpty()) {
            return false;
        }

        for (String field : RESERVED_SESSION_FIELDS) {
            if (!session.containsKey(field)) {
                return false;
            }
        }

        return true;
    }

    private String randomSessionId() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public String createSession(Map<String, String> data, Integer ttlOverride) {
        String sessionId = randomSessionId();
        String key = sessionKey(sessionId);
        String now = timestamp();
        int sessionTtl = normalizeTtl(ttlOverride);

        Map<String, String> payload = new HashMap<>();
        if (data != null) {
            for (Map.Entry<String, String> entry : data.entrySet()) {
                if (!RESERVED_SESSION_FIELDS.contains(entry.getKey())) {
                    payload.put(entry.getKey(), String.valueOf(entry.getValue()));
                }
            }
        }

        payload.put("created_at", now);
        payload.put("last_accessed_at", now);
        payload.put("session_ttl", String.valueOf(sessionTtl));

        try (Jedis jedis = jedisPool.getResource()) {
            Pipeline pipeline = jedis.pipelined();
            pipeline.hset(key, payload);
            pipeline.expire(key, sessionTtl);
            pipeline.sync();
        }

        return sessionId;
    }

    public Integer getConfiguredTtl(String sessionId) {
        try (Jedis jedis = jedisPool.getResource()) {
            String storedTtl = jedis.hget(sessionKey(sessionId), "session_ttl");
            if (storedTtl == null) {
                return null;
            }

            return normalizeTtl(Integer.parseInt(storedTtl));
        }
    }

    public Map<String, String> getSession(String sessionId, boolean refreshTtl) {
        String key = sessionKey(sessionId);

        try (Jedis jedis = jedisPool.getResource()) {
            Map<String, String> session = jedis.hgetAll(key);
            if (!isValidSession(session)) {
                return null;
            }

            if (!refreshTtl) {
                return session;
            }

            int sessionTtl = normalizeTtl(Integer.valueOf(session.get("session_ttl")));
            Pipeline pipeline = jedis.pipelined();
            pipeline.hset(key, "last_accessed_at", timestamp());
            pipeline.expire(key, sessionTtl);
            Response<Map<String, String>> refreshed = pipeline.hgetAll(key);
            pipeline.sync();

            return isValidSession(refreshed.get()) ? refreshed.get() : null;
        }
    }

    public boolean updateSession(String sessionId, Map<String, String> data) {
        String key = sessionKey(sessionId);

        try (Jedis jedis = jedisPool.getResource()) {
            Map<String, String> session = jedis.hgetAll(key);
            if (!isValidSession(session)) {
                return false;
            }

            Map<String, String> payload = new HashMap<>();
            for (Map.Entry<String, String> entry : data.entrySet()) {
                if (!RESERVED_SESSION_FIELDS.contains(entry.getKey())) {
                    payload.put(entry.getKey(), String.valueOf(entry.getValue()));
                }
            }

            if (payload.isEmpty()) {
                return true;
            }

            int sessionTtl = normalizeTtl(Integer.valueOf(session.get("session_ttl")));
            payload.put("last_accessed_at", timestamp());

            Pipeline pipeline = jedis.pipelined();
            pipeline.hset(key, payload);
            pipeline.expire(key, sessionTtl);
            pipeline.sync();
            return true;
        }
    }

    public Long incrementField(String sessionId, String field, long amount) {
        String key = sessionKey(sessionId);

        try (Jedis jedis = jedisPool.getResource()) {
            Map<String, String> session = jedis.hgetAll(key);
            if (!isValidSession(session)) {
                return null;
            }

            int sessionTtl = normalizeTtl(Integer.valueOf(session.get("session_ttl")));
            Pipeline pipeline = jedis.pipelined();
            Response<Long> value = pipeline.hincrBy(key, field, amount);
            pipeline.hset(key, "last_accessed_at", timestamp());
            pipeline.expire(key, sessionTtl);
            pipeline.sync();
            return value.get();
        }
    }

    public boolean setSessionTtl(String sessionId, int ttlOverride) {
        String key = sessionKey(sessionId);
        int sessionTtl = normalizeTtl(ttlOverride);

        try (Jedis jedis = jedisPool.getResource()) {
            Map<String, String> session = jedis.hgetAll(key);
            if (!isValidSession(session)) {
                return false;
            }

            Map<String, String> payload = Map.of(
                    "session_ttl", String.valueOf(sessionTtl),
                    "last_accessed_at", timestamp()
            );

            Pipeline pipeline = jedis.pipelined();
            pipeline.hset(key, payload);
            pipeline.expire(key, sessionTtl);
            pipeline.sync();
            return true;
        }
    }

    public boolean deleteSession(String sessionId) {
        try (Jedis jedis = jedisPool.getResource()) {
            return jedis.del(sessionKey(sessionId)) == 1L;
        }
    }

    public long getTtl(String sessionId) {
        try (Jedis jedis = jedisPool.getResource()) {
            return jedis.ttl(sessionKey(sessionId));
        }
    }
}
