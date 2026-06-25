using System.Globalization;
using NRedisStack;
using NRedisStack.RedisStackCommands;
using NRedisStack.Search;
using NRedisStack.Search.Literals.Enums;
using StackExchange.Redis;

namespace SemanticCacheDemo;

/// <summary>
/// Redis semantic-cache helper backed by Redis Search.
/// </summary>
/// <remarks>
/// <para>Each cache entry lives as a Hash document at
/// <c>cache:&lt;id&gt;</c>. The hash stores the user's prompt and the
/// corresponding LLM response alongside the raw float32 bytes of the
/// prompt's 384-dimensional embedding and a small set of metadata
/// fields — tenant, locale, model version, and a safety flag.</para>
///
/// <para>A single Redis Search index covers the embedding plus every
/// metadata field, so one <c>FT.SEARCH</c> call does an
/// approximate-nearest-neighbour lookup against the cached prompts
/// with a TAG pre-filter applied in the same pass — no cross-store
/// joins, no extra round trips, and tenant isolation is enforced
/// <em>inside</em> the query rather than after the fact in
/// application code.</para>
///
/// <para>The lookup is thresholded: <c>FT.SEARCH</c> always returns
/// the closest cached prompt, but the cache only serves it as a hit
/// when the cosine distance is at or below
/// <see cref="DistanceThreshold"/>. Anything further away is treated
/// as a miss; the caller is expected to run the underlying LLM and
/// write the new prompt, response, and embedding back with
/// <see cref="Put"/>.</para>
///
/// <para>Each cache entry is written with <c>EXPIRE</c>, so stale
/// answers age out without manual cleanup; combine with an
/// <c>allkeys-lfu</c> eviction policy on the database to cap memory
/// under pressure too.</para>
/// </remarks>
public sealed class RedisSemanticCache
{
    public const int VectorDimDefault = 384;

    // Characters Redis Search treats as syntax inside a TAG value;
    // any of them in a user-supplied filter must be backslash-escaped
    // or the surrounding `{...}` block won't parse correctly.
    private static readonly HashSet<char> TagSpecial = new(
        "\\,.<>{}[]\"':;!@#$%^&*()-+=~| ");

    private readonly IDatabase _db;
    private readonly ISearchCommands _ft;
    public string IndexName { get; }
    public string KeyPrefix { get; }
    public int VectorDim { get; }
    public double DistanceThreshold { get; }
    public long DefaultTtlSeconds { get; }

    public RedisSemanticCache(
        IDatabase db,
        string indexName = "semcache:idx",
        string keyPrefix = "cache:",
        int vectorDim = VectorDimDefault,
        double distanceThreshold = 0.5,
        long defaultTtlSeconds = 3600)
    {
        _db = db;
        _ft = db.FT();
        IndexName = indexName;
        KeyPrefix = keyPrefix;
        VectorDim = vectorDim;
        DistanceThreshold = distanceThreshold;
        DefaultTtlSeconds = defaultTtlSeconds;
    }

    // ------------------------------------------------------------------
    // Keys
    // ------------------------------------------------------------------

    public string EntryKey(string entryId) => KeyPrefix + entryId;

    // ------------------------------------------------------------------
    // Index management
    // ------------------------------------------------------------------

    /// <summary>
    /// Create the Redis Search index if it doesn't already exist.
    /// </summary>
    /// <remarks>
    /// One index covers the embedding plus every metadata field, so
    /// a single <c>FT.SEARCH</c> can pre-filter by tenant / locale /
    /// model and then KNN-rank the matching documents in one pass.
    /// The <c>prompt</c> and <c>response</c> fields are stored as
    /// <c>TEXT</c> so admin tooling can grep the cache by content,
    /// but the cache lookup itself is vector-only.
    /// </remarks>
    public void CreateIndex()
    {
        var schema = new Schema()
            .AddTextField("prompt")
            .AddTextField("response")
            .AddTagField("tenant")
            .AddTagField("locale")
            .AddTagField("model_version")
            .AddTagField("safety")
            .AddNumericField("created_ts", sortable: true)
            .AddNumericField("hit_count", sortable: true)
            .AddVectorField("embedding", Schema.VectorField.VectorAlgo.HNSW,
                new Dictionary<string, object>
                {
                    ["TYPE"] = "FLOAT32",
                    ["DIM"] = VectorDim,
                    ["DISTANCE_METRIC"] = "COSINE",
                });
        try
        {
            _ft.Create(
                IndexName,
                new FTCreateParams()
                    .On(IndexDataType.HASH)
                    .Prefix(KeyPrefix),
                schema);
        }
        catch (RedisServerException ex)
            when (ex.Message.Contains("Index already exists", StringComparison.OrdinalIgnoreCase))
        {
            // Idempotent: re-running create on an already-built
            // index is the expected path on every restart.
        }
    }

