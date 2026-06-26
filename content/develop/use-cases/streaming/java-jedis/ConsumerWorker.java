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
 * <p>Each worker owns a daemon thread that loops on {@code XREADGROUP >}
 * with a short block timeout and acks every entry it processes. Recovery
 * of stuck PEL entries (this consumer's, or anyone else's) happens
 * through {@link #reapIdlePel()}, which is the textbook Streams pattern:
 * each consumer periodically (or on demand) calls {@code XAUTOCLAIM}
 * with itself as the target, then processes whatever it claimed. The
 * demo's "XAUTOCLAIM to selected" button is exactly that call.</p>
 *
 * <p>Two demo-only levers are wired into the loop:</p>
 * <ul>
 *   <li>{@link #pause()} parks the worker (so its pending entries age
 *   into the {@code XAUTOCLAIM} window without being consumed by
 *   {@code >} reads).</li>
 *   <li>{@link #crashNext(int)} tells the worker to drop its next
 *   {@code n} deliveries on the floor without acking them — the same
 *   effect as a worker process dying mid-message.</li>
 * </ul>
 *
 * <p>Real consumers do not need either lever; they only need
 * {@code XREADGROUP} → process → {@code XACK} in {@code run} and a
 * periodic {@link #reapIdlePel()} call to recover stuck entries.</p>
 */
public class ConsumerWorker {

    private final EventStream stream;
    private final String group;
    private final String name;
    private final long processLatencyMs;
    private final int recentCapacity;

    private final Object lock = new Object();
    private final Deque<Map<String, Object>> recent;
    private long processed;
    private long reaped;
    private long crashedDrops;
    private int crashNext;
    private volatile boolean paused;
    private volatile boolean stopRequested;
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
        this.recentCapacity = recentCapacity > 0 ? recentCapacity : 20;
        this.recent = new ArrayDeque<>(this.recentCapacity);
    }

    public String getName() {
        return name;
    }

    public String getGroup() {
        return group;
    }

    // ------------------------------------------------------------------
    // Lifecycle
    // ------------------------------------------------------------------

    public synchronized void start() {
        if (thread != null && thread.isAlive()) {
            return;
        }
        stopRequested = false;
        thread = new Thread(this::run, "consumer-" + group + "-" + name);
        thread.setDaemon(true);
        thread.start();
    }

    public synchronized void stop() {
        stop(1000L);
    }

    public synchronized void stop(long joinTimeoutMs) {
        stopRequested = true;
        if (thread == null) {
            return;
        }
        try {
            thread.join(joinTimeoutMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        if (!thread.isAlive()) {
            thread = null;
        }
    }

    // ------------------------------------------------------------------
    // Demo levers
    // ------------------------------------------------------------------

    public void pause() {
        paused = true;
    }

    public void resume() {
        paused = false;
    }

    /**
     * Drop the next {@code count} deliveries without acking them.
     *
     * <p>The entries stay in the group's PEL with their delivery counter
     * incremented, so {@code XAUTOCLAIM} can recover them once they
     * exceed the idle threshold.</p>
     */
    public void crashNext(int count) {
        if (count <= 0) {
            return;
        }
        synchronized (lock) {
            crashNext += count;
        }
    }

    // ------------------------------------------------------------------
    // Introspection
    // ------------------------------------------------------------------

    public List<Map<String, Object>> recent() {
        synchronized (lock) {
            return new ArrayList<>(recent);
        }
    }

    public Map<String, Object> status() {
        Map<String, Object> status = new LinkedHashMap<>();
        synchronized (lock) {
            status.put("name", name);
            status.put("group", group);
            status.put("processed", processed);
            status.put("reaped", reaped);
            status.put("crashed_drops", crashedDrops);
            status.put("paused", paused);
            status.put("crash_queued", (long) crashNext);
            status.put("alive", thread != null && thread.isAlive());
        }
        return status;
    }

    // ------------------------------------------------------------------
    // Recovery
    // ------------------------------------------------------------------

    /** Result returned by {@link #reapIdlePel()}. */
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

    /**
     * Run {@code XAUTOCLAIM} into self and process the claimed entries.
     *
     * <p>Safe to call from any thread — the heavy lifting is
     * {@code stream.autoclaim} (a Redis call) and the sequential
     * per-entry dispatch via {@link #handleEntry}. The
     * {@code deletedIds} list contains PEL entries whose stream payload
     * was already trimmed by {@code MAXLEN ~} / {@code XTRIM} before the
     * sweep ran. Redis 7+ removes them from the PEL inside
     * {@code XAUTOCLAIM} itself, so the caller does not have to
     * {@code XACK} them; they are reported so the caller can route them
     * to a dead-letter store.</p>
     */
    public ReapResult reapIdlePel() {
        EventStream.AutoClaimResult result = stream.autoclaim(group, name, 100, "0-0", 10);
        int processedCount = 0;
        for (EventStream.Entry entry : result.claimed) {
            try {
                handleEntry(entry.id, entry.fields);
                processedCount++;
            } catch (Exception exc) {
                System.err.printf(
                        "[%s/%s] reap failed on %s: %s%n",
                        group, name, entry.id, exc);
            }
        }
        synchronized (lock) {
            reaped += processedCount;
        }
        return new ReapResult(
                result.claimed.size(), processedCount,
                result.deletedIds == null ? Collections.emptyList() : result.deletedIds);
    }

    // ------------------------------------------------------------------
    // Main loop
    // ------------------------------------------------------------------

    private void run() {
        while (!stopRequested) {
            if (paused) {
                sleep(50L);
                continue;
            }
            List<EventStream.Entry> entries;
            try {
                entries = stream.consume(group, name, 10, 500L);
            } catch (Exception exc) {
                // Don't kill the thread on a transient Redis error; a
                // real consumer would log this and back off.
                System.err.printf("[%s/%s] read failed: %s%n", group, name, exc);
                sleep(500L);
                continue;
            }
            if (entries == null) {
                continue;
            }
            for (EventStream.Entry entry : entries) {
                dispatch(entry.id, entry.fields);
            }
        }
    }

    private void dispatch(String entryId, Map<String, String> fields) {
        if (processLatencyMs > 0L) {
            sleep(processLatencyMs);
        }
        try {
            handleEntry(entryId, fields);
        } catch (Exception exc) {
            // A failure here (typically XACK against Redis) must not
            // kill the daemon thread — that would silently halt this
            // consumer while every other entry sat in its PEL waiting
            // for XAUTOCLAIM. The entry stays unacked; the next
            // reapIdlePel call (here or on any consumer in the group)
            // can recover it once it exceeds the idle threshold.
            System.err.printf("[%s/%s] failed to handle %s: %s%n", group, name, entryId, exc);
            synchronized (lock) {
                recordRecent(entryId, fields, false, "handler error: " + exc);
            }
        }
    }

    private void handleEntry(String entryId, Map<String, String> fields) {
        boolean drop;
        synchronized (lock) {
            drop = crashNext > 0;
            if (drop) {
                crashNext--;
            }
        }

        if (drop) {
            synchronized (lock) {
                crashedDrops++;
                recordRecent(entryId, fields, false, "dropped (simulated crash)");
            }
            return;
        }

        stream.ack(group, Collections.singletonList(entryId));
        synchronized (lock) {
            processed++;
            recordRecent(entryId, fields, true, "");
        }
    }

    private void recordRecent(
            String entryId, Map<String, String> fields, boolean acked, String note) {
        Map<String, Object> rec = new LinkedHashMap<>();
        rec.put("id", entryId);
        rec.put("type", fields.getOrDefault("type", ""));
        rec.put("fields", fields);
        rec.put("acked", acked);
        rec.put("note", note);
        if (recent.size() >= recentCapacity) {
            recent.pollLast();
        }
        recent.addFirst(rec);
    }

    private static void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
