package com.redis.agentmem;

import io.lettuce.core.Limit;
import io.lettuce.core.Range;
import io.lettuce.core.StreamMessage;
import io.lettuce.core.XAddArgs;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.sync.RedisCommands;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
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
 * (Lettuce's {@code XAddArgs.approximateTrimming()}) so the log
 * stays cheap regardless of how long the thread has been running.
 */
public final class AgentEventLog {

    public static final long DEFAULT_MAX_LEN = 1000L;

    private final RedisCommands<byte[], byte[]> sync;
    private final String keyPrefix;
    private final long maxLen;

    public AgentEventLog(
            StatefulRedisConnection<byte[], byte[]> connection,
            String keyPrefix,
            long maxLen) {
        this.sync = connection.sync();
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

    private byte[] streamKeyBytes(String threadId) {
        return streamKey(threadId).getBytes(StandardCharsets.UTF_8);
    }

    /**
     * Append one event and return its stream id.
     *
     * <p>{@code MAXLEN ~ N} ({@code approximateTrimming()}) keeps the
     * stream bounded with near-zero overhead; the exact form forces a
     * scan and is rarely worth the cost.
     */
    public String record(String threadId, String action, String detail) {
        Map<byte[], byte[]> fields = new LinkedHashMap<>();
        putUtf8(fields, "action", action == null ? "" : action);
        putUtf8(fields, "detail", detail == null ? "" : detail);
        putUtf8(fields, "ts", String.format(Locale.ROOT, "%.6f", unixSecs()));

        XAddArgs args = XAddArgs.Builder.maxlen(maxLen).approximateTrimming();
        String id = sync.xadd(streamKeyBytes(threadId), args, fields);
        return id == null ? "" : id;
    }

    /** Return the most recent events, newest first. */
    public List<AgentEvent> recent(String threadId, int count) {
        // `xrevrange` walks the stream from the highest id back to the
        // lowest, so an unbounded range with `Limit.from(count)`
        // returns the most recent {@code count} entries newest-first.
        List<StreamMessage<byte[], byte[]>> entries = sync.xrevrange(
                streamKeyBytes(threadId),
                Range.unbounded(),
                Limit.from(count));
        List<AgentEvent> out = new ArrayList<>(entries.size());
        for (StreamMessage<byte[], byte[]> msg : entries) {
            Map<String, String> body = new LinkedHashMap<>();
            for (Map.Entry<byte[], byte[]> e : msg.getBody().entrySet()) {
                body.put(
                        new String(e.getKey(), StandardCharsets.UTF_8),
                        new String(e.getValue(), StandardCharsets.UTF_8));
            }
            out.add(new AgentEvent(
                    msg.getId(),
                    threadId,
                    body.getOrDefault("action", ""),
                    body.getOrDefault("detail", ""),
                    parseDouble(body.get("ts"), 0.0)));
        }
        return out;
    }

    /** Drop the entire stream for a thread. */
    public boolean clear(String threadId) {
        return sync.del(streamKeyBytes(threadId)) > 0L;
    }

    private static void putUtf8(Map<byte[], byte[]> fields, String name, String value) {
        fields.put(
                name.getBytes(StandardCharsets.UTF_8),
                (value == null ? "" : value).getBytes(StandardCharsets.UTF_8));
    }

    private static double unixSecs() {
        return System.currentTimeMillis() / 1000.0;
    }

    private static double parseDouble(String s, double fallback) {
        if (s == null || s.isEmpty()) return fallback;
        try { return Double.parseDouble(s); } catch (NumberFormatException ex) { return fallback; }
    }
}