    /// <summary>Drop the search index. Optionally also delete cached entries.</summary>
    public void DropIndex(bool deleteDocuments = false)
    {
        try
        {
            _ft.DropIndex(IndexName, deleteDocuments);
        }
        catch (RedisServerException ex)
        {
            string msg = ex.Message ?? "";
            if (!msg.Contains("no such index", StringComparison.OrdinalIgnoreCase)
                && !msg.Contains("unknown index name", StringComparison.OrdinalIgnoreCase))
            {
                throw;
            }
        }
    }

    // ------------------------------------------------------------------
    // Lookup
    // ------------------------------------------------------------------

    /// <summary>
    /// Find the nearest in-scope cached prompt and decide hit / miss.
    /// </summary>
    /// <remarks>
    /// <para><c>FT.SEARCH</c> returns the single nearest entry that
    /// satisfies the TAG pre-filters. The lookup is a hit only if the
    /// reported cosine distance is at or below
    /// <paramref name="distanceThreshold"/> (or the instance
    /// default). Anything further away is a miss with the candidate
    /// distance attached so the caller can log it.</para>
    ///
    /// <para>On a hit, the entry's <c>hit_count</c> is incremented
    /// atomically with <c>HINCRBY</c> and the TTL is refreshed inside
    /// the same <c>MULTI/EXEC</c> so a frequently used answer doesn't
    /// age out under cold tail entries.</para>
    /// </remarks>
    public LookupResult Lookup(
        float[] queryVec,
        string? tenant = null,
        string? locale = null,
        string? modelVersion = null,
        string? safety = "ok",
        double? distanceThreshold = null)
    {
        if (queryVec is null) throw new ArgumentNullException(nameof(queryVec));

        // Match the shape check that Put performs. A wrong-dim
        // vector would otherwise hit Redis as a malformed FT.SEARCH
        // parameter and surface as a server-side parse error instead
        // of a clear caller-side error.
        if (queryVec.Length != VectorDim)
        {
            throw new ArgumentException(
                $"queryVec length is {queryVec.Length}; index expects {VectorDim}",
                nameof(queryVec));
        }

        double threshold = distanceThreshold ?? DistanceThreshold;

        string filterClause = BuildFilterClause(tenant, locale, modelVersion, safety);
        string knnQuery = $"{filterClause}=>[KNN 1 @embedding $vec AS distance]";
        byte[] vecBytes = LocalEmbedder.ToBytes(queryVec);

        var query = new Query(knnQuery)
            .ReturnFields(
                "prompt", "response", "tenant", "locale",
                "model_version", "hit_count", "distance")
            .SetSortBy("distance", ascending: true)
            .Limit(0, 1)
            .AddParam("vec", vecBytes)
            .Dialect(2);

        var result = _ft.Search(IndexName, query);
        if (result.Documents is null || result.Documents.Count == 0)
        {
            return new CacheMiss(null, null);
        }

        var doc = result.Documents[0];
        string rawKey = doc.Id ?? "";
        string entryId = rawKey.StartsWith(KeyPrefix)
            ? rawKey.Substring(KeyPrefix.Length)
            : rawKey;

        var props = doc.GetProperties().ToDictionary(p => p.Key, p => p.Value);
        double distance = ParseDouble(props.GetValueOrDefault("distance"), 0.0);

        if (distance > threshold)
        {
            return new CacheMiss(distance, entryId);
        }

        // The hash may have expired between FT.SEARCH returning the
        // row and us getting here — the search index lags expirations
        // by its periodic scan. If we just blindly HINCRBY-ed, Redis
        // would helpfully recreate the hash with only `hit_count`
        // set and the search index would then log it as an indexing
        // failure (no embedding, no metadata). EXISTS narrows that
        // race to the round-trip below; a strictly race-free version
        // would wrap the bump in a Lua script that checks existence
        // and acts in one server-side step.
        string entryKey = EntryKey(entryId);
        if (!_db.KeyExists(entryKey))
        {
            return new CacheMiss(distance, entryId);
        }

        // MULTI/EXEC the three writes so they apply as a unit on the
        // server — a partial failure between HINCRBY and EXPIRE would
        // otherwise leave the entry without a refreshed TTL.
        // StackExchange.Redis returns Task results that resolve only
        // after Execute(); we collect them and read .Result here
        // because the demo is intentionally synchronous to match the
        // other ports.
        var tx = _db.CreateTransaction();
        var hincrTask = tx.HashIncrementAsync(entryKey, "hit_count", 1);
        var expireTask = tx.KeyExpireAsync(entryKey, TimeSpan.FromSeconds(DefaultTtlSeconds));
        var ttlTask = tx.KeyTimeToLiveAsync(entryKey);
        bool committed = tx.Execute();
        if (!committed)
        {
            // Should be unreachable — we didn't queue any WATCHes —
            // but documenting the contract avoids a silent NRE if a
            // future refactor adds one.
            return new CacheMiss(distance, entryId);
        }

        long newHitCount = hincrTask.Result;
        TimeSpan? ttl = ttlTask.Result;
        long ttlSeconds = ttl is { TotalSeconds: > 0 } v ? (long)v.TotalSeconds : DefaultTtlSeconds;

        return new CacheHit(
            Id: entryId,
            Prompt: props.GetValueOrDefault("prompt").ToString() ?? "",
            Response: props.GetValueOrDefault("response").ToString() ?? "",
            Tenant: props.GetValueOrDefault("tenant").ToString() ?? "",
            Locale: props.GetValueOrDefault("locale").ToString() ?? "",
            ModelVersion: props.GetValueOrDefault("model_version").ToString() ?? "",
            Distance: distance,
            TtlSeconds: ttlSeconds,
            HitCount: newHitCount);
    }

