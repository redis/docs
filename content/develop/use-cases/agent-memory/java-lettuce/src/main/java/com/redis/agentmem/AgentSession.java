package com.redis.agentmem;

import io.lettuce.core.RedisException;
import io.lettuce.core.TransactionResult;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.sync.RedisCommands;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Working-memory store for an agent session, backed by a Redis Hash.
 *
 * <p>Each session is one Hash document at
 * {@code agent:session:{threadId}}. The hash holds the running
 * scratchpad, the current goal, a rolling window of recent turns
 * (serialised as a JSON list to fit in one field), and a few audit
 * fields. One {@code HGETALL} returns the whole session in a single
 * round trip on every step of the agent loop.
 *
 * <p>Every write refreshes the key's TTL with {@code EXPIRE}, so
 * idle sessions fall off without a separate cleanup job and active
 * sessions stay alive as long as the agent keeps touching them.
 *
 * <p>The Lettuce connection is shared with {@link LongTermMemory}
 * and {@link AgentEventLog}; the {@code txLock} passed in at
 * construction time serialises {@code MULTI}/{@code EXEC} spans
 * across the three helpers so concurrent transactions on the same
 * connection don't interleave queued commands.
 */
public final class AgentSession {

    public static final int DEFAULT_MAX_TURNS = 20;

    private final StatefulRedisConnection<byte[], byte[]> connection;
    private final RedisCommands<byte[], byte[]> sync;
    private final Object txLock;
    private final String keyPrefix;
    private final byte[] keyPrefixBytes;
    private final long defaultTtlSeconds;
    private final int maxTurns;

    public AgentSession(
            StatefulRedisConnection<byte[], byte[]> connection,
            Object txLock,
            String keyPrefix,
            long defaultTtlSeconds,
            int maxTurns) {
        this.connection = connection;
        this.sync = connection.sync();
        this.txLock = txLock;
        this.keyPrefix = keyPrefix;
        this.keyPrefixBytes = keyPrefix.getBytes(StandardCharsets.UTF_8);
        this.defaultTtlSeconds = defaultTtlSeconds;
        this.maxTurns = maxTurns > 0 ? maxTurns : DEFAULT_MAX_TURNS;
    }

    public String keyPrefix() {
        return keyPrefix;
    }

    public long defaultTtlSeconds() {
        return defaultTtlSeconds;
    }

    public int maxTurns() {
        return maxTurns;
    }

    public String sessionKey(String threadId) {
        return keyPrefix + threadId;
    }

    private byte[] sessionKeyBytes(String threadId) {
        return sessionKey(threadId).getBytes(StandardCharsets.UTF_8);
    }

    public String newThreadId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    /**
     * Create a fresh working memory for a thread. Overwrites any
     * existing session at the same key.
     */
    public SessionState start(
            String threadId, String user, String agent, String goal, Long ttlSeconds) {
        if (user == null || user.isEmpty()) user = "default";
        if (agent == null || agent.isEmpty()) agent = "default";
        if (goal == null) goal = "";
        long ttl = ttlSeconds != null ? ttlSeconds : defaultTtlSeconds;
        double now = unixSecs();
        SessionState state = new SessionState(
                threadId, user, agent, goal, "",
                0L, now, now, List.of(), ttl);
        write(state, ttl);
        return state;
    }

    /** Return the session state, or {@code null} if it has expired. */
    public SessionState load(String threadId) {
        byte[] key = sessionKeyBytes(threadId);
        Map<byte[], byte[]> raw = sync.hgetall(key);
        if (raw == null || raw.isEmpty()) return null;
        Map<String, String> fields = new LinkedHashMap<>();
        for (Map.Entry<byte[], byte[]> e : raw.entrySet()) {
            fields.put(
                    new String(e.getKey(), StandardCharsets.UTF_8),
                    new String(e.getValue(), StandardCharsets.UTF_8));
        }
        long ttl = sync.ttl(key);
        if (ttl < 0) ttl = 0;
        return new SessionState(
                threadId,
                orDefault(fields.get("user"), "default"),
                orDefault(fields.get("agent"), "default"),
                orEmpty(fields.get("goal")),
                orEmpty(fields.get("scratchpad")),
                parseLong(fields.get("turn_count"), 0L),
                parseDouble(fields.get("created_ts"), 0.0),
                parseDouble(fields.get("last_active_ts"), 0.0),
                parseTurns(fields.get("recent_turns")),
                ttl);
    }

