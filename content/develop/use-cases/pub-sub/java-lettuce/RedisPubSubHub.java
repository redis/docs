import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.sync.RedisCommands;
import io.lettuce.core.pubsub.StatefulRedisPubSubConnection;
import io.lettuce.core.pubsub.RedisPubSubListener;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Deque;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Redis-backed pub/sub hub helper.
 *
 * <p>Wraps PUBLISH / SUBSCRIBE / PSUBSCRIBE plus the introspection commands
 * (PUBSUB CHANNELS, PUBSUB NUMSUB, PUBSUB NUMPAT) into a small, named API
 * that:
 *
 * <ul>
 *   <li>publishes JSON-encoded messages to a channel and counts how many
 *       subscribers Redis reported delivering to;</li>
 *   <li>creates named in-process subscribers that own a dedicated
 *       {@code StatefulRedisPubSubConnection} and a listener for each
 *       delivered message;</li>
 *   <li>tracks per-channel publish counters and per-subscriber received
 *       counts for the demo UI.</li>
 * </ul>
 *
 * <p>Pub/sub has at-most-once delivery: a message that arrives while a
 * subscriber is disconnected is gone. If you need persistence or replay,
 * use Redis Streams instead.
 */
public class RedisPubSubHub {

    private final RedisClient client;
    private final StatefulRedisConnection<String, String> connection;
    private final int bufferSize;

    private final Map<String, Subscription> subscriptions = new LinkedHashMap<>();
    private final Object subscriptionsLock = new Object();

    private final AtomicLong publishedTotal = new AtomicLong();
    private final AtomicLong deliveredTotal = new AtomicLong();
    private final Map<String, Long> channelPublished = new ConcurrentHashMap<>();

    public RedisPubSubHub(RedisClient client,
                          StatefulRedisConnection<String, String> connection) {
        this(client, connection, 50);
    }

    public RedisPubSubHub(RedisClient client,
                          StatefulRedisConnection<String, String> connection,
                          int bufferSize) {
        this.client = client;
        this.connection = connection;
        this.bufferSize = bufferSize;
    }

    /**
     * Publish {@code message} to {@code channel} and return Redis' delivered count.
     *
     * <p>The message is JSON-encoded before being sent so callers can pass maps,
     * lists, or scalars without converting on every call. The returned integer
     * is what Redis itself reports: the number of clients that were subscribed
     * (directly or via pattern) at the moment the message was fanned out.
     */
    public int publish(String channel, Object message) {
        String payload = JsonCodec.encode(message);
        long delivered = connection.sync().publish(channel, payload);
        publishedTotal.incrementAndGet();
        deliveredTotal.addAndGet(delivered);
        channelPublished.merge(channel, 1L, Long::sum);
        return (int) delivered;
    }

    /** Register a named exact-match subscription on one or more channels. */
    public Subscription subscribe(String name, List<String> channels) {
        return register(name, channels, false);
    }

    /** Register a named pattern subscription on one or more glob patterns. */
    public Subscription psubscribe(String name, List<String> patterns) {
        return register(name, patterns, true);
    }

    private Subscription register(String name, List<String> targets, boolean isPattern) {
        if (targets == null || targets.isEmpty()) {
            throw new IllegalArgumentException("subscription requires at least one channel or pattern");
        }
        synchronized (subscriptionsLock) {
            if (subscriptions.containsKey(name)) {
                throw new IllegalArgumentException("subscription named '" + name + "' already exists");
            }
            Subscription sub = new Subscription(name, targets, isPattern, client, bufferSize);
            subscriptions.put(name, sub);
            return sub;
        }
    }

    /** Close and remove the named subscription. Returns {@code true} if it existed. */
    public boolean unsubscribe(String name) {
        Subscription removed;
        synchronized (subscriptionsLock) {
            removed = subscriptions.remove(name);
        }
        if (removed == null) {
            return false;
        }
        removed.close();
        return true;
    }

    public List<Subscription> subscriptions() {
        synchronized (subscriptionsLock) {
            return new ArrayList<>(subscriptions.values());
        }
    }

    public Subscription getSubscription(String name) {
        synchronized (subscriptionsLock) {
            return subscriptions.get(name);
        }
    }

    /** List server-side channels with at least one subscriber (PUBSUB CHANNELS). */
    public List<String> activeChannels(String pattern) {
        RedisCommands<String, String> sync = connection.sync();
        List<String> channels = pattern == null || pattern.isEmpty()
                ? sync.pubsubChannels()
                : sync.pubsubChannels(pattern);
        List<String> copy = new ArrayList<>(channels);
        Collections.sort(copy);
        return copy;
    }

