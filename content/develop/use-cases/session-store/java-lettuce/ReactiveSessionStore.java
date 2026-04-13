import io.lettuce.core.api.reactive.RedisReactiveCommands;
import reactor.core.publisher.Mono;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * Redis-backed session store using Lettuce reactive commands.
 */
public class ReactiveSessionStore {

    private static final Set<String> RESERVED_SESSION_FIELDS = Set.of(
            "created_at",
            "last_accessed_at",
            "session_ttl"
    );

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final DateTimeFormatter TIMESTAMP_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    private final RedisReactiveCommands<String, String> commands;
    private final String prefix;
    private final int ttl;

    public ReactiveSessionStore(
            RedisReactiveCommands<String, String> commands,
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

    public ReactiveSessionStore(RedisReactiveCommands<String, String> commands) {
        this(commands, "session:", 1800);
    }

    public Mono<String> createSession(Map<String, String> data, Integer ttlOverride) {
        String sessionId = createSessionId();
        String key = sessionKey(sessionId);
        String now = timestamp();
        int sessionTtl = normalizeTtl(ttlOverride);
        Map<String, String> payload = sessionPayload(data, now, sessionTtl);

        return commands.hset(key, payload)
                .then(commands.expire(key, sessionTtl))
                .thenReturn(sessionId);
    }

    public Mono<Integer> getConfiguredTtl(String sessionId) {
        return commands.hget(sessionKey(sessionId), "session_ttl")
                .map(storedTtl -> normalizeTtl(Integer.parseInt(storedTtl)))
                .switchIfEmpty(Mono.empty());
    }

    public Mono<Map<String, String>> getSession(String sessionId, boolean refreshTtl) {
        String key = sessionKey(sessionId);

        return commands.hgetall(key)
                .collectMap(kv -> kv.getKey(), kv -> kv.getValue())
                .flatMap(session -> {
                    if (!isValidSession(session)) {
                        return Mono.empty();
                    }

                    if (!refreshTtl) {
                        return Mono.just(session);
                    }

                    int sessionTtl = normalizeTtl(Integer.parseInt(session.get("session_ttl")));
                    return commands.hset(key, "last_accessed_at", timestamp())
                            .then(commands.expire(key, sessionTtl))
                            .thenMany(commands.hgetall(key))
                            .collectMap(kv -> kv.getKey(), kv -> kv.getValue())
                            .flatMap(refreshed -> isValidSession(refreshed) ? Mono.just(refreshed) : Mono.empty());
                });
    }

    public Mono<Boolean> updateSession(String sessionId, Map<String, String> data) {
        String key = sessionKey(sessionId);

        return commands.hgetall(key)
                .collectMap(kv -> kv.getKey(), kv -> kv.getValue())
                .flatMap(session -> {
                    if (!isValidSession(session)) {
                        return Mono.just(false);
                    }

                    Map<String, String> payload = userPayload(data);
                    if (payload.isEmpty()) {
                        return Mono.just(true);
                    }

                    int sessionTtl = normalizeTtl(Integer.parseInt(session.get("session_ttl")));
                    payload.put("last_accessed_at", timestamp());

                    return commands.hset(key, payload)
                            .then(commands.expire(key, sessionTtl))
                            .thenReturn(true);
                });
    }

    public Mono<Long> incrementField(String sessionId, String field, long amount) {
        String key = sessionKey(sessionId);

        return commands.hgetall(key)
                .collectMap(kv -> kv.getKey(), kv -> kv.getValue())
                .flatMap(session -> {
                    if (!isValidSession(session)) {
                        return Mono.empty();
                    }

                    int sessionTtl = normalizeTtl(Integer.parseInt(session.get("session_ttl")));
                    return commands.hincrby(key, field, amount)
                            .flatMap(value -> commands.hset(key, "last_accessed_at", timestamp())
                                    .then(commands.expire(key, sessionTtl))
                                    .thenReturn(value));
                });
    }

    public Mono<Boolean> setSessionTtl(String sessionId, int ttlOverride) {
        String key = sessionKey(sessionId);
        int sessionTtl = normalizeTtl(ttlOverride);

        return commands.hgetall(key)
                .collectMap(kv -> kv.getKey(), kv -> kv.getValue())
                .flatMap(session -> {
                    if (!isValidSession(session)) {
                        return Mono.just(false);
                    }

                    Map<String, String> payload = Map.of(
                            "session_ttl", String.valueOf(sessionTtl),
                            "last_accessed_at", timestamp()
                    );

                    return commands.hset(key, payload)
                            .then(commands.expire(key, sessionTtl))
                            .thenReturn(true);
                });
    }

    public Mono<Boolean> deleteSession(String sessionId) {
        return commands.del(sessionKey(sessionId)).map(deleted -> deleted == 1L);
    }

    public Mono<Long> getTtl(String sessionId) {
        return commands.ttl(sessionKey(sessionId));
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
