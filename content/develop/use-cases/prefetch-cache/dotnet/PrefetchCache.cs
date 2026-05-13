using StackExchange.Redis;

namespace PrefetchCacheDemo;

/// <summary>
/// Redis prefetch-cache helper.
///
/// Each cached entity is stored as a Redis hash under
/// <c>{prefix}{id}</c> with a long safety-net TTL that bounds memory if
/// the sync pipeline ever stops, but is not the freshness mechanism.
/// Freshness comes from the <see cref="ApplyChange"/> path, which the
/// sync worker calls every time a primary mutation arrives.
///
/// Reads run <c>HGETALL</c> against Redis only. A miss is not a
/// fall-back trigger — the application treats it as an error or a
/// deliberate <see cref="Invalidate"/> for testing. In production a
/// sustained miss rate means the prefetch or the sync pipeline is
/// broken, not that the primary should be re-queried on the request
/// path.
/// </summary>
public class PrefetchCache
{
    private readonly IDatabase _db;
    private readonly string _prefix;
    private readonly int _ttlSeconds;

    private readonly object _statsLock = new();
    private long _hits;
    private long _misses;
    private long _prefetched;
    private long _syncEventsApplied;
    private double _syncLagMsTotal;
    private long _syncLagSamples;

    public PrefetchCache(IDatabase db, string prefix = "cache:category:", int ttlSeconds = 3600)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        if (ttlSeconds < 1) throw new ArgumentException("ttlSeconds must be at least 1 second", nameof(ttlSeconds));
        _prefix = string.IsNullOrEmpty(prefix) ? "cache:category:" : prefix;
        _ttlSeconds = ttlSeconds;
    }

    public int TtlSeconds => _ttlSeconds;
    public string Prefix => _prefix;

    public sealed record ReadResult(Dictionary<string, string>? Record, bool Hit, double RedisLatencyMs);

    /// <summary>
    /// Pipeline <c>DEL</c> + <c>HSET</c> + <c>EXPIRE</c> for every record. Returns the count loaded.
    ///
    /// The batch is non-transactional: it is fast on startup (when
    /// nothing is reading the cache) and on the live <c>/reprefetch</c>
    /// path (when the demo pauses the sync worker around the call).
    /// Calling <c>BulkLoad</c> on a cache that is actively being read
    /// and written to can briefly expose a key that has been deleted
    /// but not yet rewritten; pause the writers first or use a
    /// transaction if that matters.
    /// </summary>
    public int BulkLoad(IEnumerable<Dictionary<string, string>> records)
    {
        var batch = _db.CreateBatch();
        var tasks = new List<Task>();
        var loaded = 0;
        foreach (var record in records)
        {
            if (!record.TryGetValue("id", out var entityId) || string.IsNullOrEmpty(entityId))
            {
                continue;
            }
            var cacheKey = CacheKey(entityId);
            tasks.Add(batch.KeyDeleteAsync(cacheKey));
            tasks.Add(batch.HashSetAsync(
                cacheKey,
                record.Select(p => new HashEntry(p.Key, p.Value)).ToArray()));
            tasks.Add(batch.KeyExpireAsync(cacheKey, TimeSpan.FromSeconds(_ttlSeconds)));
            loaded++;
        }
        if (loaded > 0)
        {
            batch.Execute();
            Task.WaitAll(tasks.ToArray());
        }
        lock (_statsLock)
        {
            _prefetched += loaded;
        }
        return loaded;
    }

    /// <summary>
    /// Return <c>(record, hit, redisLatencyMs)</c> for an <c>HGETALL</c> against Redis.
    ///
    /// Prefetch-cache reads do not fall back to the primary. A miss is
    /// a signal that the cache is incomplete, not a trigger to re-query
    /// the source. The caller decides how to surface it.
    /// </summary>
    public ReadResult Get(string entityId)
    {
        var cacheKey = CacheKey(entityId);
        var sw = System.Diagnostics.Stopwatch.StartNew();
        var entries = _db.HashGetAll(cacheKey);
        sw.Stop();
        var redisLatencyMs = sw.Elapsed.TotalMilliseconds;

        if (entries.Length > 0)
        {
            lock (_statsLock) { _hits++; }
            return new ReadResult(ToDict(entries), Hit: true, redisLatencyMs);
        }

        lock (_statsLock) { _misses++; }
        return new ReadResult(null, Hit: false, redisLatencyMs);
    }

    /// <summary>
    /// Apply a primary change event to Redis.
    ///
    /// The sync worker calls this for every event the primary emits.
    /// For an upsert, the helper rewrites the hash and refreshes the
    /// safety-net TTL inside a transaction. For a delete, it removes
    /// the cache key.
    /// </summary>
    public void ApplyChange(ChangeEvent change)
    {
        if (string.IsNullOrEmpty(change.Id)) return;
        var cacheKey = CacheKey(change.Id);

        if (change.Op == ChangeOp.Upsert)
        {
            if (change.Fields is null || change.Fields.Count == 0)
            {
                // Malformed upsert with no fields. Skip rather than
                // crash the sync worker: HSET with an empty array
                // throws, and there's nothing to write anyway. A real
                // CDC consumer would route this to a dead-letter queue
                // and alert; the demo just drops it.
                return;
            }
            // StackExchange.Redis transactions are optimistic (WATCH-
            // based) rather than full MULTI/EXEC, but the three commands
            // here have no conditions and can be queued and dispatched
            // atomically in one round trip via CreateTransaction.
            var tx = _db.CreateTransaction();
            _ = tx.KeyDeleteAsync(cacheKey);
            _ = tx.HashSetAsync(
                cacheKey,
                change.Fields.Select(p => new HashEntry(p.Key, p.Value)).ToArray());
            _ = tx.KeyExpireAsync(cacheKey, TimeSpan.FromSeconds(_ttlSeconds));
            tx.Execute();
        }
        else if (change.Op == ChangeOp.Delete)
        {
            _db.KeyDelete(cacheKey);
        }
        else
        {
            return;
        }

        lock (_statsLock)
        {
            _syncEventsApplied++;
            if (change.TimestampMs > 0.0)
            {
                var nowMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                var lagMs = Math.Max(0.0, nowMs - change.TimestampMs);
                _syncLagMsTotal += lagMs;
                _syncLagSamples++;
            }
        }
    }

    /// <summary>Delete one cache key. Demo-only: simulates a broken sync pipeline.</summary>
    public bool Invalidate(string entityId)
    {
        return _db.KeyDelete(CacheKey(entityId));
    }

    /// <summary>Delete every key under this cache's prefix and return the count.</summary>
    public int Clear()
    {
        var deleted = 0;
        var endpoints = _db.Multiplexer.GetEndPoints();
        var pattern = $"{_prefix}*";
        foreach (var endpoint in endpoints)
        {
            var server = _db.Multiplexer.GetServer(endpoint);
            if (!server.IsConnected || server.IsReplica) continue;
            var batch = new List<RedisKey>(500);
            foreach (var key in server.Keys(database: _db.Database, pattern: pattern, pageSize: 500))
            {
                batch.Add(key);
                if (batch.Count >= 500)
                {
                    deleted += (int) _db.KeyDelete(batch.ToArray());
                    batch.Clear();
                }
            }
            if (batch.Count > 0)
            {
                deleted += (int) _db.KeyDelete(batch.ToArray());
            }
        }
        return deleted;
    }

    /// <summary>Return every entity id currently in the cache.</summary>
    public List<string> Ids()
    {
        var ids = new List<string>();
        var endpoints = _db.Multiplexer.GetEndPoints();
        var pattern = $"{_prefix}*";
        foreach (var endpoint in endpoints)
        {
            var server = _db.Multiplexer.GetServer(endpoint);
            if (!server.IsConnected || server.IsReplica) continue;
            foreach (var key in server.Keys(database: _db.Database, pattern: pattern, pageSize: 500))
            {
                var s = (string) key!;
                ids.Add(s.StartsWith(_prefix, StringComparison.Ordinal) ? s.Substring(_prefix.Length) : s);
            }
        }
        ids.Sort(StringComparer.Ordinal);
        return ids;
    }

    public int Count() => Ids().Count;

    public long TtlRemaining(string entityId)
    {
        // Use Execute("TTL", ...) rather than KeyTimeToLive: the latter
        // returns `null` for BOTH a missing key and a key without a TTL,
        // collapsing the -2 and -1 sentinels. Execute returns the raw
        // integer so the demo UI can show the correct value in each case.
        return (long) _db.Execute("TTL", CacheKey(entityId));
    }

    public Dictionary<string, object> Stats()
    {
        lock (_statsLock)
        {
            var total = _hits + _misses;
            var hitRate = total == 0 ? 0.0 : Math.Round(100.0 * _hits / total, 1);
            var avgLag = _syncLagSamples == 0
                ? 0.0
                : Math.Round(_syncLagMsTotal / _syncLagSamples, 2);
            return new Dictionary<string, object>
            {
                ["hits"] = _hits,
                ["misses"] = _misses,
                ["hit_rate_pct"] = hitRate,
                ["prefetched"] = _prefetched,
                ["sync_events_applied"] = _syncEventsApplied,
                ["sync_lag_ms_avg"] = avgLag,
            };
        }
    }

    public void ResetStats()
    {
        lock (_statsLock)
        {
            _hits = 0;
            _misses = 0;
            _prefetched = 0;
            _syncEventsApplied = 0;
            _syncLagMsTotal = 0.0;
            _syncLagSamples = 0;
        }
    }

    private static Dictionary<string, string> ToDict(HashEntry[] entries)
    {
        var result = new Dictionary<string, string>(entries.Length, StringComparer.Ordinal);
        foreach (var entry in entries)
        {
            result[entry.Name!] = entry.Value!;
        }
        return result;
    }

    private string CacheKey(string id) => _prefix + id;
}

public enum ChangeOp
{
    Upsert,
    Delete,
}

/// <summary>
/// A single primary change event. <see cref="Fields"/> is null for
/// deletes and a fully-formed record for upserts. <see cref="TimestampMs"/>
/// is the unix epoch in milliseconds (with sub-millisecond precision).
/// </summary>
public sealed record ChangeEvent(ChangeOp Op, string Id, Dictionary<string, string>? Fields, double TimestampMs);