    /**
     * Count subscribers per channel (PUBSUB NUMSUB).
     *
     * <p>Reports only exact-match subscriptions — pattern subscribers are
     * counted separately via {@link #patternSubscriberCount()}.
     */
    public Map<String, Long> channelSubscriberCounts(List<String> channels) {
        if (channels == null || channels.isEmpty()) {
            return Collections.emptyMap();
        }
        RedisCommands<String, String> sync = connection.sync();
        Map<String, Long> result = sync.pubsubNumsub(channels.toArray(new String[0]));
        // Preserve the caller's order so the UI is stable.
        Map<String, Long> ordered = new LinkedHashMap<>();
        for (String channel : channels) {
            ordered.put(channel, result.getOrDefault(channel, 0L));
        }
        return ordered;
    }

    /** Total active pattern subscriptions across all clients (PUBSUB NUMPAT). */
    public long patternSubscriberCount() {
        return connection.sync().pubsubNumpat();
    }

    /** Combined publish and subscribe counters plus the current registry size. */
    public Map<String, Object> stats() {
        List<Subscription> subs = subscriptions();
        long received = 0;
        for (Subscription sub : subs) {
            received += sub.receivedTotal();
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("published_total", publishedTotal.get());
        out.put("delivered_total", deliveredTotal.get());
        out.put("received_total", received);
        out.put("active_subscriptions", (long) subs.size());
        out.put("channel_published", new LinkedHashMap<>(channelPublished));
        out.put("pattern_subscriptions", patternSubscriberCount());
        return out;
    }

    public void resetStats() {
        publishedTotal.set(0);
        deliveredTotal.set(0);
        channelPublished.clear();
        for (Subscription sub : subscriptions()) {
            sub.resetReceived();
        }
    }

    /** Close every active subscription and the main connection. Safe to call more than once. */
    public void shutdown() {
        List<Subscription> snapshot;
        synchronized (subscriptionsLock) {
            snapshot = new ArrayList<>(subscriptions.values());
            subscriptions.clear();
        }
        for (Subscription sub : snapshot) {
            sub.close();
        }
    }

    /**
     * A named in-process subscriber bound to one or more channels or patterns.
     *
     * <p>Each {@code Subscription} owns its own
     * {@link StatefulRedisPubSubConnection} (and therefore its own Redis
     * connection) and registers a {@link RedisPubSubListener} that pumps
     * incoming messages into a bounded ring buffer. Subscriptions are
     * independent: closing one does not affect another, even if they share
     * channels.
     */
    public static class Subscription {

        private final String name;
        private final List<String> targets;
        private final boolean isPattern;
        private final StatefulRedisPubSubConnection<String, String> psConnection;
        private final Deque<ReceivedMessage> buffer;
        private final int bufferSize;
        private final Object bufferLock = new Object();
        private volatile long received = 0L;
        private volatile boolean closed = false;

        Subscription(String name,
                     List<String> targets,
                     boolean isPattern,
                     RedisClient client,
                     int bufferSize) {
            this.name = name;
            this.targets = new ArrayList<>(targets);
            this.isPattern = isPattern;
            this.bufferSize = bufferSize;
            this.buffer = new ArrayDeque<>(bufferSize);

            // Every subscription gets its own pub/sub connection. Sharing a
            // single pub/sub connection across subscribers would couple their
            // lifetimes — closing one would close the channel for the others.
            this.psConnection = client.connectPubSub();

            // Lettuce delivers messages on a Netty event-loop thread via the
            // listener interface. We re-wrap each raw message as a
            // ReceivedMessage and append it to a per-subscriber ring buffer
            // under a lock so demo polling can read it safely.
            this.psConnection.addListener(new RedisPubSubListener<String, String>() {
                @Override
                public void message(String channel, String msg) {
                    record(channel, null, msg);
                }

                @Override
                public void message(String pattern, String channel, String msg) {
                    record(channel, pattern, msg);
                }

                @Override public void subscribed(String channel, long count) {}
                @Override public void psubscribed(String pattern, long count) {}
                @Override public void unsubscribed(String channel, long count) {}
                @Override public void punsubscribed(String pattern, long count) {}
            });

            // Block on the SUBSCRIBE / PSUBSCRIBE acknowledgement before the
            // constructor returns. The sync variant waits for Redis to confirm
            // every channel; if we returned on the unawaited async future, a
            // PUBLISH issued right after subscribe() can race ahead of the
            // ack and the message would never reach this subscriber.
            if (isPattern) {
                psConnection.sync().psubscribe(this.targets.toArray(new String[0]));
            } else {
                psConnection.sync().subscribe(this.targets.toArray(new String[0]));
            }
        }

        private void record(String channel, String pattern, String data) {
            Object payload = JsonCodec.decode(data);
            ReceivedMessage message = new ReceivedMessage(
                    channel == null ? "" : channel,
                    pattern,
                    payload,
                    System.currentTimeMillis());
            synchronized (bufferLock) {
                if (buffer.size() >= bufferSize) {
                    buffer.pollLast();
                }
                buffer.addFirst(message);
                received++;
            }
        }

        public String name() { return name; }
        public List<String> targets() { return Collections.unmodifiableList(targets); }
        public boolean isPattern() { return isPattern; }

        public long receivedTotal() {
            synchronized (bufferLock) {
                return received;
            }
        }

        public List<ReceivedMessage> messages(int limit) {
            synchronized (bufferLock) {
                int count = Math.min(limit < 0 ? buffer.size() : limit, buffer.size());
                List<ReceivedMessage> out = new ArrayList<>(count);
                int taken = 0;
                for (ReceivedMessage m : buffer) {
                    if (taken >= count) break;
                    out.add(m);
                    taken++;
                }
                return out;
            }
        }

        public void resetReceived() {
            synchronized (bufferLock) {
                buffer.clear();
                received = 0L;
            }
        }

        public boolean isAlive() {
            return !closed && psConnection.isOpen();
        }

        public void close() {
            if (closed) return;
            closed = true;
            try {
                psConnection.close();
            } catch (Exception ignored) {
                // Already closed or in the middle of being closed; nothing to do.
            }
        }

        public Map<String, Object> toMap(int messageLimit) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("name", name);
            map.put("targets", new ArrayList<>(targets));
            map.put("is_pattern", isPattern);
            map.put("received_total", receivedTotal());
            map.put("alive", isAlive());
            List<Map<String, Object>> msgs = new ArrayList<>();
            for (ReceivedMessage m : messages(messageLimit)) {
                msgs.add(m.toMap());
            }
            map.put("messages", msgs);
            return map;
        }
    }