    // ------------------------------------------------------------------
    // Write
    // ------------------------------------------------------------------

    /// <summary>
    /// Write a new cache entry and return its id.
    /// </summary>
    /// <remarks>
    /// The embedding is stored as raw little-endian float32 bytes —
    /// the encoding Redis Search expects from a <c>FLOAT32</c> vector
    /// field. <c>EXPIRE</c> on the key gives every entry a bounded
    /// lifetime; combine with an <c>allkeys-lfu</c> eviction policy
    /// on the database to cap memory under pressure too.
    /// </remarks>
    public string Put(
        string prompt,
        string response,
        float[] embedding,
        string tenant = "default",
        string locale = "en",
        string modelVersion = "gpt-4.5-2026",
        string safety = "ok",
        long? ttlSeconds = null,
        string? entryId = null)
    {
        if (embedding is null) throw new ArgumentNullException(nameof(embedding));
        if (embedding.Length != VectorDim)
        {
            throw new ArgumentException(
                $"embedding length is {embedding.Length}; index expects {VectorDim}",
                nameof(embedding));
        }

        string id = string.IsNullOrEmpty(entryId)
            ? Guid.NewGuid().ToString("N").Substring(0, 12)
            : entryId!;
        string key = EntryKey(id);
        long ttl = ttlSeconds ?? DefaultTtlSeconds;
        byte[] vecBytes = LocalEmbedder.ToBytes(embedding);

        // Use HashEntry[] with explicit RedisValue so the embedding
        // travels as raw bytes; mixing in a string-keyed dictionary
        // would coerce the binary field through UTF-8 and corrupt
        // the float bytes.
        double createdTs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() / 1000.0;
        var entries = new HashEntry[]
        {
            new("prompt", prompt ?? ""),
            new("response", response ?? ""),
            new("tenant", tenant),
            new("locale", locale),
            new("model_version", modelVersion),
            new("safety", safety),
            new("created_ts", createdTs.ToString("F6", CultureInfo.InvariantCulture)),
            new("hit_count", "0"),
            new("embedding", vecBytes),
        };

        // MULTI/EXEC so HSET and EXPIRE either both apply or neither
        // does. Without the transaction wrapper a connection drop
        // between the two writes could leave the entry without a TTL
        // and the cache would then keep an answer past its intended
        // lifetime (or forever, on a database with no eviction
        // policy).
        var tx = _db.CreateTransaction();
        _ = tx.HashSetAsync(key, entries);
        _ = tx.KeyExpireAsync(key, TimeSpan.FromSeconds(ttl));
        tx.Execute();
        return id;
    }

    // ------------------------------------------------------------------
    // Filter clause
    // ------------------------------------------------------------------

    internal static string EscapeTagValue(string value)
    {
        if (string.IsNullOrEmpty(value)) return "";
        var sb = new System.Text.StringBuilder(value.Length);
        foreach (var ch in value)
        {
            if (TagSpecial.Contains(ch)) sb.Append('\\');
            sb.Append(ch);
        }
        return sb.ToString();
    }

