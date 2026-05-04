import io.lettuce.core.api.async.RedisAsyncCommands;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;

/**
 * Redis-backed session store using Lettuce asynchronous commands.
 */
public class AsyncSessionStore {

    private static final Set<String> RESERVED_SESSION_FIELDS = Set.of(
            "created_at",
            "last_accessed_at",
            "session_ttl"
    );

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final DateTimeFormatter TIMESTAMP_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    private final RedisAsyncCommands<String, String> commands;
    private final String prefix;
    private final int ttl;

    public AsyncSessionStore(
            RedisAsyncCommands<String, String> commands,
            String prefix,
            int ttl
    ) {
        if (commands == null) {
            throw new IllegalArgumentException("commands is required");
        }

        this.commands = commands;
        this.prefix = prefix == null || prefix.isEmpty() ? "session:" : prefix;
        this.ttl = normalizeTtl(ttl);
    }

    public AsyncSessionStore(RedisAsyncCommands<String, String> commands) {
        this(commands, "session:", 1800);
    }

    public CompletableFuture<String> createSession(Map<String, String> data, Integer ttlOverride) {
        String sessionId = createSessionId();
        String key = sessionKey(sessionId);
        String now = timestamp();
        int sessionTtl = normalizeTtl(ttlOverride);
        Map<String, String> payload = sessionPayload(data, now, sessionTtl);

        return commands.hset(key, payload)
                .toCompletableFuture()
                .thenCompose(ignore -> commands.expire(key, sessionTtl).toCompletableFuture())
                .thenApply(ignore -> sessionId);
    }

    public CompletableFuture<Integer> getConfiguredTtl(String sessionId) {
        return commands.hget(sessionKey(sessionId), "session_ttl")
                .toCompletableFuture()
                .thenApply(storedTtl -> storedTtl == null ? null : normalizeTtl(Integer.parseInt(storedTtl)));
    }

    public CompletableFuture<Map<String, String>> getSession(String sessionId, boolean refreshTtl) {
        String key = sessionKey(sessionId);

        return commands.hgetall(key).toCompletableFuture().thenCompose(session -> {
            if (!isValidSession(session)) {
                return CompletableFuture.completedFuture(null);
            }

            if (!refreshTtl) {
                return CompletableFuture.completedFuture(session);
            }

            int sessionTtl = normalizeTtl(Integer.parseInt(session.get("session_ttl")));
            return commands.hset(key, "last_accessed_at", timestamp()).toCompletableFuture()
                    .thenCompose(ignore -> commands.expire(key, sessionTtl).toCompletableFuture())
                    .thenCompose(ignore -> commands.hgetall(key).toCompletableFuture())
                    .thenApply(refreshed -> isValidSession(refreshed) ? refreshed : null);
        });
    }

    public CompletableFuture<Boolean> updateSession(String sessionId, Map<String, String> data) {
        String key = sessionKey(sessionId);

        return commands.hgetall(key).toCompletableFuture().thenCompose(session -> {
            if (!isValidSession(session)) {
                return CompletableFuture.completedFuture(false);
            }

            Map<String, String> payload = userPayload(data);
            if (payload.isEmpty()) {
                return CompletableFuture.completedFuture(true);
            }

            int sessionTtl = normalizeTtl(Integer.parseInt(session.get("session_ttl")));
            payload.put("last_accessed_at", timestamp());

            return commands.hset(key, payload).toCompletableFuture()
                    .thenCompose(ignore -> commands.expire(key, sessionTtl).toCompletableFuture())
                    .thenApply(ignore -> true);
        });
    }

    public CompletableFuture<Long> incrementField(String sessionId, String field, long amount) {
        String key = sessionKey(sessionId);

        return commands.hgetall(key).toCompletableFuture().thenCompose(session -> {
            if (!isValidSession(session)) {
                return CompletableFuture.completedFuture(null);
            }

            int sessionTtl = normalizeTtl(Integer.parseInt(session.get("session_ttl")));
            return commands.hincrby(key, field, amount).toCompletableFuture()
                    .thenCompose(value -> commands.hset(key, "last_accessed_at", timestamp()).toCompletableFuture()
                            .thenCompose(ignore -> commands.expire(key, sessionTtl).toCompletableFuture())
                            .thenApply(ignore -> value));
        });
    }

    public CompletableFuture<Boolean> setSessionTtl(String sessionId, int ttlOverride) {
        String key = sessionKey(sessionId);
        int sessionTtl = normalizeTtl(ttlOverride);

        return commands.hgetall(key).toCompletableFuture().thenCompose(session -> {
            if (!isValidSession(session)) {
                return CompletableFuture.completedFuture(false);
            }

            Map<String, String> payload = Map.of(
                    "session_ttl", String.valueOf(sessionTtl),
                    "last_accessed_at", timestamp()
            );

            return commands.hset(key, payload).toCompletableFuture()
                    .thenCompose(ignore -> commands.expire(key, sessionTtl).toCompletableFuture())
                    .thenApply(ignore -> true);
        });
    }

    public CompletableFuture<Boolean> deleteSession(String sessionId) {
        return commands.del(sessionKey(sessionId))
                .toCompletableFuture()
                .thenApply(deleted -> deleted == 1L);
    }

    public CompletableFuture<Long> getTtl(String sessionId) {
        return commands.ttl(sessionKey(sessionId)).toCompletableFuture();
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
        return OffsetDateTime.now(ZoneOffset.UTC).withNano(0).format(TIMESTAMP_FORMATTER);
    }

    private String createSessionId() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
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

    private Map<String, String> sessionPayload(Map<String, String> data, String now, int sessionTtl) {
        Map<String, String> payload = userPayload(data);
        payload.put("created_at", now);
        payload.put("last_accessed_at", now);
        payload.put("session_ttl", String.valueOf(sessionTtl));
        return payload;
    }

    private Map<String, String> userPayload(Map<String, String> data) {
        Map<String, String> payload = new HashMap<>();
        if (data != null) {
            for (Map.Entry<String, String> entry : data.entrySet()) {
                if (!RESERVED_SESSION_FIELDS.contains(entry.getKey())) {
                    payload.put(entry.getKey(), String.valueOf(entry.getValue()));
                }
            }
        }
        return payload;
    }
}
