namespace CacheAsideDemo;

/// <summary>
/// In-memory stand-in for a slow primary database. Each read sleeps for
/// <c>ReadLatencyMs</c> milliseconds so the difference between a cache hit
/// and a miss is visible in the demo UI.
/// </summary>
public class MockPrimaryStore
{
    public int ReadLatencyMs { get; }

    private long _reads;
    private readonly object _lock = new();
    private readonly Dictionary<string, Dictionary<string, string>> _records;

    public MockPrimaryStore(int readLatencyMs = 150)
    {
        ReadLatencyMs = readLatencyMs;
        _records = new Dictionary<string, Dictionary<string, string>>(StringComparer.Ordinal)
        {
            ["p-001"] = new() { ["id"] = "p-001", ["name"] = "Sourdough Loaf",      ["price_cents"] = "650",  ["stock"] = "42"  },
            ["p-002"] = new() { ["id"] = "p-002", ["name"] = "Espresso Beans 250g", ["price_cents"] = "1495", ["stock"] = "120" },
            ["p-003"] = new() { ["id"] = "p-003", ["name"] = "Olive Oil 500ml",     ["price_cents"] = "1200", ["stock"] = "8"   },
            ["p-004"] = new() { ["id"] = "p-004", ["name"] = "Sea Salt Flakes",     ["price_cents"] = "475",  ["stock"] = "60"  },
        };
    }

    public List<string> ListIds()
    {
        var ids = _records.Keys.ToList();
        ids.Sort(StringComparer.Ordinal);
        return ids;
    }

    /// <summary>Slow read of a record. Returns null if id is unknown.</summary>
    public Dictionary<string, string>? Read(string id)
    {
        Thread.Sleep(ReadLatencyMs);
        Interlocked.Increment(ref _reads);
        lock (_lock)
        {
            return _records.TryGetValue(id, out var record)
                ? new Dictionary<string, string>(record, StringComparer.Ordinal)
                : null;
        }
    }

    public bool UpdateField(string id, string field, string value)
    {
        lock (_lock)
        {
            if (!_records.TryGetValue(id, out var record))
            {
                return false;
            }
            record[field] = value;
            return true;
        }
    }

    public long Reads => Interlocked.Read(ref _reads);

    public void ResetReads() => Interlocked.Exchange(ref _reads, 0);
}
