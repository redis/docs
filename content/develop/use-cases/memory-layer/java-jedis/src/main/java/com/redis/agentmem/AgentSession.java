package com.redis.agentmem;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import redis.clients.jedis.AbstractTransaction;
import redis.clients.jedis.JedisPooled;

import java.util.ArrayList;
import java.util.HashMap;
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
 * (serialized as a JSON list to fit in one field), and a few audit
 * fields. One {@code HGETALL} returns the whole session in a single
 * round trip on every step of the agent loop.
 *
 * <p>Every write refreshes the key's TTL with {@code EXPIRE}, so
 * idle sessions fall off without a separate cleanup job and active
 * sessions stay alive as long as the agent keeps touching them. A
 * separate {@link LongTermMemory} is what survives beyond a session's
 * TTL.
 *
 * <p>The turn window is bounded to {@link #maxTurns()} in application
 * code; the hash itself doesn't grow, so the working set per thread
 * stays constant regardless of how long the agent has been running.
 */
public final class AgentSession {

    /** Default rolling-window size. */
    public static final int DEFAULT_MAX_TURNS = 20;

    private final JedisPooled jedis;
    private final String keyPrefix;
    private final long defaultTtlSeconds;
    private final int maxTurns;

    public AgentSession(
            JedisPooled jedis,
            String keyPrefix,
            long defaultTtlSeconds,
            int maxTurns) {
        this.jedis = jedis;
        this.keyPrefix = keyPrefix;
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

    /** Random 12-hex-character thread id, matching the other ports. */
    public String newThreadId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    /**
     * Create a fresh working memory for a thread. Overwrites any
     * existing session at the same key. The agent normally calls
     * this once per thread at the first turn and relies on
     * {@link #load} / {@link #appendTurn} for subsequent steps.
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
        String key = sessionKey(threadId);
        Map<String, String> raw = jedis.hgetAll(key);
        if (raw == null || raw.isEmpty()) {
            return null;
        }
        long ttl = jedis.ttl(key);
        if (ttl < 0) ttl = 0;
        List<SessionTurn> turns = parseTurns(raw.get("recent_turns"));
        return new SessionState(
                threadId,
                orDefault(raw.get("user"), "default"),
                orDefault(raw.get("agent"), "default"),
                orEmpty(raw.get("goal")),
                orEmpty(raw.get("scratchpad")),
                parseLong(raw.get("turn_count"), 0L),
                parseDouble(raw.get("created_ts"), 0.0),
                parseDouble(raw.get("last_active_ts"), 0.0),
                turns,
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
                state.threadId(),
                state.user(),
                state.agent(),
                state.goal(),
                state.scratchpad(),
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
     * Creates the session if it doesn't exist yet — setting a goal
     * on a fresh thread is a sensible first step in the agent loop,
     * so this method covers both the "rename the goal mid-session"
     * and the "start a thread with this goal" cases.
     */
    public SessionState setGoal(
            String threadId,
            String text,
            String user,
            String agent,
            Long ttlSeconds) {
        SessionState state = load(threadId);
        if (state == null) {
            return start(threadId, user, agent, text == null ? "" : text, ttlSeconds);
        }
        long ttl = ttlSeconds != null ? ttlSeconds : defaultTtlSeconds;
        SessionState next = new SessionState(
                state.threadId(),
                state.user(),
                state.agent(),
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
        return jedis.del(sessionKey(threadId)) > 0;
    }

    private void write(SessionState state, long ttl) {
        String key = sessionKey(state.threadId());

        JSONArray turnsArr = new JSONArray();
        for (SessionTurn t : state.recentTurns()) {
            JSONObject obj = new JSONObject();
            obj.put("role", t.role());
            obj.put("content", t.content());
            obj.put("ts", t.ts());
            turnsArr.put(obj);
        }

        Map<String, String> mapping = new HashMap<>();
        mapping.put("thread_id", state.threadId());
        mapping.put("user", state.user());
        mapping.put("agent", state.agent());
        mapping.put("goal", state.goal());
        mapping.put("scratchpad", state.scratchpad());
        mapping.put("turn_count", Long.toString(state.turnCount()));
        mapping.put("created_ts",
                String.format(Locale.ROOT, "%.6f", state.createdTs()));
        mapping.put("last_active_ts",
                String.format(Locale.ROOT, "%.6f", state.lastActiveTs()));
        mapping.put("recent_turns", turnsArr.toString());

        // MULTI/EXEC so HSET and EXPIRE either both apply or neither
        // does. A connection drop between the two writes would
        // otherwise leave the session without a TTL.
        try (AbstractTransaction tx = jedis.multi()) {
            tx.hset(key, mapping);
            tx.expire(key, ttl);
            tx.exec();
        }
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
