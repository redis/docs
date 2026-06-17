import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Deque;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Background consumer thread for a single consumer in a consumer group.
 *
 * <p>Each worker owns a daemon thread that loops on
 * {@code XREADGROUP >} with a short block timeout and acks every entry
 * it processes. Recovery of stuck PEL entries (this consumer's, or
 * anyone else's) happens through {@link #reapIdlePel()}, which is the
 * textbook Streams pattern: each consumer periodically (or on demand)
 * calls {@code XAUTOCLAIM} with itself as the target, then processes
 * whatever it claimed. The demo's "XAUTOCLAIM to selected" button is
 * exactly that call.</p>
 *
 * <p>Two demo-only levers are wired into the loop:</p>
 * <ul>
 *   <li>{@link #pause()} parks the worker so its pending entries can
 *   age into the {@code XAUTOCLAIM} window without being consumed by
 *   {@code >} reads.</li>
 *   <li>{@link #crashNext(int)} tells the worker to drop its next
 *   {@code n} deliveries on the floor without acking them — the same
 *   effect as a worker process dying mid-message. Those entries stay
 *   in the group's PEL until {@link #reapIdlePel()} recovers them.</li>
 * </ul>
 *
 * <p>Real consumers do not need either lever; they only need
 * {@code XREADGROUP} → process → {@code XACK} in {@code run} plus a
 * periodic {@code reapIdlePel} call.</p>
 */
public class ConsumerWorker {

    /** A summary of the worker's status for the demo UI / JSON. */
    public static final class ConsumerStatus {
        public final String name;
        public final String group;
        public final long processed;
        public final long reaped;
        public final long crashedDrops;
        public final boolean paused;
        public final int crashQueued;
        public final boolean alive;

        public ConsumerStatus(String name, String group, long processed, long reaped,
                              long crashedDrops, boolean paused, int crashQueued, boolean alive) {
            this.name = name;
            this.group = group;
            this.processed = processed;
            this.reaped = reaped;
            this.crashedDrops = crashedDrops;
            this.paused = paused;
            this.crashQueued = crashQueued;
            this.alive = alive;
        }
    }

    /** A row in the worker's bounded "recent activity" deque. */
    public static final class RecentEntry {
        public final String id;
        public final String type;
        public final Map<String, String> fields;
        public final boolean acked;
        public final String note;

        public RecentEntry(String id, String type, Map<String, String> fields, boolean acked, String note) {
            this.id = id;
            this.type = type;
            this.fields = fields;
            this.acked = acked;
            this.note = note;
        }
    }

    /** Outcome of one reap pass. */
    public static final class ReapResult {
        public final int claimed;
        public final int processed;
        public final List<String> deletedIds;

        public ReapResult(int claimed, int processed, List<String> deletedIds) {
            this.claimed = claimed;
            this.processed = processed;
            this.deletedIds = deletedIds;
        }
    }

    private final EventStream stream;
    private final String group;
    private final String name;
    private final long processLatencyMs;
    private final int recentCapacity;

    private final Object lock = new Object();
    private final Deque<RecentEntry> recent = new ArrayDeque<>();
    private long processed = 0L;
    private long reaped = 0L;
    private long crashedDrops = 0L;
    private int crashNextCount = 0;
    private volatile boolean paused = false;

    private volatile boolean stopRequested = false;
    private Thread thread;

    public ConsumerWorker(EventStream stream, String group, String name) {
        this(stream, group, name, 25L, 20);
    }

    public ConsumerWorker(EventStream stream, String group, String name,
                          long processLatencyMs, int recentCapacity) {
        if (stream == null || group == null || name == null) {
            throw new IllegalArgumentException("stream, group, and name are required");
        }
        this.stream = stream;
        this.group = group;
        this.name = name;
        this.processLatencyMs = Math.max(0L, processLatencyMs);
        this.recentCapacity = Math.max(1, recentCapacity);
    }

    public String getGroup() { return group; }
    public String getName() { return name; }

    // ------------------------------------------------------------------
    // Lifecycle
    // ------------------------------------------------------------------

    public synchronized void start() {
        if (thread != null && thread.isAlive()) return;
        stopRequested = false;
        thread = new Thread(this::run, "consumer-" + group + "-" + name);
        thread.setDaemon(true);
        thread.start();
    }

    public synchronized void stop() { stop(1000L); }

    public synchronized void stop(long joinTimeoutMs) {
        stopRequested = true;
        if (thread != null) {
            try {
                thread.join(joinTimeoutMs);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            if (!thread.isAlive()) thread = null;
        }
    }

    // ------------------------------------------------------------------
    // Demo levers
    // ------------------------------------------------------------------

    public void pause() { paused = true; }

    public void resume() { paused = false; }

    /**
     * Drop the next {@code count} deliveries without acking them.
     *
     * <p>The entries stay in the group's PEL with their delivery
     * counter incremented, so {@code XAUTOCLAIM} can recover them
     * once they exceed the idle threshold.</p>
     */
    public void crashNext(int count) {
        if (count <= 0) return;
        synchronized (lock) {
            crashNextCount += count;
        }
    }

    // ------------------------------------------------------------------
    // Introspection
    // ------------------------------------------------------------------

    public List<RecentEntry> recent() {
        synchronized (lock) {
            return new ArrayList<>(recent);
        }
    }

    public ConsumerStatus status() {
        synchronized (lock) {
            boolean alive;
            synchronized (this) {
                alive = thread != null && thread.isAlive();
            }
            return new ConsumerStatus(
                    name, group, processed, reaped, crashedDrops,
                    paused, crashNextCount, alive);
        }
    }

    // ------------------------------------------------------------------
    // Recovery
    // ------------------------------------------------------------------

    /**
     * Run {@code XAUTOCLAIM} into self and process the claimed entries.
     *
     * <p>Safe to call from any thread — the heavy lifting is the Redis
     * round trip plus a sequential per-entry dispatch. {@code claimed}
     * is the count returned by Redis, {@code processed} is what this
     * consumer actually handled (may differ if a handler throws), and
     * {@code deletedIds} are PEL entries whose stream payload was
     * already trimmed by {@code MAXLEN ~} or {@code XTRIM} before the
     * sweep ran. Redis 7+ removes those slots from the PEL inside
     * {@code XAUTOCLAIM} itself, so the caller does not have to
     * {@code XACK} them; they are reported so the caller can route
     * them to a dead-letter store.</p>
     */
    public ReapResult reapIdlePel() {
        EventStream.AutoClaimResult result = stream.autoclaim(
                group, name, 100L, "0-0", 10);
        int processedThisCall = 0;
        for (EventStream.Entry entry : result.claimed) {
            try {
                handleEntry(entry.id, entry.fields);
                processedThisCall += 1;
            } catch (Exception exc) {
                System.err.printf("[%s/%s] reap failed on %s: %s%n",
                        group, name, entry.id, exc.getMessage());
            }
        }
        if (processedThisCall > 0) {
            synchronized (lock) {
                reaped += processedThisCall;
            }
        }
        return new ReapResult(result.claimed.size(), processedThisCall, result.deletedIds);
    }

    // ------------------------------------------------------------------
    // Main loop
    // ------------------------------------------------------------------

    private void run() {
        while (!stopRequested) {
            if (paused) {
                sleepQuietly(50L);
                continue;
            }
            List<EventStream.Entry> entries;
            try {
                entries = stream.consume(group, name, 10L, 500L);
            } catch (Exception exc) {
                // Don't kill the thread on a transient Redis error; a
                // real consumer would log this and back off.
                System.err.printf("[%s/%s] read failed: %s%n",
                        group, name, exc.getMessage());
                sleepQuietly(500L);
                continue;
            }
            if (entries == null || entries.isEmpty()) continue;
            for (EventStream.Entry entry : entries) {
                dispatch(entry.id, entry.fields);
            }
        }
    }

    private void dispatch(String entryId, Map<String, String> fields) {
        if (processLatencyMs > 0) sleepQuietly(processLatencyMs);
        try {
            handleEntry(entryId, fields);
        } catch (Exception exc) {
            // A failure here (typically XACK against Redis) must not
            // kill the daemon thread — that would silently halt this
            // consumer while every other entry sat in its PEL waiting
            // for XAUTOCLAIM. The entry stays unacked; the next
            // reapIdlePel call (here or on any consumer in the group)
            // can recover it once it exceeds the idle threshold.
            System.err.printf("[%s/%s] failed to handle %s: %s%n",
                    group, name, entryId, exc.getMessage());
            String type = fields == null ? "" : fields.getOrDefault("type", "");
            pushRecent(new RecentEntry(entryId, type, copyFields(fields),
                    false, "handler error: " + exc.getMessage()));
        }
    }

    private void handleEntry(String entryId, Map<String, String> fields) {
        boolean drop = false;
        synchronized (lock) {
            if (crashNextCount > 0) {
                crashNextCount -= 1;
                drop = true;
            }
        }
        String type = fields == null ? "" : fields.getOrDefault("type", "");
        if (drop) {
            synchronized (lock) {
                crashedDrops += 1;
            }
            pushRecent(new RecentEntry(entryId, type, copyFields(fields),
                    false, "dropped (simulated crash)"));
            return;
        }
        stream.ack(group, Collections.singletonList(entryId));
        synchronized (lock) {
            processed += 1;
        }
        pushRecent(new RecentEntry(entryId, type, copyFields(fields), true, ""));
    }

    private void pushRecent(RecentEntry entry) {
        synchronized (lock) {
            recent.addFirst(entry);
            while (recent.size() > recentCapacity) recent.removeLast();
        }
    }

    private static Map<String, String> copyFields(Map<String, String> fields) {
        if (fields == null) return new LinkedHashMap<>();
        return new LinkedHashMap<>(fields);
    }

    private static void sleepQuietly(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