    /**
     * Shape of a single delivered message. Pattern subscriptions populate
     * {@code pattern}; exact-match subscriptions leave it {@code null}.
     */
    public static class ReceivedMessage {
        public final String channel;
        public final String pattern;
        public final Object payload;
        public final long receivedAtMs;

        public ReceivedMessage(String channel, String pattern, Object payload, long receivedAtMs) {
            this.channel = channel;
            this.pattern = pattern;
            this.payload = payload;
            this.receivedAtMs = receivedAtMs;
        }

        public Map<String, Object> toMap() {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("channel", channel);
            m.put("pattern", pattern);
            m.put("payload", payload);
            m.put("received_at_ms", receivedAtMs);
            return m;
        }
    }

    /**
     * Tiny JSON encoder/decoder. Supports the value types the demo actually
     * publishes (maps with string keys, lists, strings, numbers, booleans,
     * null) so the helper has no third-party dependencies.
     */
    static final class JsonCodec {

        static String encode(Object value) {
            StringBuilder out = new StringBuilder();
            writeValue(out, value);
            return out.toString();
        }

        static Object decode(String text) {
            if (text == null) return null;
            String trimmed = text.trim();
            if (trimmed.isEmpty()) return text;
            try {
                Parser parser = new Parser(trimmed);
                Object value = parser.readValue();
                parser.skipWhitespace();
                if (!parser.atEnd()) {
                    // Trailing junk — fall back to the raw string.
                    return text;
                }
                return value;
            } catch (RuntimeException e) {
                return text;
            }
        }

        private static void writeValue(StringBuilder out, Object value) {
            if (value == null) {
                out.append("null");
            } else if (value instanceof String) {
                writeString(out, (String) value);
            } else if (value instanceof Boolean || value instanceof Number) {
                out.append(value.toString());
            } else if (value instanceof Map<?, ?>) {
                writeObject(out, (Map<?, ?>) value);
            } else if (value instanceof Collection<?>) {
                writeArray(out, (Collection<?>) value);
            } else {
                writeString(out, value.toString());
            }
        }

        private static void writeObject(StringBuilder out, Map<?, ?> map) {
            out.append('{');
            boolean first = true;
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                if (!first) out.append(',');
                first = false;
                writeString(out, String.valueOf(entry.getKey()));
                out.append(':');
                writeValue(out, entry.getValue());
            }
            out.append('}');
        }

        private static void writeArray(StringBuilder out, Collection<?> list) {
            out.append('[');
            boolean first = true;
            for (Object item : list) {
                if (!first) out.append(',');
                first = false;
                writeValue(out, item);
            }
            out.append(']');
        }

        private static void writeString(StringBuilder out, String value) {
            out.append('"');
            for (int i = 0; i < value.length(); i++) {
                char c = value.charAt(i);
                switch (c) {
                    case '"': out.append("\\\""); break;
                    case '\\': out.append("\\\\"); break;
                    case '\n': out.append("\\n"); break;
                    case '\r': out.append("\\r"); break;
                    case '\t': out.append("\\t"); break;
                    case '\b': out.append("\\b"); break;
                    case '\f': out.append("\\f"); break;
                    default:
                        if (c < 0x20) {
                            out.append(String.format("\\u%04x", (int) c));
                        } else {
                            out.append(c);
                        }
                }
            }
            out.append('"');
        }

