import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Background sync worker for the prefetch-cache demo.
 *
 * <p>A daemon thread drains the primary's change queue and applies each
 * event to Redis through {@link PrefetchCache#applyChange(Map)}. In a
 * real system, the queue is replaced by a CDC pipeline (Redis Data
 * Integration, Debezium, or an equivalent) that tails the primary's
 * binlog/WAL and writes the same shape of events.</p>
 *
 * <p>The worker exposes {@link #pause()} and {@link #resume()} so
 * maintenance paths ({@code /reprefetch}, {@code clear()}) can stop
 * event application without tearing the thread down. {@code pause()}
 * blocks until the worker is parked, so the caller knows no apply is in
 * flight by the time it returns.</p>
 */
public class SyncWorker {

    private final MockPrimaryStore primary;
    private final PrefetchCache cache;
    private final long pollTimeoutMs;

    private final ReentrantLock lock = new ReentrantLock();
    /** Signalled when {@link #pause()} or {@link #resume()} changes the run-state flag. */
    private final Condition stateChanged = lock.newCondition();
    /** Signalled when the worker has confirmed it is parked. */
    private final Condition idleSignal = lock.newCondition();

    private volatile boolean stopRequested;
    private volatile boolean pauseRequested;
    private volatile boolean workerIdle;

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

    /** Spawn the worker if it isn't already running. */
    public synchronized void start() {
        if (thread != null && thread.isAlive()) {
            return;
        }
        stopRequested = false;
        pauseRequested = false;
        workerIdle = false;
        thread = new Thread(this::run, "prefetch-cache-sync");
        thread.setDaemon(true);
        thread.start();
    }

    /**
     * Signal the worker to exit and join its thread.
     *
     * <p>If the join times out the worker is wedged inside an apply; we
     * leave {@code thread} populated so a subsequent {@link #start()}
     * does not spawn a second worker on top of the orphan.</p>
     */
    public synchronized void stop(long joinTimeoutMs) {
        stopRequested = true;
        lock.lock();
        try {
            stateChanged.signalAll();
        } finally {
            lock.unlock();
        }
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

    public void stop() {
        stop(2000L);
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
        lock.lock();
        try {
            pauseRequested = true;
            workerIdle = false;
            stateChanged.signalAll();
            if (thread == null || !thread.isAlive()) {
                return true;
            }
            long deadline = System.nanoTime() + TimeUnit.MILLISECONDS.toNanos(timeoutMs);
            while (!workerIdle) {
                long remaining = deadline - System.nanoTime();
                if (remaining <= 0L) {
                    return false;
                }
                try {
                    idleSignal.awaitNanos(remaining);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    return false;
                }
            }
            return true;
        } finally {
            lock.unlock();
        }
    }

    public boolean pause() {
        return pause(2000L);
    }

    public void resume() {
        lock.lock();
        try {
            pauseRequested = false;
            workerIdle = false;
            stateChanged.signalAll();
        } finally {
            lock.unlock();
        }
    }

    private void run() {
        while (!stopRequested) {
            if (pauseRequested) {
                lock.lock();
                try {
                    // Park until resume/stop. Re-announce "I am idle" on
                    // every iteration so a *new* pause() that arrives
                    // while we are still parked from the previous cycle
                    // gets acknowledged immediately, not after the
                    // caller's full pause-timeout.
                    while (pauseRequested && !stopRequested) {
                        workerIdle = true;
                        idleSignal.signalAll();
                        try {
                            stateChanged.await();
                        } catch (InterruptedException e) {
                            Thread.currentThread().interrupt();
                            stopRequested = true;
                            break;
                        }
                    }
                    workerIdle = false;
                } finally {
                    lock.unlock();
                }
                continue;
            }

            Map<String, Object> change;
            try {
                change = primary.nextChange(pollTimeoutMs);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
            if (change == null) {
                continue;
            }
            try {
                cache.applyChange(change);
            } catch (Exception exc) {
                // Demo behaviour: log and drop the event. A production CDC
                // consumer would retry with bounded backoff and expose a
                // dead-letter / error counter; see the guide's "Production
                // usage" section.
                System.err.println("[sync] failed to apply " + change + ": " + exc);
            }
        }
    }
}
