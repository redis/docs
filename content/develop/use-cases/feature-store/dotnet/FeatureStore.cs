using System.Collections.Concurrent;
using StackExchange.Redis;

namespace FeatureStoreDemo;

/// <summary>
/// Redis online feature store backed by per-entity Hashes
/// (StackExchange.Redis).
/// </summary>
/// <remarks>
/// Each entity (here, a user) lives at a deterministic key such as
/// <c>fs:user:{id}</c>. The hash holds every feature for that entity
/// as one field per feature — batch-materialized aggregates
/// (refreshed on a daily cycle) alongside streaming-updated signals
/// (refreshed every few seconds). One <c>HMGET</c> returns whichever
/// subset the model needs in one network round trip.
///
/// Two TTL layers solve the <i>mixed staleness</i> problem:
///
/// <list type="bullet">
///   <item>A key-level <c>EXPIRE</c> aligned with the batch
///   materialization cycle.</item>
///   <item>A per-field <c>HEXPIRE</c> on each streaming field gives
///   that field its own shorter expiry, independent of the rest of
///   the hash.</item>
/// </list>
///
/// <c>HEXPIRE</c> and <c>HTTL</c> require Redis 7.4 or later.
/// StackExchange.Redis 2.8+ exposes them as
/// <see cref="IDatabase.HashFieldExpireAsync"/> and
/// <see cref="IDatabase.HashFieldGetTimeToLiveAsync"/>. The demo pins
/// 2.13.17.
///
/// The shared <c>ConnectionMultiplexer</c> is thread-safe and
/// multiplexed — one instance serves the whole process, and every
/// handler in the ASP.NET Core thread pool plus the streaming
/// worker call into it without coordination.
/// </remarks>
public sealed class FeatureStore
{
    public static readonly IReadOnlyList<string> DefaultBatchFields = new[]
    {
        "country_iso",
        "risk_segment",
        "account_age_days",
        "tx_count_7d",
        "avg_amount_30d",
        "chargeback_count_180d",
    };

    public static readonly IReadOnlyList<string> DefaultStreamingFields = new[]
    {
        "last_login_ts",
        "last_device_id",
        "tx_count_5m",
        "failed_logins_15m",
        "session_country",
    };

    public const long DefaultBatchTtlSeconds = 24L * 60L * 60L;
    public const long DefaultStreamingTtlSeconds = 5L * 60L;
    public const string DefaultKeyPrefix = "fs:user:";

    private readonly IConnectionMultiplexer _mux;
    private readonly IDatabase _db;
    public string KeyPrefix { get; }
    public long BatchTtlSeconds { get; }
    public long StreamingTtlSeconds { get; }

    private long _batchWritesTotal;
    private long _streamingWritesTotal;
    private long _readsTotal;
    private long _readFieldsTotal;

    public FeatureStore(
        IConnectionMultiplexer mux,
        string keyPrefix = DefaultKeyPrefix,
        long batchTtlSeconds = DefaultBatchTtlSeconds,
        long streamingTtlSeconds = DefaultStreamingTtlSeconds)
    {
        _mux = mux;
        _db = mux.GetDatabase();
        KeyPrefix = keyPrefix;
        BatchTtlSeconds = batchTtlSeconds;
        StreamingTtlSeconds = streamingTtlSeconds;
    }

    public string KeyFor(string entityId) => KeyPrefix + entityId;

    // ---------------------------------------------------------------
    // Batch ingestion (materialization)
    // ---------------------------------------------------------------

    /// <summary>
    /// Materialize a batch of entities into Redis.
    /// </summary>
    /// <remarks>
    /// One <c>HSET</c> plus one <c>EXPIRE</c> per entity, all queued
    /// through an <c>IBatch</c> so the whole batch ships in a single
    /// network round trip.
    /// </remarks>
    public async Task<int> BulkLoadAsync(
        IReadOnlyDictionary<string, IReadOnlyDictionary<string, object>> rows,
        long ttlSeconds)
    {
        if (rows.Count == 0) return 0;
        var batch = _db.CreateBatch();
        var tasks = new List<Task>(rows.Count * 2);
        foreach (var (entityId, fields) in rows)
        {
            var key = (RedisKey)KeyFor(entityId);
            var entries = new HashEntry[fields.Count];
            int i = 0;
            foreach (var (name, value) in fields)
            {
                entries[i++] = new HashEntry(name, EncodeValue(value));
            }
            tasks.Add(batch.HashSetAsync(key, entries));
            tasks.Add(batch.KeyExpireAsync(key, TimeSpan.FromSeconds(ttlSeconds)));
        }
        batch.Execute();
        await Task.WhenAll(tasks);
        Interlocked.Add(ref _batchWritesTotal, rows.Count);
        return rows.Count;
    }

