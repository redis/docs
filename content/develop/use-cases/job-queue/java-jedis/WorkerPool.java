import java.util.ArrayList;
import java.util.List;

/**
 * A pool of named JobWorker threads that can be started and stopped.
 */
public class WorkerPool {

    private final RedisJobQueue queue;
    private int workLatencyMs;
    private double failRate;
    private double hangRate;
    private final List<JobWorker> workers = new ArrayList<>();
    private final Object lock = new Object();

    public WorkerPool(RedisJobQueue queue, int size, int workLatencyMs, double failRate, double hangRate) {
        this.queue = queue;
        this.workLatencyMs = workLatencyMs;
        this.failRate = failRate;
        this.hangRate = hangRate;
        resize(size);
    }

    public int getWorkLatencyMs() {
        synchronized (lock) {
            return workLatencyMs;
        }
    }

    public double getFailRate() {
        synchronized (lock) {
            return failRate;
        }
    }

    public double getHangRate() {
        synchronized (lock) {
            return hangRate;
        }
    }

    public void resize(int size) {
        synchronized (lock) {
            while (workers.size() < size) {
                JobWorker worker = new JobWorker(
                        "worker-" + (workers.size() + 1),
                        queue,
                        workLatencyMs,
                        failRate,
                        hangRate
                );
                workers.add(worker);
            }
            while (workers.size() > size) {
                JobWorker worker = workers.remove(workers.size() - 1);
                worker.stop();
            }
        }
    }

    public void start() {
        synchronized (lock) {
            for (JobWorker worker : workers) {
                worker.setWorkLatencyMs(workLatencyMs);
                worker.setFailRate(failRate);
                worker.setHangRate(hangRate);
                worker.start();
            }
        }
    }

    public void stop() {
        synchronized (lock) {
            for (JobWorker worker : workers) {
                worker.stop();
            }
        }
    }

    public int running() {
        synchronized (lock) {
            int count = 0;
            for (JobWorker worker : workers) {
                if (worker.isAlive()) {
                    count++;
                }
            }
            return count;
        }
    }

    public int totalProcessed() {
        synchronized (lock) {
            int total = 0;
            for (JobWorker worker : workers) {
                total += worker.processed();
            }
            return total;
        }
    }

    public void resetProcessed() {
        synchronized (lock) {
            for (JobWorker worker : workers) {
                worker.resetProcessed();
            }
        }
    }

    public void configure(Integer workLatencyMs, Double failRate, Double hangRate) {
        synchronized (lock) {
            if (workLatencyMs != null) {
                this.workLatencyMs = Math.max(0, workLatencyMs);
            }
            if (failRate != null) {
                this.failRate = Math.max(0.0, Math.min(1.0, failRate));
            }
            if (hangRate != null) {
                this.hangRate = Math.max(0.0, Math.min(1.0, hangRate));
            }
            for (JobWorker worker : workers) {
                worker.setWorkLatencyMs(this.workLatencyMs);
                worker.setFailRate(this.failRate);
                worker.setHangRate(this.hangRate);
            }
        }
    }
}
