import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Mock background worker thread that drains a Redis job queue.
 *
 * Pulls jobs off the queue, simulates work by sleeping for a configurable
 * latency, and then either completes the job, fails it, or intentionally
 * hangs to simulate a worker crash that the reclaimer must recover from.
 */
public class JobWorker {

    private final String name;
    private final RedisJobQueue queue;
    private volatile int workLatencyMs;
    private volatile double failRate;
    private volatile double hangRate;
    private final AtomicBoolean stopFlag = new AtomicBoolean(false);
    private volatile Thread thread;
    private final AtomicInteger processed = new AtomicInteger(0);

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

    /** Start the worker. If a previous run was asked to stop, wait for it. */
    public synchronized void start() {
        Thread existing = thread;
        if (existing != null && existing.isAlive()) {
            if (!stopFlag.get()) {
                return;
            }
            try {
                existing.join(2000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
        stopFlag.set(false);
        Thread t = new Thread(this::run, name);
        t.setDaemon(true);
        thread = t;
        t.start();
    }

    public void stop() {
        stopFlag.set(true);
    }

    public boolean isAlive() {
        Thread t = thread;
        return t != null && t.isAlive();
    }

    public int processed() {
        return processed.get();
    }

    public void resetProcessed() {
        processed.set(0);
    }

    private void run() {
        while (!stopFlag.get()) {
            try {
                RedisJobQueue.ClaimedJob job = queue.claim(500);
                if (job == null) {
                    continue;
                }
                process(job);
            } catch (Exception ex) {
                System.err.printf("[%s] error in claim/process: %s%n", name, ex.getMessage());
                try { Thread.sleep(50); } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
    }

    private void process(RedisJobQueue.ClaimedJob job) {
        String outcome = pickOutcome();
        try {
            Thread.sleep(workLatencyMs);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            return;
        }

        if ("hang".equals(outcome)) {
            // Simulate a worker that crashed mid-job: don't complete, don't
            // fail. The reclaimer will move this job back to pending once
            // the visibility timeout elapses.
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
