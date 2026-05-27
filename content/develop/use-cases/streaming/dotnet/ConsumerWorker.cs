namespace StreamingDemo;

/// <summary>
/// Lightweight in-memory record of one entry as the worker saw it.
/// </summary>
public sealed record ConsumerActivity(
    string Id,
    string Type,
    Dictionary<string, string> Fields,
    bool Acked,
    string Note);

/// <summary>
/// Summary returned by <see cref="ConsumerWorker.ReapIdlePel"/>.
/// </summary>
public sealed record ReapResult(
    int Claimed,
    IReadOnlyList<string> DeletedIds,
    int Processed);

/// <summary>
/// Background consumer thread for a single consumer in a consumer group.
///
/// Each worker owns a daemon thread that loops on XREADGROUP > on a short
/// poll interval and acks every entry it processes. Recovery of stuck PEL
/// entries (this consumer's, or anyone else's) happens through
/// <see cref="ReapIdlePel"/>, which is the textbook Streams pattern: each
/// consumer periodically (or on demand) calls XAUTOCLAIM with itself as
/// the target, then processes whatever it claimed. The demo's
/// "XAUTOCLAIM to selected" button is exactly that call.
///
/// Two demo-only levers are wired into the loop:
/// <list type="bullet">
///   <item><description><c>Pause</c> parks the worker (so its pending
///   entries age into the XAUTOCLAIM window without being consumed by
///   <c>&gt;</c> reads).</description></item>
///   <item><description><c>CrashNext(n)</c> tells the worker to drop its
///   next <c>n</c> deliveries on the floor without acking them — the same
///   effect as a worker process dying mid-message. Those entries stay in
///   the group's PEL until <see cref="ReapIdlePel"/> recovers
///   them.</description></item>
/// </list>
/// Real consumers do not need either lever; they only need
/// XREADGROUP → process → XACK in the run loop and a periodic
/// <see cref="ReapIdlePel"/> call to recover stuck entries.
/// </summary>
public sealed class ConsumerWorker
{
    private readonly EventStream _stream;
    private readonly int _processLatencyMs;
    private readonly int _recentCapacity;
    private readonly int _pollIntervalMs;

    private readonly object _lock = new();
    private readonly LinkedList<ConsumerActivity> _recent = new();
    private int _processed;
    private int _reaped;
    private int _crashedDrops;
    private int _crashNext;
    private bool _paused;

    private Thread? _thread;
    private volatile bool _stop;

    public ConsumerWorker(
        EventStream stream,
        string group,
        string name,
        int processLatencyMs = 25,
        int recentCapacity = 20,
        int pollIntervalMs = 100)
    {
        _stream = stream ?? throw new ArgumentNullException(nameof(stream));
        Group = group;
        Name = name;
        _processLatencyMs = processLatencyMs;
        _recentCapacity = recentCapacity;
        _pollIntervalMs = pollIntervalMs;
    }

    public string Group { get; }
    public string Name { get; }

    public bool IsAlive => _thread is { IsAlive: true };

    // ------------------------------------------------------------------
    // Lifecycle
    // ------------------------------------------------------------------

    public void Start()
    {
        lock (_lock)
        {
            if (_thread is { IsAlive: true })
            {
                return;
            }
            _stop = false;
            _thread = new Thread(Run)
            {
                IsBackground = true,
                Name = $"consumer-{Group}-{Name}",
            };
            _thread.Start();
        }
    }

    public void Stop(int timeoutMs = 1000)
    {
        _stop = true;
        var t = _thread;
        if (t is not null && t.IsAlive)
        {
            t.Join(timeoutMs);
        }
    }

    // ------------------------------------------------------------------
    // Demo levers
    // ------------------------------------------------------------------

    public void Pause()
    {
        lock (_lock)
        {
            _paused = true;
        }
    }

    public void Resume()
    {
        lock (_lock)
        {
            _paused = false;
        }
    }

    /// <summary>
    /// Drop the next <paramref name="count"/> deliveries without acking
    /// them. The entries stay in the group's PEL with their delivery
    /// counter incremented, so XAUTOCLAIM can recover them once they
    /// exceed the idle threshold.
    /// </summary>
    public void CrashNext(int count)
    {
        lock (_lock)
        {
            _crashNext += Math.Max(0, count);
        }
    }

    // ------------------------------------------------------------------
    // Introspection
    // ------------------------------------------------------------------

    public List<ConsumerActivity> Recent()
    {
        lock (_lock)
        {
            return _recent.ToList();
        }
    }

    public Dictionary<string, object?> Status()
    {
        lock (_lock)
        {
            return new Dictionary<string, object?>
            {
                ["name"] = Name,
                ["group"] = Group,
                ["processed"] = _processed,
                ["reaped"] = _reaped,
                ["crashed_drops"] = _crashedDrops,
                ["paused"] = _paused,
                ["crash_queued"] = _crashNext,
                ["alive"] = IsAlive,
            };
        }
    }