    /**
     * Append a turn, bound the rolling window, refresh the TTL.
     *
     * <p>{@code user} and {@code agent} are only consulted when the
     * session does not yet exist — they seed the auto-created session
     * so the working-memory hash matches the user the caller is
     * operating against. On an existing session they're ignored; the
     * original {@code start} values stand.
     *
     * <p>Read-modify-write here is last-writer-wins on the turn list
     * if two concurrent turns reach the same thread; the demo never
     * triggers that race in practice (one browser, one turn at a
     * time) but a multi-worker agent that shares a thread id would
     * wrap this in {@code WATCH} / {@code MULTI} / {@code EXEC} or a
     * Lua script that does the append atomically server-side.
     */
    public SessionState appendTurn(
            String threadId,
            String role,
            String content,
            String user,
            String agent,
            Long ttlSeconds) {
        SessionState state = load(threadId);
        if (state == null) {
            state = start(threadId, user, agent, "", ttlSeconds);
        }
        List<SessionTurn> turns = new ArrayList<>(state.recentTurns());
        turns.add(new SessionTurn(role, content == null ? "" : content, unixSecs()));
        if (turns.size() > maxTurns) {
            turns = turns.subList(turns.size() - maxTurns, turns.size());
        }
        long ttl = ttlSeconds != null ? ttlSeconds : defaultTtlSeconds;
        SessionState next = new SessionState(
                state.threadId(), state.user(), state.agent(),
                state.goal(), state.scratchpad(),
                state.turnCount() + 1,
                state.createdTs(),
                unixSecs(),
                turns,
                ttl);
        write(next, ttl);
        return next;
    }

    /**
     * Update the goal field without touching turns or the scratchpad.
     * Creates the session if it doesn't exist yet.
     */
    public SessionState setGoal(
            String threadId, String text, String user, String agent, Long ttlSeconds) {
        SessionState state = load(threadId);
        if (state == null) {
            return start(threadId, user, agent, text == null ? "" : text, ttlSeconds);
        }
        long ttl = ttlSeconds != null ? ttlSeconds : defaultTtlSeconds;
        SessionState next = new SessionState(
                state.threadId(), state.user(), state.agent(),
                text == null ? "" : text,
                state.scratchpad(),
                state.turnCount(),
                state.createdTs(),
                unixSecs(),
                state.recentTurns(),
                ttl);
        write(next, ttl);
        return next;
    }

    /** Drop the session immediately. Returns {@code true} if it existed. */
    public boolean delete(String threadId) {
        return sync.del(sessionKeyBytes(threadId)) > 0L;
    }

    public StatefulRedisConnection<byte[], byte[]> connection() {
        return connection;
    }

    private void write(SessionState state, long ttl) {
        byte[] key = sessionKeyBytes(state.threadId());

        JSONArray turnsArr = new JSONArray();
        for (SessionTurn t : state.recentTurns()) {
            JSONObject obj = new JSONObject();
            obj.put("role", t.role());
            obj.put("content", t.content());
            obj.put("ts", t.ts());
            turnsArr.put(obj);
        }

        Map<byte[], byte[]> mapping = new LinkedHashMap<>();
        putUtf8(mapping, "thread_id", state.threadId());
        putUtf8(mapping, "user", state.user());
        putUtf8(mapping, "agent", state.agent());
        putUtf8(mapping, "goal", state.goal());
        putUtf8(mapping, "scratchpad", state.scratchpad());
        putUtf8(mapping, "turn_count", Long.toString(state.turnCount()));
        putUtf8(mapping, "created_ts",
                String.format(Locale.ROOT, "%.6f", state.createdTs()));
        putUtf8(mapping, "last_active_ts",
                String.format(Locale.ROOT, "%.6f", state.lastActiveTs()));
        putUtf8(mapping, "recent_turns", turnsArr.toString());

        // MULTI/EXEC so HSET and EXPIRE either both apply or neither
        // does. The shared `txLock` serialises this whole MULTI…EXEC
        // span against any other transaction on the same connection
        // — Lettuce's transaction state is connection-scoped, so two
        // concurrent threads queueing into the same MULTI would
        // interleave their writes.
        TransactionResult txResult;
        synchronized (txLock) {
            sync.multi();
            sync.hset(key, mapping);
            sync.expire(key, ttl);
            txResult = sync.exec();
        }
        if (txResult == null || txResult.wasDiscarded()) {
            throw new RedisException("MULTI/EXEC for session write was discarded");
        }
    }

    private static void putUtf8(Map<byte[], byte[]> mapping, String field, String value) {
        mapping.put(
                field.getBytes(StandardCharsets.UTF_8),
                (value == null ? "" : value).getBytes(StandardCharsets.UTF_8));
    }

    private static List<SessionTurn> parseTurns(String blob) {
        if (blob == null || blob.isEmpty()) return List.of();
        try {
            JSONArray arr = new JSONArray(blob);
            List<SessionTurn> out = new ArrayList<>(arr.length());
            for (int i = 0; i < arr.length(); i++) {
                JSONObject o = arr.getJSONObject(i);
                out.add(new SessionTurn(
                        o.optString("role", ""),
                        o.optString("content", ""),
                        o.optDouble("ts", 0.0)));
            }
            return out;
        } catch (JSONException ex) {
            return List.of();
        }
    }

    private static String orDefault(String s, String fallback) {
        return (s == null || s.isEmpty()) ? fallback : s;
    }

    private static String orEmpty(String s) {
        return s == null ? "" : s;
    }

    private static long parseLong(String s, long fallback) {
        if (s == null || s.isEmpty()) return fallback;
        try { return Long.parseLong(s); } catch (NumberFormatException ex) { return fallback; }
    }

    private static double parseDouble(String s, double fallback) {
        if (s == null || s.isEmpty()) return fallback;
        try { return Double.parseDouble(s); } catch (NumberFormatException ex) { return fallback; }
    }

    private static double unixSecs() {
        return System.currentTimeMillis() / 1000.0;
    }
}
