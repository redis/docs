namespace PrefetchCacheDemo;

/// <summary>
/// Background sync worker for the prefetch-cache demo.
///
/// A long-running background <see cref="Thread"/> drains the primary's
/// change queue and applies each event to Redis through
/// <see cref="PrefetchCache.ApplyChange"/>. In a real system, the queue
/// is replaced by a CDC pipeline (Redis Data Integration, Debezium, or
/// an equivalent) that tails the primary's binlog/WAL and writes the
/// same shape of events.
///
/// The worker exposes <see cref="Pause"/> and <see cref="Resume"/> so
/// maintenance paths (<c>/reprefetch</c>, <see cref="PrefetchCache.Clear"/>)
/// can stop event application without tearing the thread down.
/// <see cref="Pause"/> blocks until the worker is parked, so the caller
/// knows no apply is in flight by the time it returns.
/// </summary>
public class SyncWorker
{
    private readonly MockPrimaryStore _primary;
    private readonly PrefetchCache _cache;
    private readonly TimeSpan _pollTimeout;
    private readonly ManualResetEventSlim _stopEvent = new(false);
    private readonly ManualResetEventSlim _pauseEvent = new(false);
    private readonly ManualResetEventSlim _pausedIdleEvent = new(false);
    private readonly object _threadLock = new();
    private Thread? _thread;

    public SyncWorker(MockPrimaryStore primary, PrefetchCache cache, TimeSpan? pollTimeout = null)
    {
        _primary = primary ?? throw new ArgumentNullException(nameof(primary));
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _pollTimeout = pollTimeout ?? TimeSpan.FromMilliseconds(50);
    }

    public void Start()
    {
        lock (_threadLock)
        {
            if (_thread is not null && _thread.IsAlive) return;
            _stopEvent.Reset();
            _pauseEvent.Reset();
            _pausedIdleEvent.Reset();
            _thread = new Thread(Run)
            {
                Name = "prefetch-cache-sync",
                IsBackground = true,
            };
            _thread.Start();
        }
    }

    /// <summary>
    /// Signal the worker to exit and join its thread.
    ///
    /// If the join times out the worker is wedged inside
    /// <see cref="PrefetchCache.ApplyChange"/>; we leave
    /// <c>_thread</c> populated so a subsequent <see cref="Start"/>
    /// does not spawn a second worker on top of the orphan.
    /// </summary>
    public void Stop(TimeSpan? joinTimeout = null)
    {
        var timeout = joinTimeout ?? TimeSpan.FromSeconds(2);
        _stopEvent.Set();
        Thread? toJoin;
        lock (_threadLock) { toJoin = _thread; }
        if (toJoin is null) return;
        if (toJoin.Join(timeout))
        {
            lock (_threadLock)
            {
                if (!toJoin.IsAlive) _thread = null;
            }
        }
    }

    /// <summary>
    /// Stop applying events and block until the worker is parked.
    ///
    /// Returns <c>true</c> once the worker has confirmed it is idle, or
    /// <c>false</c> if the timeout elapsed first. While paused, change
    /// events accumulate in the primary's queue and are applied in
    /// order after <see cref="Resume"/>.
    /// </summary>
    public bool Pause(TimeSpan? timeout = null)
    {
        var waitFor = timeout ?? TimeSpan.FromSeconds(2);
        _pausedIdleEvent.Reset();
        _pauseEvent.Set();
        Thread? current;
        lock (_threadLock) { current = _thread; }
        if (current is null || !current.IsAlive) return true;
        return _pausedIdleEvent.Wait(waitFor);
    }

    public void Resume()
    {
        _pauseEvent.Reset();
        _pausedIdleEvent.Reset();
    }

    private void Run()
    {
        while (!_stopEvent.IsSet)
        {
            if (_pauseEvent.IsSet)
            {
                _pausedIdleEvent.Set();
                // Park until the pause is lifted or the worker is stopped.
                while (_pauseEvent.IsSet && !_stopEvent.IsSet)
                {
                    _stopEvent.Wait(_pollTimeout);
                }
                _pausedIdleEvent.Reset();
                continue;
            }

            var change = _primary.NextChange(_pollTimeout);
            if (change is null) continue;
            try
            {
                _cache.ApplyChange(change);
            }
            catch (Exception ex)
            {
                // Demo behaviour: log and drop the event. A production
                // CDC consumer would retry with bounded backoff and
                // expose a dead-letter / error counter; see the guide's
                // "Production usage" section.
                Console.Error.WriteLine($"[sync] failed to apply {change}: {ex.Message}");
            }
        }
    }
}
