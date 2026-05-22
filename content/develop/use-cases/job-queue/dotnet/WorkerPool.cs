namespace JobQueueDemo;

/// <summary>
/// A pool of named <see cref="JobWorker"/> threads that can be started and stopped.
/// </summary>
public class WorkerPool
{
    private readonly RedisJobQueue _queue;
    private readonly List<JobWorker> _workers = new();
    private readonly object _lock = new();

    public WorkerPool(
        RedisJobQueue queue,
        int size = 2,
        int workLatencyMs = 400,
        double failRate = 0.0,
        double hangRate = 0.0)
    {
        _queue = queue;
        WorkLatencyMs = workLatencyMs;
        FailRate = failRate;
        HangRate = hangRate;
        Resize(size);
    }

    public int WorkLatencyMs { get; private set; }
    public double FailRate { get; private set; }
    public double HangRate { get; private set; }

    public void Resize(int size)
    {
        lock (_lock)
        {
            while (_workers.Count < size)
            {
                var worker = new JobWorker(
                    name: $"worker-{_workers.Count + 1}",
                    queue: _queue,
                    workLatencyMs: WorkLatencyMs,
                    failRate: FailRate,
                    hangRate: HangRate);
                _workers.Add(worker);
            }
            while (_workers.Count > size)
            {
                var worker = _workers[^1];
                _workers.RemoveAt(_workers.Count - 1);
                worker.Stop();
                worker.Join(1000);
            }
        }
    }

    public void Start()
    {
        lock (_lock)
        {
            foreach (var worker in _workers)
            {
                worker.WorkLatencyMs = WorkLatencyMs;
                worker.FailRate = FailRate;
                worker.HangRate = HangRate;
                worker.Start();
            }
        }
    }

    public void Stop()
    {
        List<JobWorker> snapshot;
        lock (_lock)
        {
            foreach (var worker in _workers)
            {
                worker.Stop();
            }
            snapshot = _workers.ToList();
        }
        foreach (var worker in snapshot)
        {
            worker.Join(1000);
        }
    }

    public int Running
    {
        get
        {
            lock (_lock)
            {
                return _workers.Count(w => w.IsAlive);
            }
        }
    }

    public int TotalProcessed
    {
        get
        {
            lock (_lock)
            {
                return _workers.Sum(w => w.Processed);
            }
        }
    }

    public void ResetProcessed()
    {
        lock (_lock)
        {
            foreach (var worker in _workers)
            {
                worker.ResetProcessed();
            }
        }
    }

    public void Configure(int? workLatencyMs = null, double? failRate = null, double? hangRate = null)
    {
        lock (_lock)
        {
            if (workLatencyMs.HasValue)
            {
                WorkLatencyMs = Math.Max(0, workLatencyMs.Value);
            }
            if (failRate.HasValue)
            {
                FailRate = Math.Clamp(failRate.Value, 0.0, 1.0);
            }
            if (hangRate.HasValue)
            {
                HangRate = Math.Clamp(hangRate.Value, 0.0, 1.0);
            }
            foreach (var worker in _workers)
            {
                worker.WorkLatencyMs = WorkLatencyMs;
                worker.FailRate = FailRate;
                worker.HangRate = HangRate;
            }
        }
    }
}
