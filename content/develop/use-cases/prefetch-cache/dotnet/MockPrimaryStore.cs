using System.Collections.Concurrent;

namespace PrefetchCacheDemo;

/// <summary>
/// Mock primary data store for the prefetch-cache demo.
///
/// This stands in for a source-of-truth database (Postgres, MySQL,
/// Mongo, etc.) that holds reference data the application serves to
/// users.
///
/// Every mutation appends a change event to an in-process queue, which
/// the sync worker drains and applies to Redis. In a real system the
/// queue is replaced by a CDC pipeline — Redis Data Integration,
/// Debezium plus a lightweight consumer, or an equivalent tool that
/// tails the source's binlog/WAL and pushes changes into Redis.
///
/// The store also exposes <see cref="ReadLatencyMs"/> so the demo can
/// illustrate how much slower a direct primary read would be than a
/// Redis hit.
/// </summary>
public class MockPrimaryStore
{
    public int ReadLatencyMs { get; }

    private readonly object _lock = new();
    private long _reads;
    private readonly Dictionary<string, Dictionary<string, string>> _records;
    private readonly BlockingCollection<ChangeEvent> _changes = new(new ConcurrentQueue<ChangeEvent>());

    public MockPrimaryStore(int readLatencyMs = 80)
    {
        ReadLatencyMs = readLatencyMs;
        _records = new Dictionary<string, Dictionary<string, string>>(StringComparer.Ordinal)
        {
            ["cat-001"] = new()
            {
                ["id"] = "cat-001",
                ["name"] = "Beverages",
                ["display_order"] = "1",
                ["featured"] = "true",
                ["parent_id"] = "",
            },
            ["cat-002"] = new()
            {
                ["id"] = "cat-002",
                ["name"] = "Bakery",
                ["display_order"] = "2",
                ["featured"] = "true",
                ["parent_id"] = "",
            },
            ["cat-003"] = new()
            {
                ["id"] = "cat-003",
                ["name"] = "Pantry Staples",
                ["display_order"] = "3",
                ["featured"] = "false",
                ["parent_id"] = "",
            },
            ["cat-004"] = new()
            {
                ["id"] = "cat-004",
                ["name"] = "Frozen",
                ["display_order"] = "4",
                ["featured"] = "false",
                ["parent_id"] = "",
            },
            ["cat-005"] = new()
            {
                ["id"] = "cat-005",
                ["name"] = "Specialty Cheeses",
                ["display_order"] = "5",
                ["featured"] = "false",
                ["parent_id"] = "cat-002",
            },
        };
    }

    public List<string> ListIds()
    {
        lock (_lock)
        {
            var ids = _records.Keys.ToList();
            ids.Sort(StringComparer.Ordinal);
            return ids;
        }
    }

    /// <summary>Return every record. Used by the cache's bulk-load path on startup.</summary>
    public List<Dictionary<string, string>> ListRecords()
    {
        Thread.Sleep(ReadLatencyMs);
        lock (_lock)
        {
            Interlocked.Increment(ref _reads);
            return _records.Values
                .Select(r => new Dictionary<string, string>(r, StringComparer.Ordinal))
                .ToList();
        }
    }

    /// <summary>Single-record read. Not on the demo's normal read path.</summary>
    public Dictionary<string, string>? Read(string entityId)
    {
        Thread.Sleep(ReadLatencyMs);
        lock (_lock)
        {
            Interlocked.Increment(ref _reads);
            return _records.TryGetValue(entityId, out var record)
                ? new Dictionary<string, string>(record, StringComparer.Ordinal)
                : null;
        }
    }

    public bool AddRecord(Dictionary<string, string> record)
    {
        if (!record.TryGetValue("id", out var entityId) || string.IsNullOrEmpty(entityId?.Trim()))
        {
            return false;
        }
        entityId = entityId.Trim();
        lock (_lock)
        {
            if (_records.ContainsKey(entityId))
            {
                return false;
            }
            _records[entityId] = new Dictionary<string, string>(record, StringComparer.Ordinal);
            // Emit while the lock is held so the queue order matches the
            // mutation order. Two concurrent callers cannot interleave
            // mutation A -> mutation B -> emit B -> emit A.
            EmitChangeLocked(ChangeOp.Upsert, entityId, new Dictionary<string, string>(record, StringComparer.Ordinal));
        }
        return true;
    }

    public bool UpdateField(string entityId, string field, string value)
    {
        lock (_lock)
        {
            if (!_records.TryGetValue(entityId, out var record))
            {
                return false;
            }
            record[field] = value;
            EmitChangeLocked(
                ChangeOp.Upsert,
                entityId,
                new Dictionary<string, string>(record, StringComparer.Ordinal));
        }
        return true;
    }

    public bool DeleteRecord(string entityId)
    {
        lock (_lock)
        {
            if (!_records.Remove(entityId))
            {
                return false;
            }
            EmitChangeLocked(ChangeOp.Delete, entityId, null);
        }
        return true;
    }

    /// <summary>Block up to <paramref name="timeout"/> for the next change event.</summary>
    public ChangeEvent? NextChange(TimeSpan timeout)
    {
        if (_changes.TryTake(out var change, timeout))
        {
            return change;
        }
        return null;
    }

    public long Reads => Interlocked.Read(ref _reads);

    public void ResetReads() => Interlocked.Exchange(ref _reads, 0);

    /// <summary>
    /// Append a change event to the feed. Caller must hold <c>_lock</c>.
    ///
    /// <see cref="BlockingCollection{T}.Add(T)"/> is itself thread-safe
    /// and never tries to acquire <c>_lock</c>, so calling it while
    /// holding the records lock cannot deadlock. Holding the lock here
    /// is what guarantees that the queue order matches the order in
    /// which the records dict was mutated.
    /// </summary>
    private void EmitChangeLocked(ChangeOp op, string entityId, Dictionary<string, string>? fields)
    {
        // Use millisecond-precision unix timestamp so the sync-lag
        // metric is in the same shape as the Python reference.
        var timestampMs = (double) DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        _changes.Add(new ChangeEvent(op, entityId, fields, timestampMs));
    }
}
