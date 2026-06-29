import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Mock background worker for the job-queue demo.
 *
 * <p>A worker pulls jobs off the queue, simulates work by sleeping for a
 * configurable latency, and either completes the job, fails it, or
 * intentionally hangs to simulate a worker crash that the reclaimer must
 * recover from.</p>
 */
public class JobWorker {

    private final String name;
    private final RedisJobQueue queue;
    private volatile int workLatencyMs;
    private volatile double failRate;
    private volatile double hangRate;
    private final AtomicBoolean stop = new AtomicBoolean(false);
    private final AtomicInteger processed = new AtomicInteger(0);
    private volatile Thread thread;

    public JobWorker(String name, RedisJobQueue queue, int workLatencyMs, double failRate, double hangRate) {
        this.name = name;
        this.queue = queue;
        this.workLatencyMs = workLatencyMs;
        this.failRate = failRate;
        this.hangRate = hangRate;
    }

    public String getName() {
        return name;
    }

    public void setWorkLatencyMs(int workLatencyMs) {
        this.workLatencyMs = workLatencyMs;
    }

    public void setFailRate(double failRate) {
        this.failRate = failRate;
    }

    public void setHangRate(double hangRate) {
        this.hangRate = hangRate;
    }

    public synchronized void start() {
        // If a previous run was asked to stop, wait for it to finish before
        // starting a new thread — otherwise we'd return early because the
        // old thread is still draining a blocking claim() call.
        if (thread != null && thread.isAlive()) {
            if (!stop.get()) {
                return;
            }
            try {
                thread.join(2000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
        stop.set(false);
        thread = new Thread(this::run, name);
        thread.setDaemon(true);
        thread.start();
    }

    public void stop() {
        stop.set(true);
    }

    public boolean isAlive() {
        return thread != null && thread.isAlive();
    }

    public int processed() {
        return processed.get();
    }

    public void resetProcessed() {
        processed.set(0);
    }

    private void run() {
        while (!stop.get()) {
            RedisJobQueue.ClaimedJob job;
            try {
                job = queue.claim(500);
            } catch (Exception e) {
                if (stop.get()) {
                    return;
                }
                try {
                    Thread.sleep(100);
                } catch (InterruptedException ignored) {
                    Thread.currentThread().interrupt();
                    return;
                }
                continue;
            }
            if (job == null) {
                continue;
            }
            process(job);
        }
    }

    private void process(RedisJobQueue.ClaimedJob job) {
        String outcome = pickOutcome();
        try {
            Thread.sleep(Math.max(0, workLatencyMs));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return;
        }

        if ("hang".equals(outcome)) {
            // Simulate a crashed worker; the reclaimer will move this back to pending.
            return;
        }

        if ("fail".equals(outcome)) {
            queue.fail(job, name + " simulated failure");
            return;
        }

        processed.incrementAndGet();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("worker", name);
        result.put("echo", job.payload);
        result.put("attempts", job.attempts);
        queue.complete(job, result);
    }

    private String pickOutcome() {
        double roll = ThreadLocalRandom.current().nextDouble();
        if (roll < hangRate) {
            return "hang";
        }
        if (roll < hangRate + failRate) {
            return "fail";
        }
        return "ok";
    }
}
