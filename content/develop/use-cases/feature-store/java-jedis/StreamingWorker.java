import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Streaming feature updater for the demo.
 *
 * <p>Stands in for whatever Flink, Kafka Streams, or bespoke service
 * computes the real-time features in a real deployment. In production
 * this code lives in the streaming layer; here it runs as a daemon
 * Thread next to the demo server so the page can start, pause, and
 * resume it from the UI.</p>
 *
 * <p>Every tick it picks a few random users and writes a new value
 * for each streaming feature, with a per-field {@code HEXPIRE} so the
 * field self-expires if the worker is paused. Pause the worker for
 * longer than {@code streamingTtlSeconds} and the streaming fields
 * drop out of the hash while the batch fields remain populated under
 * the longer key-level TTL — the <em>mixed staleness</em> story made
 * visible.</p>
 */
public class StreamingWorker {

    private static final List<String> DEVICE_IDS = List.of(
        "ios-1a4c", "ios-9f02", "and-7b21", "and-2d18",
        "web-chr-1", "web-saf-1", "web-ff-2");
    private static final List<String> SESSION_COUNTRIES = List.of(
        "US", "GB", "DE", "FR", "IN", "BR", "JP", "AU", "CA", "NL");
    private static final int[] FAILED_LOGIN_BUCKETS = {0, 1, 2, 5};
    private static final int[] FAILED_LOGIN_WEIGHTS = {70, 20, 8, 2};

    private final FeatureStore store;
    private final long tickMillis;
    private final int usersPerTick;
    private final Random rng;

    private final Object rngLock = new Object();
    private final AtomicBoolean running = new AtomicBoolean(false);
    private final AtomicBoolean paused = new AtomicBoolean(false);
    private final AtomicBoolean tickInFlight = new AtomicBoolean(false);
    private final AtomicLong tickCount = new AtomicLong();
    private final AtomicLong writesCount = new AtomicLong();

    private Thread worker;

    public StreamingWorker(FeatureStore store, long tickMillis, int usersPerTick, long seed) {
        this.store = store;
        this.tickMillis = tickMillis > 0 ? tickMillis : 1000L;
        this.usersPerTick = usersPerTick > 0 ? usersPerTick : 5;
        this.rng = new Random(seed);
    }

    public int getUsersPerTick() { return usersPerTick; }

    // ---------------------------------------------------------------
    // Lifecycle
    // ---------------------------------------------------------------

    /** Start the worker thread. Safe to call when already running. */
    public synchronized void start() {
        if (running.get()) return;
        running.set(true);
        paused.set(false);
        worker = new Thread(this::run, "streaming-worker");
        worker.setDaemon(true);
        worker.start();
    }

    /** Stop the worker and wait for any in-flight tick to finish. */
    public synchronized void stop() {
        if (!running.getAndSet(false)) return;
        if (worker != null) {
            try {
                worker.join(2000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            worker = null;
        }
        waitForIdle();
    }

    public void pause() { paused.set(true); }
    public void resume() { paused.set(false); }

    public boolean isRunning() { return running.get(); }
    public boolean isPaused() { return paused.get(); }

    /**
     * Block until any in-flight tick has finished its current
     * updateStreaming loop. {@link #pause()} only stops <em>future</em>
     * ticks from running — it does not interrupt one that is already
     * mid-flight. Callers that need a quiesced worker (a reset that's
     * about to DEL every entity, for example) must call {@code pause()}
     * AND {@code waitForIdle()} before they touch state the tick
     * might still be writing to.
     */
    public void waitForIdle() {
        // Reset cannot safely proceed while a tick is mid-write, so an
        // interrupt during the wait must NOT short-circuit out with
        // tickInFlight still true. Save the interrupt status, keep
        // looping until the tick clears, then restore the flag so the
        // caller can act on it if they care.
        boolean interrupted = false;
        while (tickInFlight.get()) {
            try {
                Thread.sleep(20);
            } catch (InterruptedException e) {
                interrupted = true;
            }
        }
        if (interrupted) {
            Thread.currentThread().interrupt();
        }
    }

    // ---------------------------------------------------------------
    // Tick
    // ---------------------------------------------------------------

    private void run() {
        try {
            while (running.get()) {
                try {
                    Thread.sleep(tickMillis);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
                if (!running.get()) break;

                // Set tickInFlight *before* the pause check so a
                // concurrent pause()+waitForIdle() can never see
                // tickInFlight=false in the window between the pause
                // check and the actual doTick call. The finally
                // block clears the flag whether we paused, succeeded,
                // or threw.
                tickInFlight.set(true);
                try {
                    if (!paused.get()) {
                        doTick();
                    }
                } catch (Exception e) {
                    System.err.printf("[streaming-worker] tick failed: %s%n", e.getMessage());
                } finally {
                    tickInFlight.set(false);
                }
            }
        } finally {
            // Whatever exits this thread — running flipping false,
            // an interrupt, or any unexpected throw — must clear
            // both the running and in-flight flags so a later start()
            // can spin a fresh thread.
            running.set(false);
            tickInFlight.set(false);
        }
    }

    private void doTick() {
        List<String> ids = store.listEntityIds(500);
        if (ids.isEmpty()) return;
        List<String> picks = sample(ids, usersPerTick);
        long nowMs = System.currentTimeMillis();
        int writes = 0;
        for (String id : picks) {
            Map<String, Object> fields = new LinkedHashMap<>();
            fields.put("last_login_ts", nowMs);
            fields.put("last_device_id", choice(DEVICE_IDS));
            fields.put("tx_count_5m", intn(13));
            fields.put("failed_logins_15m", weightedInt(FAILED_LOGIN_BUCKETS, FAILED_LOGIN_WEIGHTS));
            fields.put("session_country", choice(SESSION_COUNTRIES));
            store.updateStreaming(id, fields);
            writes += fields.size();
        }
        tickCount.incrementAndGet();
        writesCount.addAndGet(writes);
    }

    // ---------------------------------------------------------------
    // Stats
    // ---------------------------------------------------------------

    public Stats statsSnapshot() {
        return new Stats(isRunning(), isPaused(), tickCount.get(), writesCount.get());
    }

    public void resetStats() {
        tickCount.set(0);
        writesCount.set(0);
    }

    public static record Stats(
        boolean running,
        boolean paused,
        long tickCount,
        long writesCount
    ) {}

    // ---------------------------------------------------------------
    // RNG helpers (all synchronized on rngLock so the worker stays
    // deterministic across concurrent toggles from the demo UI).
    // ---------------------------------------------------------------

    private List<String> sample(List<String> items, int k) {
        synchronized (rngLock) {
            int n = Math.min(k, items.size());
            List<String> pool = new java.util.ArrayList<>(items);
            List<String> out = new java.util.ArrayList<>(n);
            for (int i = 0; i < n; i++) {
                int idx = rng.nextInt(pool.size());
                out.add(pool.remove(idx));
            }
            return out;
        }
    }

    private String choice(List<String> items) {
        synchronized (rngLock) {
            return items.get(rng.nextInt(items.size()));
        }
    }

    private int intn(int n) {
        synchronized (rngLock) {
            return rng.nextInt(n);
        }
    }

    private int weightedInt(int[] items, int[] weights) {
        synchronized (rngLock) {
            int total = 0;
            for (int w : weights) total += w;
            int r = rng.nextInt(total);
            for (int i = 0; i < items.length; i++) {
                r -= weights[i];
                if (r < 0) return items[i];
            }
            return items[items.length - 1];
        }
    }
}
