import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.JedisPubSub;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Deque;
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
 * that:</p>
 *
 * <ul>
 *   <li>publishes JSON-encoded messages to a channel and counts how many
 *       subscribers Redis reported delivering to</li>
 *   <li>creates named in-process subscribers that own a dedicated
 *       {@link JedisPubSub} listener and a background dispatch thread,
 *       with each message wrapped as a {@link ReceivedMessage}</li>
 *   <li>tracks per-channel publish counters and per-subscriber received
 *       counts for the demo UI</li>
 * </ul>
 *
 * <p>Pub/sub has at-most-once delivery: a message that arrives while a
 * subscriber is disconnected is gone. If you need persistence or replay,
 * use Redis Streams instead.</p>
 */
public class RedisPubSubHub {

    /** Message shape delivered to every Subscription's buffer. */
    public static final class ReceivedMessage {
        final String channel;
        final String pattern; // null for exact-match subscriptions
        final Object payload;
        final long receivedAtMs;

        ReceivedMessage(String channel, String pattern, Object payload, long receivedAtMs) {
            this.channel = channel;
            this.pattern = pattern;
            this.payload = payload;
            this.receivedAtMs = receivedAtMs;
        }

        public String channel() { return channel; }
        public String pattern() { return pattern; }
        public Object payload() { return payload; }
        public long receivedAtMs() { return receivedAtMs; }

        public Map<String, Object> toMap() {
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("channel", channel);
            out.put("pattern", pattern); // emits JSON null when no pattern
            out.put("payload", payload);
            out.put("received_at_ms", receivedAtMs);
            return out;
        }
    }

    /**
     * A named in-process subscriber bound to one or more channels or patterns.
     *
     * <p>Each {@code Subscription} owns its own {@link JedisPubSub} listener
     * running on a dedicated thread with a dedicated {@link Jedis}
     * connection. Subscriptions are independent: closing one does not
     * affect another, even if they share channels.</p>
     */
    public final class Subscription {
        private final String name;
        private final List<String> targets;
        private final boolean isPattern;
        private final int bufferSize;

        private final Deque<ReceivedMessage> buffer = new ArrayDeque<>();
        private final Object bufferLock = new Object();
        private long received = 0;
        private volatile boolean closed = false;

        private final Jedis jedis;
        private final JedisPubSub listener;
        private final Thread thread;

        Subscription(String name, List<String> targets, boolean isPattern, int bufferSize) {
            if (targets == null || targets.isEmpty()) {
                throw new IllegalArgumentException("Subscription requires at least one channel or pattern");
            }
            this.name = name;
            this.targets = List.copyOf(targets);
            this.isPattern = isPattern;
            this.bufferSize = bufferSize;

            // Each subscriber gets its own Jedis connection. Sharing one
            // connection across subscribers would couple their lifetimes —
            // unsubscribing one would close the channel for the others.
            this.jedis = pool.getResource();

            this.listener = new JedisPubSub() {
                @Override
                public void onMessage(String channel, String message) {
                    dispatch(channel, null, message);
                }

                @Override
                public void onPMessage(String pattern, String channel, String message) {
                    dispatch(channel, pattern, message);
                }
            };

            final String[] targetArr = this.targets.toArray(new String[0]);
            this.thread = new Thread(() -> {
                try {
                    if (isPattern) {
                        jedis.psubscribe(listener, targetArr);
                    } else {
                        jedis.subscribe(listener, targetArr);
                    }
                } catch (Exception ignored) {
                    // Connection closed by close(); thread exits.
                } finally {
                    try {
                        jedis.close();
                    } catch (Exception ignored) {
                    }
                }
            }, "pubsub-" + name);
            this.thread.setDaemon(true);
            this.thread.start();

            // jedis.subscribe / psubscribe send the SUBSCRIBE command
            // on its own connection. The command flushes immediately and
            // Redis registers the client as a subscriber before any
            // publish race can occur; tests that publish right after
            // returning from this constructor should still wait a few ms
            // for the round-trip to complete.
        }

        // The JedisPubSub callbacks deliver (channel, pattern, message).
        // We try to JSON-decode the payload so users see structured data
        // when the publisher used the hub's publish() helper.
        private void dispatch(String channel, String pattern, String message) {
            Object payload;
            try {
                payload = JsonUtil.parseAny(message);
            } catch (RuntimeException e) {
                payload = message;
            }
            ReceivedMessage rm = new ReceivedMessage(
                    channel == null ? "" : channel,
                    pattern,
                    payload,
                    System.currentTimeMillis()
            );
            synchronized (bufferLock) {
                buffer.addFirst(rm);
                while (buffer.size() > bufferSize) {
                    buffer.removeLast();
                }
                received++;
            }
        }

        public String name() { return name; }

        public List<String> targets() { return targets; }

        public boolean isPattern() { return isPattern; }

        public long receivedTotal() {
            synchronized (bufferLock) {
                return received;
            }
        }

        public List<ReceivedMessage> messages(int limit) {
            synchronized (bufferLock) {
                List<ReceivedMessage> out = new ArrayList<>(buffer);
                if (limit >= 0 && out.size() > limit) {
                    out = out.subList(0, limit);
                }
                return new ArrayList<>(out);
            }
        }

        public void resetReceived() {
            synchronized (bufferLock) {
                buffer.clear();
                received = 0;
            }
        }

