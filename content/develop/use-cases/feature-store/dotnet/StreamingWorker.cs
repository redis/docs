namespace FeatureStoreDemo;

/// <summary>
/// Streaming feature updater for the demo.
/// </summary>
/// <remarks>
/// Stands in for whatever Flink, Kafka Streams, or bespoke service
/// computes the real-time features in a real deployment. In
/// production this code lives in the streaming layer; here it runs
/// as a background <see cref="Task"/> next to the demo server so the
/// UI can start, pause, and resume it.
///
/// <para>
/// Every tick the worker picks a few random users and writes a new
/// value for each streaming feature, with a per-field <c>HEXPIRE</c>
/// so the field self-expires if the worker is paused. Pause it for
/// longer than <c>StreamingTtlSeconds</c> and the streaming fields
/// drop out of the hash while the batch fields remain populated
/// under the longer key-level TTL — the <i>mixed staleness</i>
/// story made visible.
/// </para>
/// </remarks>
public sealed class StreamingWorker
{
    private static readonly string[] DeviceIds = {
        "ios-1a4c", "ios-9f02", "and-7b21", "and-2d18",
        "web-chr-1", "web-saf-1", "web-ff-2",
    };
    private static readonly string[] SessionCountries = {
        "US", "GB", "DE", "FR", "IN", "BR", "JP", "AU", "CA", "NL",
    };
    private static readonly int[] FailedLoginBuckets = { 0, 1, 2, 5 };
    private static readonly int[] FailedLoginWeights = { 70, 20, 8, 2 };

    private readonly FeatureStore _store;
    private readonly TimeSpan _tick;
    public int UsersPerTick { get; }
    private readonly Random _rng;
    private readonly object _rngLock = new();

    // All three lifecycle flags are read by the worker task and the
    // public API (HTTP handlers + Reset), so they have to be
    // volatile or Interlocked.
    private int _running;
    private int _paused;
    private int _tickInFlight;
    private long _tickCount;
    private long _writesCount;

    private CancellationTokenSource? _cts;
    private Task? _task;
    // Serializes start/stop so a Ctrl+C-triggered StopAsync can't
    // race with a /worker/toggle Start() (or vice versa). Without
    // this, the two could each be observing or replacing _cts/_task
    // while the other is mid-flight.
    private readonly SemaphoreSlim _lifecycleLock = new(1, 1);

    public StreamingWorker(FeatureStore store, TimeSpan tick, int usersPerTick, int seed)
    {
        _store = store;
        _tick = tick <= TimeSpan.Zero ? TimeSpan.FromSeconds(1) : tick;
        UsersPerTick = usersPerTick > 0 ? usersPerTick : 5;
        _rng = new Random(seed);
    }

    // ---------------------------------------------------------------
    // Lifecycle
    // ---------------------------------------------------------------

    public async Task StartAsync()
    {
        await _lifecycleLock.WaitAsync();
        try
        {
            if (Interlocked.CompareExchange(ref _running, 1, 0) != 0) return;
            Interlocked.Exchange(ref _paused, 0);
            _cts = new CancellationTokenSource();
            _task = Task.Run(() => RunAsync(_cts.Token));
        }
        finally { _lifecycleLock.Release(); }
    }

    public async Task StopAsync()
    {
        // Capture the task/CTS locally under the lifecycle lock so
        // a concurrent StartAsync can't clear them on us before we
        // get to await.
        Task? task;
        CancellationTokenSource? cts;
        await _lifecycleLock.WaitAsync();
        try
        {
            if (Interlocked.Exchange(ref _running, 0) != 1) return;
            task = _task;
            cts = _cts;
            _task = null;
            _cts = null;
        }
        finally { _lifecycleLock.Release(); }

        cts?.Cancel();
        try { if (task is not null) await task; }
        catch (OperationCanceledException) { /* expected */ }
        cts?.Dispose();
        Interlocked.Exchange(ref _tickInFlight, 0);
    }

    public void Pause() => Interlocked.Exchange(ref _paused, 1);
    public void Resume() => Interlocked.Exchange(ref _paused, 0);

    public bool IsRunning => Volatile.Read(ref _running) == 1;
    public bool IsPaused => Volatile.Read(ref _paused) == 1;

