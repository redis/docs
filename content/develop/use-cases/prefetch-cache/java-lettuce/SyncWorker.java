import java.util.Map;

/**
 * Background sync worker for the prefetch-cache demo.
 *
 * <p>A daemon {@link Thread} drains the primary's change queue and
 * applies each event to Redis through
 * {@link PrefetchCache#applyChange(Map)}. In a real system, the queue
 * is replaced by a CDC pipeline (Redis Data Integration, Debezium, or
 * an equivalent) that tails the primary's binlog/WAL and writes the
 * same shape of events.</p>
 *
 * <p>The worker exposes {@link #pause(long)} and {@link #resume()} so
 * maintenance paths ({@code /reprefetch}, {@link PrefetchCache#clear()})
 * can stop event application without tearing the thread down.
 * {@code pause} blocks until the worker is parked, so the caller knows
 * no apply is in flight by the time it returns.</p>
 */
public class SyncWorker {

    private final MockPrimaryStore primary;
    private final PrefetchCache cache;
    private final long pollTimeoutMs;

    private volatile boolean stopRequested = false;
    private volatile boolean pauseRequested = false;

    // Signals worker has parked itself inside the pause loop. Cleared
    // by the worker on resume so the next pause can wait again.
    private final Object pausedSignal = new Object();
    private volatile boolean pausedIdle = false;

    private Thread thread;

    public SyncWorker(MockPrimaryStore primary, PrefetchCache cache) {
        this(primary, cache, 50L);
    }

    public SyncWorker(MockPrimaryStore primary, PrefetchCache cache, long pollTimeoutMs) {
        if (primary == null || cache == null) {
            throw new IllegalArgumentException("primary and cache are required");
        }
        this.primary = primary;
        this.cache = cache;
        this.pollTimeoutMs = pollTimeoutMs;
    }

    public synchronized void start() {
        if (thread != null && thread.isAlive()) {
            return;
        }
        stopRequested = false;
        pauseRequested = false;
        pausedIdle = false;
        thread = new Thread(this::run, "prefetch-cache-sync");
        thread.setDaemon(true);
        thread.start();
    }

    /**
     * Signal the worker to exit and join its thread.
     *
     * <p>If the join times out the worker is wedged inside
     * {@code applyChange}; we leave {@link #thread} populated so a
     * subsequent {@link #start()} does not spawn a second worker on
     * top of the orphan.</p>
     */
    public synchronized void stop(long joinTimeoutMs) {
        stopRequested = true;
        // Also wake the worker out of any park loop.
        synchronized (pausedSignal) {
            pausedSignal.notifyAll();
        }
        if (thread == null) return;
        try {
            thread.join(joinTimeoutMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return;
        }
        if (!thread.isAlive()) {
            thread = null;
        }
    }

    /**
     * Stop applying events and block until the worker is parked.
     *
     * <p>Returns {@code true} once the worker has confirmed it is idle,
     * or {@code false} if the timeout elapsed first. While paused,
     * change events accumulate in the primary's queue and are applied
     * in order after {@link #resume()}.</p>
     */
    public boolean pause(long timeoutMs) {
        Thread workerSnapshot;
        synchronized (this) {
            workerSnapshot = thread;
        }
        pausedIdle = false;
        pauseRequested = true;
        if (workerSnapshot == null || !workerSnapshot.isAlive()) {
            // No worker running — nothing to wait on, treat as paused.
            return true;
        }
        long deadline = System.nanoTime() + timeoutMs * 1_000_000L;
        synchronized (pausedSignal) {
            while (!pausedIdle && System.nanoTime() < deadline) {
                long remainingNanos = deadline - System.nanoTime();
                if (remainingNanos <= 0) break;
                long remainingMs = Math.max(1L, remainingNanos / 1_000_000L);
                try {
                    pausedSignal.wait(remainingMs);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    return pausedIdle;
                }
            }
        }
        return pausedIdle;
    }

    public void resume() {
        pauseRequested = false;
        pausedIdle = false;
        synchronized (pausedSignal) {
            pausedSignal.notifyAll();
        }
    }

    private void run() {
        while (!stopRequested) {
            if (pauseRequested) {
                synchronized (pausedSignal) {
                    // Park until pause is lifted or worker is stopped.
                    // Re-announce "pausedIdle" on every iteration so a
                    // *new* pause() that arrives while we are still
                    // parked from the previous cycle gets acknowledged
                    // immediately, not after the caller's full
                    // pause-timeout.
                    while (pauseRequested && !stopRequested) {
                        pausedIdle = true;
                        pausedSignal.notifyAll();
                        try {
                            pausedSignal.wait(pollTimeoutMs);
                        } catch (InterruptedException e) {
                            Thread.currentThread().interrupt();
                            return;
                        }
                    }
                    pausedIdle = false;
                }
                continue;
            }

            Map<String, Object> change = primary.nextChange(pollTimeoutMs);
            if (change == null) {
                continue;
            }
            try {
                cache.applyChange(change);
            } catch (Exception exc) {
                // Demo behaviour: log and drop the event. A production
                // CDC consumer would retry with bounded backoff and
                // expose a dead-letter / error counter; see the guide's
                // "Production usage" section.
                System.err.printf("[sync] failed to apply %s: %s%n",
                        change, exc.getMessage());
            }
        }
    }
}