    internal static string BuildFilterClause(
        string? tenant, string? locale, string? modelVersion, string? safety)
    {
        var clauses = new List<string>(4);
        if (!string.IsNullOrEmpty(tenant))
            clauses.Add($"@tenant:{{{EscapeTagValue(tenant!)}}}");
        if (!string.IsNullOrEmpty(locale))
            clauses.Add($"@locale:{{{EscapeTagValue(locale!)}}}");
        if (!string.IsNullOrEmpty(modelVersion))
            clauses.Add($"@model_version:{{{EscapeTagValue(modelVersion!)}}}");
        if (!string.IsNullOrEmpty(safety))
            clauses.Add($"@safety:{{{EscapeTagValue(safety!)}}}");
        return clauses.Count == 0
            ? "(*)"
            : "(" + string.Join(" ", clauses) + ")";
    }

    // ------------------------------------------------------------------
    // Inspection / admin
    // ------------------------------------------------------------------

    /// <summary>Subset of <c>FT.INFO</c> useful for the demo UI.</summary>
    public IndexSnapshot IndexInfo()
    {
        try
        {
            var info = _ft.Info(IndexName);
            return new IndexSnapshot(
                NumDocs: info.NumDocs,
                IndexingFailures: info.HashIndexingFailures,
                VectorIndexSizeMb: info.VectorIndexSzMebibytes);
        }
        catch (RedisServerException)
        {
            return new IndexSnapshot(0, 0, 0.0);
        }
    }

    /// <summary>
    /// Return every cached entry (no embedding) for the admin UI.
    /// </summary>
    public List<EntrySnapshot> ListEntries(int limit = 100)
    {
        var query = new Query("*")
            .ReturnFields(
                "prompt", "response", "tenant", "locale",
                "model_version", "safety", "created_ts", "hit_count")
            .Limit(0, limit)
            .SetSortBy("created_ts", ascending: false)
            .Dialect(2);

        SearchResult result;
        try
        {
            result = _ft.Search(IndexName, query);
        }
        catch (RedisServerException)
        {
            return new List<EntrySnapshot>();
        }

        var out_ = new List<EntrySnapshot>();
        foreach (var doc in result.Documents)
        {
            string rawKey = doc.Id ?? "";
            string entryId = rawKey.StartsWith(KeyPrefix)
                ? rawKey.Substring(KeyPrefix.Length)
                : rawKey;
            TimeSpan? ttl = _db.KeyTimeToLive(EntryKey(entryId));
            long ttlSeconds = ttl is { TotalSeconds: > 0 } v ? (long)v.TotalSeconds : 0L;
            var props = doc.GetProperties().ToDictionary(p => p.Key, p => p.Value);
            out_.Add(new EntrySnapshot(
                Id: entryId,
                Prompt: props.GetValueOrDefault("prompt").ToString() ?? "",
                Response: props.GetValueOrDefault("response").ToString() ?? "",
                Tenant: props.GetValueOrDefault("tenant").ToString() ?? "",
                Locale: props.GetValueOrDefault("locale").ToString() ?? "",
                ModelVersion: props.GetValueOrDefault("model_version").ToString() ?? "",
                Safety: props.GetValueOrDefault("safety").ToString() ?? "",
                HitCount: (long)ParseDouble(props.GetValueOrDefault("hit_count"), 0),
                TtlSeconds: ttlSeconds,
                CreatedTs: ParseDouble(props.GetValueOrDefault("created_ts"), 0)));
        }
        return out_;
    }

    /// <summary>Drop a single entry. Returns <c>true</c> if the key existed.</summary>
    public bool DeleteEntry(string entryId)
    {
        return _db.KeyDelete(EntryKey(entryId));
    }

    /// <summary>
    /// Drop the index and every cached entry, then re-create the
    /// index. Returns the count of entries that were removed.
    /// </summary>
    public long Clear()
    {
        long before = IndexInfo().NumDocs;
        DropIndex(deleteDocuments: true);
        CreateIndex();
        return before;
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private static double ParseDouble(RedisValue value, double fallback)
    {
        if (value.IsNullOrEmpty) return fallback;
        if (value.TryParse(out double d)) return d;
        return fallback;
    }
}

public sealed record IndexSnapshot(long NumDocs, long IndexingFailures, double VectorIndexSizeMb);

public sealed record EntrySnapshot(
    string Id,
    string Prompt,
    string Response,
    string Tenant,
    string Locale,
    string ModelVersion,
    string Safety,
    long HitCount,
    long TtlSeconds,
    double CreatedTs);