    // ---------------------------------------------------------------
    // Streaming ingestion
    // ---------------------------------------------------------------

    /// <summary>
    /// Write streaming features with a per-field TTL.
    /// </summary>
    /// <remarks>
    /// <c>HSET</c> and <c>HEXPIRE</c> are queued in the same
    /// <c>IBatch</c> so Redis runs them in pipeline order: the
    /// <c>HSET</c> first creates or overwrites the fields, then
    /// <c>HEXPIRE</c> attaches a TTL to each of those same fields.
    ///
    /// <para>
    /// <see cref="IDatabase.HashFieldExpireAsync"/> returns one
    /// <see cref="ExpireResult"/> per field:
    /// <list type="bullet">
    ///   <item><c>Success</c> (= Redis code 1): TTL set / updated.</item>
    ///   <item><c>Due</c> (= 2): the expiry was 0 or in the past, so
    ///   Redis deleted the field instead of applying a TTL.</item>
    ///   <item><c>ConditionNotMet</c> (= 0): NX/XX/GT/LT condition
    ///   not met (we never use one here).</item>
    ///   <item><c>NoSuchField</c> (= -2): no such field, or no such key.</item>
    /// </list>
    /// We always follow <c>HSET</c> with <c>HEXPIRE</c> so any code
    /// other than <c>Success</c> means the per-field TTL invariant
    /// didn't hold — the helper throws rather than silently leaving a
    /// streaming field with no expiry attached.
    /// </para>
    /// </remarks>
    public async Task UpdateStreamingAsync(
        string entityId,
        IReadOnlyDictionary<string, object> fields,
        long ttlSeconds)
    {
        if (fields.Count == 0) return;
        var key = (RedisKey)KeyFor(entityId);
        var entries = new HashEntry[fields.Count];
        var names = new RedisValue[fields.Count];
        int i = 0;
        foreach (var (name, value) in fields)
        {
            entries[i] = new HashEntry(name, EncodeValue(value));
            names[i] = name;
            i++;
        }

        var batch = _db.CreateBatch();
        var hsetTask = batch.HashSetAsync(key, entries);
        var hexpireTask = batch.HashFieldExpireAsync(
            key, names, TimeSpan.FromSeconds(ttlSeconds));
        batch.Execute();
        await hsetTask;
        var codes = await hexpireTask;
        foreach (var code in codes)
        {
            if (code != ExpireResult.Success)
            {
                throw new InvalidOperationException(
                    $"HEXPIRE did not set every field TTL for {key}: [{string.Join(",", codes)}]");
            }
        }
        Interlocked.Add(ref _streamingWritesTotal, fields.Count);
    }

    // ---------------------------------------------------------------
    // Inference reads
    // ---------------------------------------------------------------

    /// <summary>
    /// Retrieve a subset of features for one entity with <c>HMGET</c>.
    /// Returns only the fields that actually exist on the hash;
    /// missing fields are dropped from the result.
    /// </summary>
    public async Task<Dictionary<string, string>> GetFeaturesAsync(
        string entityId, IReadOnlyList<string> fieldNames)
    {
        var key = (RedisKey)KeyFor(entityId);
        var out_ = new Dictionary<string, string>();
        if (fieldNames.Count == 0) return out_;
        var values = await _db.HashGetAsync(
            key, fieldNames.Select(f => (RedisValue)f).ToArray());
        for (int i = 0; i < fieldNames.Count; i++)
        {
            if (!values[i].IsNull)
            {
                out_[fieldNames[i]] = values[i].ToString();
            }
        }
        Interlocked.Increment(ref _readsTotal);
        Interlocked.Add(ref _readFieldsTotal, out_.Count);
        return out_;
    }

