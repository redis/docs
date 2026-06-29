import java.util.ArrayList;
import java.util.List;

/**
 * Pool of named {@link JobWorker} threads that can be started, stopped, and
 * resized at runtime.
 */
public class WorkerPool {

    private final RedisJobQueue queue;
    private volatile int workLatencyMs;
    private volatile double failRate;
    private volatile double hangRate;
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
        return workLatencyMs;
    }

    public double getFailRate() {
        return failRate;
    }

    public double getHangRate() {
        return hangRate;
    }

    public void resize(int size) {
        synchronized (lock) {
            while (workers.size() < size) {
                JobWorker w = new JobWorker(
                        "worker-" + (workers.size() + 1),
                        queue,
                        workLatencyMs,
                        failRate,
                        hangRate);
                workers.add(w);
            }
            while (workers.size() > size) {
                JobWorker w = workers.remove(workers.size() - 1);
                w.stop();
            }
        }
    }

    public void start() {
        synchronized (lock) {
            for (JobWorker w : workers) {
                w.setWorkLatencyMs(workLatencyMs);
                w.setFailRate(failRate);
                w.setHangRate(hangRate);
                w.start();
            }
        }
    }

    public void stop() {
        synchronized (lock) {
            for (JobWorker w : workers) {
                w.stop();
            }
        }
    }

    public int running() {
        synchronized (lock) {
            int count = 0;
            for (JobWorker w : workers) {
                if (w.isAlive()) count++;
            }
            return count;
        }
    }

    public int totalProcessed() {
        synchronized (lock) {
            int sum = 0;
            for (JobWorker w : workers) {
                sum += w.processed();
            }
            return sum;
        }
    }

    public void resetProcessed() {
        synchronized (lock) {
            for (JobWorker w : workers) {
                w.resetProcessed();
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
            for (JobWorker w : workers) {
                w.setWorkLatencyMs(this.workLatencyMs);
                w.setFailRate(this.failRate);
                w.setHangRate(this.hangRate);
            }
        }
    }
}