        /**
         * Stop the subscriber thread cleanly.
         *
         * <p>Jedis ships {@code UNSUBSCRIBE}/{@code PUNSUBSCRIBE} back over
         * the same socket; after the listener has unsubscribed from every
         * target the blocking {@code subscribe}/{@code psubscribe} call
         * returns and the thread exits. As a belt-and-braces guard we also
         * close the {@link Jedis} connection in the {@code finally} block
         * of the worker thread, which unblocks any read still in flight.</p>
         */
        public void close() {
            if (closed) {
                return;
            }
            closed = true;
            try {
                if (listener.isSubscribed()) {
                    if (isPattern) {
                        listener.punsubscribe();
                    } else {
                        listener.unsubscribe();
                    }
                }
            } catch (Exception ignored) {
            }
            try {
                thread.join(1000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            if (thread.isAlive()) {
                // Last resort: dropping the connection forces the
                // blocking subscribe() call to return.
                try {
                    jedis.close();
                } catch (Exception ignored) {
                }
                try {
                    thread.join(500);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
        }

        public boolean isAlive() {
            return !closed && thread.isAlive();
        }

        public Map<String, Object> toMap() {
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("name", name);
            out.put("targets", new ArrayList<>(targets));
            out.put("is_pattern", isPattern);
            out.put("received_total", receivedTotal());
            out.put("alive", isAlive());
            return out;
        }
    }

    private final JedisPool pool;
    private final int bufferSize;

    private final Map<String, Subscription> subscriptions = new ConcurrentHashMap<>();
    private final Object subsLock = new Object();

    private final AtomicLong publishedTotal = new AtomicLong();
    private final AtomicLong deliveredTotal = new AtomicLong();
    private final Map<String, Long> channelPublished = new ConcurrentHashMap<>();

    public RedisPubSubHub(JedisPool pool) {
        this(pool, 50);
    }

    public RedisPubSubHub(JedisPool pool, int bufferSize) {
        this.pool = pool;
        this.bufferSize = bufferSize;
    }

    /**
     * Publish {@code message} to {@code channel} and return Redis'
     * delivered count.
     *
     * <p>The message is JSON-encoded so callers can pass maps, lists, or
     * scalars without serialising on every call. The returned integer is
     * what Redis itself reports: the number of clients (direct or
     * pattern) that received the message in this call.</p>
     */
    public int publish(String channel, Object message) {
        String payload = JsonUtil.toJson(message);
        long delivered;
        try (Jedis jedis = pool.getResource()) {
            delivered = jedis.publish(channel, payload);
        }
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
        synchronized (subsLock) {
            if (subscriptions.containsKey(name)) {
                throw new IllegalArgumentException("subscription named '" + name + "' already exists");
            }
            Subscription sub = new Subscription(name, targets, isPattern, bufferSize);
            subscriptions.put(name, sub);
            return sub;
        }
    }

    /** Close and remove the named subscription. Returns true if it existed. */
    public boolean unsubscribe(String name) {
        Subscription sub;
        synchronized (subsLock) {
            sub = subscriptions.remove(name);
        }
        if (sub == null) {
            return false;
        }
        sub.close();
        return true;
    }

    public List<Subscription> subscriptions() {
        synchronized (subsLock) {
            return new ArrayList<>(subscriptions.values());
        }
    }

    public Subscription getSubscription(String name) {
        return subscriptions.get(name);
    }

    /** List server-side channels with at least one subscriber (PUBSUB CHANNELS). */
    public List<String> activeChannels(String pattern) {
        try (Jedis jedis = pool.getResource()) {
            List<String> channels = new ArrayList<>(jedis.pubsubChannels(pattern == null ? "*" : pattern));
            Collections.sort(channels);
            return channels;
        }
    }

    /**
     * Count subscribers per channel (PUBSUB NUMSUB).
     *
     * <p>Reports only exact-match subscriptions; pattern subscribers are
     * counted separately via {@link #patternSubscriberCount()}.</p>
     */
    public Map<String, Long> channelSubscriberCounts(List<String> channels) {
        Map<String, Long> out = new LinkedHashMap<>();
        if (channels == null || channels.isEmpty()) {
            return out;
        }
        try (Jedis jedis = pool.getResource()) {
            Map<String, Long> result = jedis.pubsubNumSub(channels.toArray(new String[0]));
            // Preserve the input ordering so the JSON output is stable.
            for (String channel : channels) {
                out.put(channel, result.getOrDefault(channel, 0L));
            }
        }
        return out;
    }

    /** Total active pattern subscriptions across all clients (PUBSUB NUMPAT). */
    public long patternSubscriberCount() {
        try (Jedis jedis = pool.getResource()) {
            return jedis.pubsubNumPat();
        }
    }

    /** Combined publish and subscribe counters plus the current registry size. */
    public Map<String, Object> stats() {
        List<Subscription> subs = subscriptions();
        long receivedTotal = 0;
        for (Subscription sub : subs) {
            receivedTotal += sub.receivedTotal();
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("published_total", publishedTotal.get());
        out.put("delivered_total", deliveredTotal.get());
        out.put("received_total", receivedTotal);
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

    /** Close every active subscription. Safe to call more than once. */
    public void shutdown() {
        List<Subscription> subs;
        synchronized (subsLock) {
            subs = new ArrayList<>(subscriptions.values());
            subscriptions.clear();
        }
        for (Subscription sub : subs) {
            sub.close();
        }
    }
}
