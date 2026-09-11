package com.redis.agentmem;

import redis.clients.jedis.JedisPooled;
import redis.clients.jedis.StreamEntryID;
import redis.clients.jedis.params.XAddParams;
import redis.clients.jedis.resps.StreamEntry;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Append-only event log for an agent thread, backed by a Redis
 * Stream.
 *
 * <p>Each thread gets a stream at {@code agent:events:{threadId}}.
 * Every action the agent takes (a user turn arriving, a memory being
 * recalled, a memory being written, a tool being called) is one
 * {@code XADD} to that stream. Replay with {@code XREVRANGE} for the
 * most recent N events; bound retention with {@code XTRIM MAXLEN ~}
 * (Jedis's {@code XAddParams.approximateTrimming()}) so the log
 * stays cheap regardless of how long the thread has been running.
 *
 * <p>The stream is independent of the session hash and the long-term
 * memory store: it answers the "what just happened" question without
 * competing with either of those for indexing or memory budget.
 * Consumer groups (not used in this demo) would let downstream
 * workers — summarisers, consolidators, audit pipelines — replay the
 * log without losing position.
 */
public final class AgentEventLog {

    /** Approximate cap on stream length. */
    public static final long DEFAULT_MAX_LEN = 1000L;

    private final JedisPooled jedis;
    private final String keyPrefix;
    private final long maxLen;

    public AgentEventLog(JedisPooled jedis, String keyPrefix, long maxLen) {
        this.jedis = jedis;
        this.keyPrefix = keyPrefix;
        this.maxLen = maxLen > 0 ? maxLen : DEFAULT_MAX_LEN;
    }

    public String keyPrefix() {
        return keyPrefix;
    }

    public long maxLen() {
        return maxLen;
    }

    public String streamKey(String threadId) {
        return keyPrefix + threadId;
    }

    /**
     * Append one event and return its stream id.
     *
     * <p>{@code MAXLEN ~ N} ({@code approximateTrimming()}) keeps the
     * stream bounded with near-zero overhead; the exact form forces a
     * scan and is rarely worth the cost.
     */
    public String record(String threadId, String action, String detail) {
        Map<String, String> hash = new HashMap<>();
        hash.put("action", action == null ? "" : action);
        hash.put("detail", detail == null ? "" : detail);
        hash.put("ts", String.format(Locale.ROOT, "%.6f", unixSecs()));

        XAddParams params = XAddParams.xAddParams()
                .maxLen(maxLen)
                .approximateTrimming();
        StreamEntryID id = jedis.xadd(streamKey(threadId), params, hash);
        return id == null ? "" : id.toString();
    }

    /** Return the most recent events, newest first. */
    public List<AgentEvent> recent(String threadId, int count) {
        // xrevrange(key, end, start, count): newest-first iteration
        // from "+" (highest id) towards "-" (lowest id).
        List<StreamEntry> entries = jedis.xrevrange(
                streamKey(threadId),
                StreamEntryID.MAXIMUM_ID,
                StreamEntryID.MINIMUM_ID,
                count);
        List<AgentEvent> out = new ArrayList<>(entries.size());
        for (StreamEntry entry : entries) {
            Map<String, String> fields = entry.getFields();
            out.add(new AgentEvent(
                    entry.getID().toString(),
                    threadId,
                    fields.getOrDefault("action", ""),
                    fields.getOrDefault("detail", ""),
                    parseDouble(fields.get("ts"), 0.0)));
        }
        return out;
    }

    /** Drop the entire stream for a thread. */
    public boolean clear(String threadId) {
        return jedis.del(streamKey(threadId)) > 0;
    }

    private static double unixSecs() {
        return System.currentTimeMillis() / 1000.0;
    }

    private static double parseDouble(String s, double fallback) {
        if (s == null || s.isEmpty()) return fallback;
        try { return Double.parseDouble(s); } catch (NumberFormatException ex) { return fallback; }
    }
}