    /// <summary>
    /// Full-hash read via <c>HGETALL</c>. Useful for debugging but
    /// the model server should always go through
    /// <see cref="GetFeaturesAsync"/> with an explicit field list.
    /// </summary>
    public async Task<Dictionary<string, string>> GetAllFeaturesAsync(string entityId)
    {
        var entries = await _db.HashGetAllAsync(KeyFor(entityId));
        var dict = new Dictionary<string, string>(entries.Length);
        foreach (var e in entries)
        {
            dict[e.Name.ToString()] = e.Value.ToString();
        }
        Interlocked.Increment(ref _readsTotal);
        Interlocked.Add(ref _readFieldsTotal, entries.Length);
        return dict;
    }

    /// <summary>
    /// Pipeline <c>HMGET</c> across many entities for batch scoring.
    /// One round trip for the whole batch via <c>IBatch</c>.
    /// </summary>
    public async Task<Dictionary<string, Dictionary<string, string>>> BatchGetFeaturesAsync(
        IReadOnlyList<string> entityIds, IReadOnlyList<string> fieldNames)
    {
        if (entityIds.Count == 0 || fieldNames.Count == 0)
            return new Dictionary<string, Dictionary<string, string>>();

        var fieldValues = fieldNames.Select(f => (RedisValue)f).ToArray();
        var batch = _db.CreateBatch();
        var tasks = new Task<RedisValue[]>[entityIds.Count];
        for (int i = 0; i < entityIds.Count; i++)
        {
            tasks[i] = batch.HashGetAsync(KeyFor(entityIds[i]), fieldValues);
        }
        batch.Execute();
        var rows = await Task.WhenAll(tasks);

        var out_ = new Dictionary<string, Dictionary<string, string>>();
        long seen = 0;
        for (int i = 0; i < entityIds.Count; i++)
        {
            var row = new Dictionary<string, string>();
            for (int j = 0; j < fieldNames.Count; j++)
            {
                if (!rows[i][j].IsNull)
                {
                    row[fieldNames[j]] = rows[i][j].ToString();
                    seen++;
                }
            }
            out_[entityIds[i]] = row;
        }
        Interlocked.Add(ref _readsTotal, entityIds.Count);
        Interlocked.Add(ref _readFieldsTotal, seen);
        return out_;
    }

    // ---------------------------------------------------------------
    // TTL inspection (used by the demo UI)
    // ---------------------------------------------------------------

    /// <summary>
    /// Seconds until the entity key expires. Returns -1 if no TTL is
    /// set, -2 if the key doesn't exist.
    /// </summary>
    public async Task<long> KeyTtlSecondsAsync(string entityId)
    {
        var ttl = await _db.KeyTimeToLiveAsync(KeyFor(entityId));
        if (ttl == null)
        {
            // StackExchange.Redis returns null both for "no TTL" and
            // for "key doesn't exist". Disambiguate with KeyExists.
            return await _db.KeyExistsAsync(KeyFor(entityId)) ? -1L : -2L;
        }
        return (long)ttl.Value.TotalSeconds;
    }

    /// <summary>
    /// Per-field TTL helper (Redis 7.4+). Returns whole seconds for
    /// parity with the other clients: positive seconds remaining,
    /// -1 no field TTL, -2 field (or key) missing.
    /// </summary>
    /// <remarks>
    /// <c>HashFieldGetTimeToLiveAsync</c> wraps <c>HPTTL</c> (not
    /// <c>HTTL</c>), so the API returns milliseconds. We convert to
    /// whole seconds here so the JSON shape matches Python, Node.js,
    /// Go, Java, Rust, Ruby, and PHP, which all expose seconds.
    /// </remarks>
    public async Task<Dictionary<string, long>> FieldTtlsSecondsAsync(
        string entityId, IReadOnlyList<string> fieldNames)
    {
        var out_ = new Dictionary<string, long>();
        if (fieldNames.Count == 0) return out_;
        var values = fieldNames.Select(f => (RedisValue)f).ToArray();
        var ms = await _db.HashFieldGetTimeToLiveAsync(KeyFor(entityId), values);
        // SE.Redis 2.13 returns a flat long[] of length == fieldNames.Count
        // (filled with -2s for a missing key). Coerce defensively against
        // any future version that might return a shorter or empty array.
        for (int i = 0; i < fieldNames.Count; i++)
        {
            // HPTTL returns ms remaining; negative sentinels pass
            // through. Convert positive durations to whole seconds
            // for parity with the other clients' helpers.
            long v = i < ms.Length ? ms[i] : -2L;
            out_[fieldNames[i]] = v < 0 ? v : v / 1000;
        }
        return out_;
    }

