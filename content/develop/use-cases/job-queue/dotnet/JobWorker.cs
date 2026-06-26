namespace JobQueueDemo;

/// <summary>
/// A single background worker thread that drains a Redis job queue.
/// </summary>
public class JobWorker
{
    private readonly RedisJobQueue _queue;
    private readonly object _lock = new();
    private Thread? _thread;
    private volatile bool _stop;
    private int _processed;

    public JobWorker(
        string name,
        RedisJobQueue queue,
        int workLatencyMs = 400,
        double failRate = 0.0,
        double hangRate = 0.0)
    {
        Name = name;
        _queue = queue;
        WorkLatencyMs = workLatencyMs;
        FailRate = failRate;
        HangRate = hangRate;
    }

    public string Name { get; }
    public int WorkLatencyMs { get; set; }
    public double FailRate { get; set; }
    public double HangRate { get; set; }

    public bool IsAlive => _thread is { IsAlive: true };

    /// <summary>
    /// Block briefly for the worker thread to exit after a Stop().
    /// </summary>
    public void Join(int timeoutMs)
    {
        var t = _thread;
        if (t is not null && t.IsAlive)
        {
            t.Join(timeoutMs);
        }
    }

    public int Processed
    {
        get
        {
            lock (_lock)
            {
                return _processed;
            }
        }
    }

    public void ResetProcessed()
    {
        lock (_lock)
        {
            _processed = 0;
        }
    }

    public void Start()
    {
        lock (_lock)
        {
            if (_thread is { IsAlive: true })
            {
                if (!_stop)
                {
                    return;
                }
                _thread.Join(TimeSpan.FromSeconds(2));
            }
            _stop = false;
            _thread = new Thread(Run)
            {
                IsBackground = true,
                Name = Name,
            };
            _thread.Start();
        }
    }

    public void Stop()
    {
        _stop = true;
    }

    private void Run()
    {
        while (!_stop)
        {
            ClaimedJob? job;
            try
            {
                job = _queue.Claim(timeoutMs: 500);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[{Name}] claim error: {ex.Message}");
                Thread.Sleep(200);
                continue;
            }
            if (job is null)
            {
                continue;
            }
            try
            {
                Process(job);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[{Name}] process error: {ex.Message}");
                try
                {
                    _queue.Fail(job, $"{Name} unexpected error: {ex.Message}");
                }
                catch
                {
                    // best-effort
                }
            }
        }
    }

    private void Process(ClaimedJob job)
    {
        var outcome = PickOutcome();
        Thread.Sleep(WorkLatencyMs);

        if (outcome == "hang")
        {
            // Simulate a worker that crashed mid-job: don't complete, don't
            // fail. The reclaimer will move this job back to pending once
            // the visibility timeout elapses.
            return;
        }

        if (outcome == "fail")
        {
            _queue.Fail(job, $"{Name} simulated failure");
            return;
        }

        lock (_lock)
        {
            _processed++;
        }
        var result = new Dictionary<string, object>
        {
            ["worker"] = Name,
            ["echo"] = job.Payload,
            ["attempts"] = job.Attempts,
        };
        _queue.Complete(job, result);
    }

    private string PickOutcome()
    {
        var roll = Random.Shared.NextDouble();
        if (roll < HangRate)
        {
            return "hang";
        }
        if (roll < HangRate + FailRate)
        {
            return "fail";
        }
        return "ok";
    }
}