    // ------------------------------------------------------------------
    // Recovery
    // ------------------------------------------------------------------

    /// <summary>
    /// Run XAUTOCLAIM into self and process the claimed entries.
    /// Returns a summary with <c>Claimed</c>, <c>DeletedIds</c>, and
    /// <c>Processed</c> counts. Safe to call from any thread — the
    /// heavy lifting is <see cref="EventStream.Autoclaim"/> (a Redis
    /// call) and the sequential per-entry dispatch via
    /// <see cref="HandleEntry"/>.
    ///
    /// <c>DeletedIds</c> are PEL entries whose stream payload was
    /// already trimmed by MAXLEN ~ / XTRIM before the sweep ran.
    /// Redis 7+ removes them from the PEL inside XAUTOCLAIM itself,
    /// so the caller does not have to XACK them; they are reported so
    /// the caller can route them to a dead-letter store.
    /// </summary>
    public ReapResult ReapIdlePel()
    {
        var swept = _stream.Autoclaim(Group, Name, pageCount: 100, maxPages: 10);
        var processed = 0;
        foreach (var record in swept.Claimed)
        {
            try
            {
                HandleEntry(record.Id, record.Fields);
                processed++;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[{Group}/{Name}] reap failed on {record.Id}: {ex.Message}");
            }
        }
        lock (_lock)
        {
            _reaped += processed;
        }
        return new ReapResult(swept.Claimed.Count, swept.DeletedIds, processed);
    }

    // ------------------------------------------------------------------
    // Main loop
    // ------------------------------------------------------------------

    private void Run()
    {
        while (!_stop)
        {
            bool paused;
            lock (_lock)
            {
                paused = _paused;
            }
            if (paused)
            {
                Thread.Sleep(50);
                continue;
            }

            List<StreamRecord> entries;
            try
            {
                entries = _stream.Consume(Group, Name, count: 10);
            }
            catch (Exception ex)
            {
                // Don't kill the thread on a transient Redis error; a
                // real consumer would log this and back off.
                Console.Error.WriteLine($"[{Group}/{Name}] read failed: {ex.Message}");
                Thread.Sleep(500);
                continue;
            }

            if (entries.Count == 0)
            {
                // StackExchange.Redis' XREADGROUP wrapper is non-blocking,
                // so we poll on a short interval. A blocking BLOCK option
                // would otherwise monopolise the multiplexer's pipeline.
                Thread.Sleep(_pollIntervalMs);
                continue;
            }

            foreach (var entry in entries)
            {
                Dispatch(entry.Id, entry.Fields);
            }
        }
    }

    private void Dispatch(string entryId, Dictionary<string, string> fields)
    {
        if (_processLatencyMs > 0)
        {
            Thread.Sleep(_processLatencyMs);
        }
        try
        {
            HandleEntry(entryId, fields);
        }
        catch (Exception ex)
        {
            // A failure here (typically XACK against Redis) must not
            // kill the daemon thread — that would silently halt this
            // consumer while every other entry sat in its PEL waiting
            // for XAUTOCLAIM. The entry stays unacked; the next
            // ReapIdlePel call (here or on any consumer in the group)
            // can recover it once it exceeds the idle threshold.
            Console.Error.WriteLine($"[{Group}/{Name}] failed to handle {entryId}: {ex.Message}");
            lock (_lock)
            {
                Push(new ConsumerActivity(
                    entryId,
                    fields.TryGetValue("type", out var type) ? type : "",
                    fields,
                    Acked: false,
                    Note: $"handler error: {ex.Message}"));
            }
        }
    }

    private void HandleEntry(string entryId, Dictionary<string, string> fields)
    {
        bool drop;
        lock (_lock)
        {
            drop = _crashNext > 0;
            if (drop)
            {
                _crashNext--;
            }
        }

        if (drop)
        {
            lock (_lock)
            {
                _crashedDrops++;
                Push(new ConsumerActivity(
                    entryId,
                    fields.TryGetValue("type", out var type) ? type : "",
                    fields,
                    Acked: false,
                    Note: "dropped (simulated crash)"));
            }
            return;
        }

        _stream.Ack(Group, new[] { entryId });
        lock (_lock)
        {
            _processed++;
            Push(new ConsumerActivity(
                entryId,
                fields.TryGetValue("type", out var type) ? type : "",
                fields,
                Acked: true,
                Note: ""));
        }
    }

    private void Push(ConsumerActivity activity)
    {
        _recent.AddFirst(activity);
        while (_recent.Count > _recentCapacity)
        {
            _recent.RemoveLast();
        }
    }
}