    // ---------------------------------------------------------------
    // Demo housekeeping
    // ---------------------------------------------------------------

    /// <summary>
    /// Enumerate up to <paramref name="limit"/> entity IDs by
    /// scanning <c>keyPrefix*</c>. <c>SCAN</c> is non-blocking; the
    /// demo uses it for UI dropdowns, not as a serving primitive.
    /// </summary>
    public List<string> ListEntityIds(int limit)
    {
        var ids = new List<string>(Math.Min(limit, 1024));
        foreach (var endPoint in _mux.GetEndPoints())
        {
            var server = _mux.GetServer(endPoint);
            // pageSize=200 mirrors the other clients' SCAN COUNT
            foreach (var key in server.Keys(
                pattern: KeyPrefix + "*", pageSize: 200))
            {
                var k = key.ToString();
                if (k.Length > KeyPrefix.Length)
                {
                    ids.Add(k[KeyPrefix.Length..]);
                    if (ids.Count >= limit) break;
                }
            }
            if (ids.Count >= limit) break;
        }
        ids.Sort(StringComparer.Ordinal);
        return ids;
    }

    /// <summary>
    /// Count every entity under the key prefix. Iterates SCAN without
    /// an in-memory cap so the UI can show the true total even when
    /// more keys exist than <see cref="ListEntityIds"/> returns.
    /// </summary>
    public long CountEntities()
    {
        long count = 0;
        foreach (var endPoint in _mux.GetEndPoints())
        {
            var server = _mux.GetServer(endPoint);
            foreach (var _ in server.Keys(
                pattern: KeyPrefix + "*", pageSize: 500))
            {
                count++;
            }
        }
        return count;
    }

    public Task<long> DeleteEntityAsync(string entityId) =>
        _db.KeyDeleteAsync(KeyFor(entityId)).ContinueWith(t => t.Result ? 1L : 0L);

    /// <summary>
    /// Drop every entity under the key prefix. Used by the demo
    /// reset path; SCANs and DELs in batches of 500.
    /// </summary>
    public async Task<long> ResetAsync()
    {
        long deleted = 0;
        foreach (var endPoint in _mux.GetEndPoints())
        {
            var server = _mux.GetServer(endPoint);
            var batch = new List<RedisKey>(500);
            foreach (var key in server.Keys(
                pattern: KeyPrefix + "*", pageSize: 500))
            {
                batch.Add(key);
                if (batch.Count >= 500)
                {
                    deleted += await _db.KeyDeleteAsync(batch.ToArray());
                    batch.Clear();
                }
            }
            if (batch.Count > 0)
            {
                deleted += await _db.KeyDeleteAsync(batch.ToArray());
            }
        }
        return deleted;
    }

    public Stats StatsSnapshot() => new(
        Interlocked.Read(ref _batchWritesTotal),
        Interlocked.Read(ref _streamingWritesTotal),
        Interlocked.Read(ref _readsTotal),
        Interlocked.Read(ref _readFieldsTotal));

    public void ResetStats()
    {
        Interlocked.Exchange(ref _batchWritesTotal, 0);
        Interlocked.Exchange(ref _streamingWritesTotal, 0);
        Interlocked.Exchange(ref _readsTotal, 0);
        Interlocked.Exchange(ref _readFieldsTotal, 0);
    }

    public record Stats(
        long BatchWritesTotal,
        long StreamingWritesTotal,
        long ReadsTotal,
        long ReadFieldsTotal);

    /// <summary>
    /// Render a feature value as a string for hash storage. Booleans
    /// become "true"/"false" so they round-trip cleanly through other
    /// clients and redis-cli.
    /// </summary>
    public static string EncodeValue(object? value) => value switch
    {
        null => "",
        bool b => b ? "true" : "false",
        double d when d == Math.Floor(d) => d.ToString("F1", System.Globalization.CultureInfo.InvariantCulture),
        double d => d.ToString(System.Globalization.CultureInfo.InvariantCulture),
        float f => f.ToString(System.Globalization.CultureInfo.InvariantCulture),
        _ => value.ToString() ?? "",
    };
}