    /// <summary>
    /// Block until any in-flight tick has finished. <see cref="Pause"/>
    /// only stops <i>future</i> ticks from running; callers (a reset
    /// that's about to DEL every entity, for example) use this to
    /// flush a mid-flight tick before they touch state the tick
    /// might still be writing to.
    /// </summary>
    public async Task WaitForIdleAsync()
    {
        while (Volatile.Read(ref _tickInFlight) == 1)
        {
            await Task.Delay(20);
        }
    }

    public WorkerStats StatsSnapshot() => new(
        IsRunning,
        IsPaused,
        Interlocked.Read(ref _tickCount),
        Interlocked.Read(ref _writesCount));

    public void ResetStats()
    {
        Interlocked.Exchange(ref _tickCount, 0);
        Interlocked.Exchange(ref _writesCount, 0);
    }

    public record WorkerStats(bool Running, bool Paused, long TickCount, long WritesCount);

    // ---------------------------------------------------------------
    // Tick
    // ---------------------------------------------------------------

    private async Task RunAsync(CancellationToken ct)
    {
        try
        {
            while (!ct.IsCancellationRequested)
            {
                try { await Task.Delay(_tick, ct); }
                catch (OperationCanceledException) { break; }
                if (ct.IsCancellationRequested) break;

                // Set tick_in_flight *before* the pause check so a
                // concurrent pause+wait can never see
                // tick_in_flight=0 in the window between the pause
                // check and the actual DoTick call. The finally
                // block clears the flag whether we paused, succeeded,
                // or threw.
                Interlocked.Exchange(ref _tickInFlight, 1);
                try
                {
                    if (Volatile.Read(ref _paused) == 0)
                    {
                        await DoTickAsync();
                    }
                }
                catch (Exception e)
                {
                    Console.Error.WriteLine($"[streaming-worker] tick failed: {e.Message}");
                }
                finally
                {
                    Interlocked.Exchange(ref _tickInFlight, 0);
                }
            }
        }
        finally
        {
            // Clear running and tick_in_flight no matter how the
            // task exits so a later Start() can spin a fresh task.
            Interlocked.Exchange(ref _running, 0);
            Interlocked.Exchange(ref _tickInFlight, 0);
        }
    }

    private async Task DoTickAsync()
    {
        var ids = _store.ListEntityIds(500);
        if (ids.Count == 0) return;
        var picks = Sample(ids, UsersPerTick);
        var nowMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        long writes = 0;
        foreach (var id in picks)
        {
            var fields = new Dictionary<string, object>
            {
                ["last_login_ts"] = nowMs,
                ["last_device_id"] = Choice(DeviceIds),
                ["tx_count_5m"] = Intn(13),
                ["failed_logins_15m"] = WeightedInt(FailedLoginBuckets, FailedLoginWeights),
                ["session_country"] = Choice(SessionCountries),
            };
            await _store.UpdateStreamingAsync(id, fields, _store.StreamingTtlSeconds);
            writes += fields.Count;
        }
        Interlocked.Increment(ref _tickCount);
        Interlocked.Add(ref _writesCount, writes);
    }

    // ---------------------------------------------------------------
    // RNG helpers (locked so the worker stays deterministic across
    // concurrent toggles).
    // ---------------------------------------------------------------

    private List<string> Sample(List<string> items, int k)
    {
        lock (_rngLock)
        {
            var n = Math.Min(k, items.Count);
            var pool = new List<string>(items);
            var outList = new List<string>(n);
            for (int i = 0; i < n; i++)
            {
                int idx = _rng.Next(pool.Count);
                outList.Add(pool[idx]);
                pool.RemoveAt(idx);
            }
            return outList;
        }
    }

    private string Choice(string[] items)
    {
        lock (_rngLock) { return items[_rng.Next(items.Length)]; }
    }

    private int Intn(int n)
    {
        lock (_rngLock) { return _rng.Next(n); }
    }

    private int WeightedInt(int[] items, int[] weights)
    {
        lock (_rngLock)
        {
            int total = 0;
            foreach (var w in weights) total += w;
            int r = _rng.Next(total);
            for (int i = 0; i < items.Length; i++)
            {
                r -= weights[i];
                if (r < 0) return items[i];
            }
            return items[^1];
        }
    }
}
