using System.Security.Cryptography;
using StackExchange.Redis;

namespace CacheAsideDemo;

/// <summary>
/// Cache-aside helper backed by Redis hashes with TTL and Lua-backed
/// single-flight stampede protection.
/// </summary>
public class RedisCache
{
    private const string AcquireLockScript = @"
        if redis.call('SET', KEYS[1], ARGV[1], 'NX', 'PX', ARGV[2]) then
            return 1
        end
        return 0
    ";

    private const string ReleaseLockScript = @"
        if redis.call('GET', KEYS[1]) == ARGV[1] then
            return redis.call('DEL', KEYS[1])
        end
        return 0
    ";

    private readonly IDatabase _db;
    private readonly string _prefix;
    private readonly int _ttl;
    private readonly int _lockTtlMs;
    private readonly int _waitPollMs;

    private long _hits;
    private long _misses;
    private long _stampedesSuppressed;

    public RedisCache(IDatabase db, string prefix = "cache:product:", int ttl = 30,
                     int lockTtlMs = 2000, int waitPollMs = 25)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        if (ttl < 1) throw new ArgumentException("ttl must be at least 1 second", nameof(ttl));
        _prefix = string.IsNullOrEmpty(prefix) ? "cache:product:" : prefix;
        _ttl = ttl;
        _lockTtlMs = lockTtlMs;
        _waitPollMs = waitPollMs;
    }

    public int Ttl => _ttl;

    public sealed record Result(Dictionary<string, string>? Record, bool Hit, double RedisLatencyMs);

    /// <summary>Read through the cache, calling <paramref name="loader"/> on a miss.</summary>
    public Result Get(string entityId, Func<string, Dictionary<string, string>?> loader)
    {
        var cacheKey = CacheKey(entityId);
        var sw = System.Diagnostics.Stopwatch.StartNew();
        var entries = _db.HashGetAll(cacheKey);
        sw.Stop();
        var redisLatencyMs = sw.Elapsed.TotalMilliseconds;

        if (entries.Length > 0)
        {
            Interlocked.Increment(ref _hits);
            return new Result(ToDict(entries), Hit: true, redisLatencyMs);
        }

        Interlocked.Increment(ref _misses);
        var record = LoadWithSingleFlight(entityId, loader);
        return new Result(record, Hit: false, redisLatencyMs);
    }

    public bool Invalidate(string entityId)
    {
        return _db.KeyDelete(CacheKey(entityId));
    }

    /// <summary>
    /// Update a single field of a cached entity in place, refreshing the TTL.
    /// Only writes if the entry is already cached.
    /// </summary>
    public bool UpdateField(string entityId, string field, string value)
    {
        var cacheKey = CacheKey(entityId);
        while (true)
        {
            var tx = _db.CreateTransaction();
            tx.AddCondition(Condition.KeyExists(cacheKey));
            _ = tx.HashSetAsync(cacheKey, field, value);
            _ = tx.KeyExpireAsync(cacheKey, TimeSpan.FromSeconds(_ttl));
            if (tx.Execute())
            {
                return true;
            }
            // Condition failed (key absent) or transaction was discarded.
            if (!_db.KeyExists(cacheKey))
            {
                return false;
            }
            // Otherwise retry — the key still exists but the transaction
            // raced with another writer.
        }
    }

    public long TtlRemaining(string entityId)
    {
        var ttl = _db.KeyTimeToLive(CacheKey(entityId));
        return ttl is null ? -1 : (long) ttl.Value.TotalSeconds;
    }

    public Dictionary<string, object> Stats()
    {
        var hits = Interlocked.Read(ref _hits);
        var misses = Interlocked.Read(ref _misses);
        var stampedes = Interlocked.Read(ref _stampedesSuppressed);
        var total = hits + misses;
        var hitRatePct = total == 0 ? 0.0 : Math.Round(100.0 * hits / total, 1);
        return new Dictionary<string, object>
        {
            ["hits"] = hits,
            ["misses"] = misses,
            ["stampedes_suppressed"] = stampedes,
            ["hit_rate_pct"] = hitRatePct,
        };
    }

    public void ResetStats()
    {
        Interlocked.Exchange(ref _hits, 0);
        Interlocked.Exchange(ref _misses, 0);
        Interlocked.Exchange(ref _stampedesSuppressed, 0);
    }

    private Dictionary<string, string>? LoadWithSingleFlight(
        string entityId,
        Func<string, Dictionary<string, string>?> loader)
    {
        var cacheKey = CacheKey(entityId);
        var lockKey = LockKey(entityId);
        var token = RandomToken();

        var acquired = (long) _db.ScriptEvaluate(
            AcquireLockScript,
            new RedisKey[] { lockKey },
            new RedisValue[] { token, _lockTtlMs.ToString() });

        if (acquired == 1)
        {
            try
            {
                var record = loader(entityId);
                if (record is null) return null;
                var batch = _db.CreateBatch();
                _ = batch.KeyDeleteAsync(cacheKey);
                _ = batch.HashSetAsync(cacheKey,
                    record.Select(p => new HashEntry(p.Key, p.Value)).ToArray());
                _ = batch.KeyExpireAsync(cacheKey, TimeSpan.FromSeconds(_ttl));
                batch.Execute();
                return record;
            }
            finally
            {
                try
                {
                    _db.ScriptEvaluate(
                        ReleaseLockScript,
                        new RedisKey[] { lockKey },
                        new RedisValue[] { token });
                }
                catch
                {
                    // Lock will expire on its own.
                }
            }
        }

        Interlocked.Increment(ref _stampedesSuppressed);
        var deadline = Environment.TickCount + _lockTtlMs;
        while (Environment.TickCount < deadline)
        {
            Thread.Sleep(_waitPollMs);
            var entries = _db.HashGetAll(cacheKey);
            if (entries.Length > 0)
            {
                return ToDict(entries);
            }
        }
        return loader(entityId);
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

    private static string RandomToken()
    {
        Span<byte> buffer = stackalloc byte[8];
        RandomNumberGenerator.Fill(buffer);
        return Convert.ToHexString(buffer);
    }

    private string CacheKey(string id) => _prefix + id;
    private string LockKey(string id) => "lock:" + _prefix + id;
}
