using System.Globalization;
using System.Security.Cryptography;
using StackExchange.Redis;

namespace SessionStoreDemo;

public class RedisSessionStore
{
    private static readonly HashSet<string> ReservedSessionFields = new(StringComparer.Ordinal)
    {
        "created_at",
        "last_accessed_at",
        "session_ttl"
    };

    private readonly IDatabase _db;
    private readonly string _prefix;
    private readonly int _ttl;

    public RedisSessionStore(IDatabase db, string prefix = "session:", int ttl = 1800)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _prefix = string.IsNullOrWhiteSpace(prefix) ? "session:" : prefix;
        _ttl = NormalizeTtl(ttl);
    }

    public string CreateSession(IDictionary<string, string>? data = null, int? ttl = null)
    {
        var sessionId = CreateSessionId();
        var key = SessionKey(sessionId);
        var now = Timestamp();
        var sessionTtl = NormalizeTtl(ttl);

        var payload = new Dictionary<string, string>(StringComparer.Ordinal);
        if (data is not null)
        {
            foreach (var (field, value) in data)
            {
                if (!ReservedSessionFields.Contains(field))
                {
                    payload[field] = value;
                }
            }
        }

        payload["created_at"] = now;
        payload["last_accessed_at"] = now;
        payload["session_ttl"] = sessionTtl.ToString(CultureInfo.InvariantCulture);

        var batch = _db.CreateBatch();
        _ = batch.HashSetAsync(key, payload.Select(entry => new HashEntry(entry.Key, entry.Value)).ToArray());
        _ = batch.KeyExpireAsync(key, TimeSpan.FromSeconds(sessionTtl));
        batch.Execute();

        return sessionId;
    }

    public int? GetConfiguredTtl(string sessionId)
    {
        var storedTtl = _db.HashGet(SessionKey(sessionId), "session_ttl");
        if (storedTtl.IsNullOrEmpty)
        {
            return null;
        }

        return NormalizeTtl(int.Parse(storedTtl!, CultureInfo.InvariantCulture));
    }

    public Dictionary<string, string>? GetSession(string sessionId, bool refreshTtl = true)
    {
        var key = SessionKey(sessionId);
        var session = ReadSession(key);
        if (!IsValidSession(session))
        {
            return null;
        }

        if (!refreshTtl)
        {
            return session;
        }

        var sessionTtl = NormalizeTtl(int.Parse(session["session_ttl"], CultureInfo.InvariantCulture));
        var now = Timestamp();

        var batch = _db.CreateBatch();
        _ = batch.HashSetAsync(key, new[] { new HashEntry("last_accessed_at", now) });
        _ = batch.KeyExpireAsync(key, TimeSpan.FromSeconds(sessionTtl));
        var refreshedTask = batch.HashGetAllAsync(key);
        batch.Execute();

        var refreshed = ToDictionary(refreshedTask.GetAwaiter().GetResult());
        return IsValidSession(refreshed) ? refreshed : null;
    }

    public bool UpdateSession(string sessionId, IDictionary<string, string> data)
    {
        var key = SessionKey(sessionId);
        var session = ReadSession(key);
        if (!IsValidSession(session))
        {
            return false;
        }

        var payload = new Dictionary<string, string>(StringComparer.Ordinal);
        foreach (var (field, value) in data)
        {
            if (!ReservedSessionFields.Contains(field))
            {
                payload[field] = value;
            }
        }

        if (payload.Count == 0)
        {
            return true;
        }

        var sessionTtl = NormalizeTtl(int.Parse(session["session_ttl"], CultureInfo.InvariantCulture));
        payload["last_accessed_at"] = Timestamp();

        var batch = _db.CreateBatch();
        _ = batch.HashSetAsync(key, payload.Select(entry => new HashEntry(entry.Key, entry.Value)).ToArray());
        _ = batch.KeyExpireAsync(key, TimeSpan.FromSeconds(sessionTtl));
        batch.Execute();

        return true;
    }

    public long? IncrementField(string sessionId, string field, long amount = 1)
    {
        var key = SessionKey(sessionId);
        var session = ReadSession(key);
        if (!IsValidSession(session))
        {
            return null;
        }

        var sessionTtl = NormalizeTtl(int.Parse(session["session_ttl"], CultureInfo.InvariantCulture));

        var batch = _db.CreateBatch();
        var incrementTask = batch.HashIncrementAsync(key, field, amount);
        _ = batch.HashSetAsync(key, new[] { new HashEntry("last_accessed_at", Timestamp()) });
        _ = batch.KeyExpireAsync(key, TimeSpan.FromSeconds(sessionTtl));
        batch.Execute();

        return (long)incrementTask.GetAwaiter().GetResult();
    }

    public bool SetSessionTtl(string sessionId, int ttl)
    {
        var key = SessionKey(sessionId);
        var session = ReadSession(key);
        if (!IsValidSession(session))
        {
            return false;
        }

        var sessionTtl = NormalizeTtl(ttl);
        var batch = _db.CreateBatch();
        _ = batch.HashSetAsync(key, new[]
        {
            new HashEntry("session_ttl", sessionTtl.ToString(CultureInfo.InvariantCulture)),
            new HashEntry("last_accessed_at", Timestamp())
        });
        _ = batch.KeyExpireAsync(key, TimeSpan.FromSeconds(sessionTtl));
        batch.Execute();

        return true;
    }

    public bool DeleteSession(string sessionId)
    {
        return _db.KeyDelete(SessionKey(sessionId));
    }

    public long GetTtl(string sessionId)
    {
        var ttl = _db.KeyTimeToLive(SessionKey(sessionId));
        return ttl is null ? -1 : (long)Math.Floor(ttl.Value.TotalSeconds);
    }

    private int NormalizeTtl(int? ttl)
    {
        var value = ttl ?? _ttl;
        if (value < 1)
        {
            throw new ArgumentOutOfRangeException(nameof(ttl), "TTL must be at least 1 second");
        }

        return value;
    }

    private string SessionKey(string sessionId) => $"{_prefix}{sessionId}";

    private static string Timestamp() =>
        DateTimeOffset.UtcNow.ToString("yyyy-MM-dd'T'HH:mm:sszzz", CultureInfo.InvariantCulture);

    private static string CreateSessionId()
    {
        Span<byte> bytes = stackalloc byte[32];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }

    private Dictionary<string, string> ReadSession(RedisKey key)
    {
        return ToDictionary(_db.HashGetAll(key));
    }

    private static Dictionary<string, string> ToDictionary(HashEntry[] entries)
    {
        return entries.ToDictionary(
            entry => entry.Name.ToString(),
            entry => entry.Value.ToString(),
            StringComparer.Ordinal);
    }

    private static bool IsValidSession(Dictionary<string, string>? session)
    {
        if (session is null || session.Count == 0)
        {
            return false;
        }

        return ReservedSessionFields.All(session.ContainsKey);
    }
}