        private static final class Parser {
            private final String src;
            private int pos;

            Parser(String src) {
                this.src = src;
                this.pos = 0;
            }

            boolean atEnd() {
                return pos >= src.length();
            }

            void skipWhitespace() {
                while (!atEnd() && Character.isWhitespace(src.charAt(pos))) pos++;
            }

            Object readValue() {
                skipWhitespace();
                if (atEnd()) throw new RuntimeException("unexpected end of input");
                char c = src.charAt(pos);
                if (c == '"') return readString();
                if (c == '{') return readObject();
                if (c == '[') return readArray();
                if (c == 't' || c == 'f') return readBoolean();
                if (c == 'n') return readNull();
                return readNumber();
            }

            String readString() {
                expect('"');
                StringBuilder sb = new StringBuilder();
                while (!atEnd()) {
                    char c = src.charAt(pos++);
                    if (c == '"') return sb.toString();
                    if (c == '\\') {
                        if (atEnd()) throw new RuntimeException("bad escape");
                        char e = src.charAt(pos++);
                        switch (e) {
                            case '"': sb.append('"'); break;
                            case '\\': sb.append('\\'); break;
                            case '/': sb.append('/'); break;
                            case 'n': sb.append('\n'); break;
                            case 'r': sb.append('\r'); break;
                            case 't': sb.append('\t'); break;
                            case 'b': sb.append('\b'); break;
                            case 'f': sb.append('\f'); break;
                            case 'u':
                                if (pos + 4 > src.length()) throw new RuntimeException("bad unicode");
                                sb.append((char) Integer.parseInt(src.substring(pos, pos + 4), 16));
                                pos += 4;
                                break;
                            default: throw new RuntimeException("bad escape: " + e);
                        }
                    } else {
                        sb.append(c);
                    }
                }
                throw new RuntimeException("unterminated string");
            }

            Map<String, Object> readObject() {
                expect('{');
                Map<String, Object> map = new LinkedHashMap<>();
                skipWhitespace();
                if (!atEnd() && src.charAt(pos) == '}') { pos++; return map; }
                while (!atEnd()) {
                    skipWhitespace();
                    String key = readString();
                    skipWhitespace();
                    expect(':');
                    Object value = readValue();
                    map.put(key, value);
                    skipWhitespace();
                    if (!atEnd() && src.charAt(pos) == ',') { pos++; continue; }
                    if (!atEnd() && src.charAt(pos) == '}') { pos++; return map; }
                    throw new RuntimeException("bad object");
                }
                throw new RuntimeException("unterminated object");
            }

            List<Object> readArray() {
                expect('[');
                List<Object> list = new ArrayList<>();
                skipWhitespace();
                if (!atEnd() && src.charAt(pos) == ']') { pos++; return list; }
                while (!atEnd()) {
                    list.add(readValue());
                    skipWhitespace();
                    if (!atEnd() && src.charAt(pos) == ',') { pos++; continue; }
                    if (!atEnd() && src.charAt(pos) == ']') { pos++; return list; }
                    throw new RuntimeException("bad array");
                }
                throw new RuntimeException("unterminated array");
            }

            Boolean readBoolean() {
                if (src.startsWith("true", pos)) { pos += 4; return Boolean.TRUE; }
                if (src.startsWith("false", pos)) { pos += 5; return Boolean.FALSE; }
                throw new RuntimeException("bad boolean");
            }

            Object readNull() {
                if (src.startsWith("null", pos)) { pos += 4; return null; }
                throw new RuntimeException("bad null");
            }

            Object readNumber() {
                int start = pos;
                if (!atEnd() && src.charAt(pos) == '-') pos++;
                while (!atEnd() && isNumberChar(src.charAt(pos))) pos++;
                String slice = src.substring(start, pos);
                try {
                    if (slice.contains(".") || slice.contains("e") || slice.contains("E")) {
                        return Double.parseDouble(slice);
                    }
                    return Long.parseLong(slice);
                } catch (NumberFormatException ex) {
                    throw new RuntimeException("bad number: " + slice);
                }
            }

            private boolean isNumberChar(char c) {
                return (c >= '0' && c <= '9') || c == '.' || c == 'e' || c == 'E' || c == '+' || c == '-';
            }

            void expect(char c) {
                if (atEnd() || src.charAt(pos) != c) {
                    throw new RuntimeException("expected '" + c + "' at " + pos);
                }
                pos++;
            }
        }
    }
}
