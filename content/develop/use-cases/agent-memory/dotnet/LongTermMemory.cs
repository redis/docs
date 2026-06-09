using System.Globalization;
using System.Text.Json;
using NRedisStack;
using NRedisStack.RedisStackCommands;
using NRedisStack.Search;
using NRedisStack.Search.Literals.Enums;
using StackExchange.Redis;

namespace AgentMemoryDemo;

/// <summary>
/// Long-term memory store for an agent, backed by Redis JSON and
/// Search.
/// </summary>
/// <remarks>
/// <para>Each memory lives as one JSON document at
/// <c>agent:mem:&lt;id&gt;</c>. The document holds the memory text,
/// its embedding vector, and a small metadata block — user,
/// namespace, kind, source thread, timestamps — that lets the recall
/// query scope results without falling back to application-side
/// filtering.</para>
///
/// <para>A single Redis Search index covers the embedding plus every
/// metadata field, so one <c>FT.SEARCH</c> call performs approximate-
/// nearest-neighbour over the in-scope subset and returns the top-k
/// memories ranked by cosine distance. The same KNN check runs at
/// <em>write</em> time to deduplicate near-identical memories before
/// they enter the store, which keeps the index from filling with
/// paraphrases of the same fact as the agent reasons over similar
/// topics across sessions.</para>
///
/// <para>Memories carry one of two kinds: <c>episodic</c> snapshots
/// from a specific thread, written with a medium TTL so old session
/// detail decays naturally; <c>semantic</c> distilled facts and
/// preferences the agent should carry forward indefinitely, written
/// with no TTL by default. The split is enforced as a TAG on the
/// index, so the recall query can ask for one kind or both with a
/// filter — no separate keyspaces.</para>
/// </remarks>
public sealed class LongTermMemory
{
    public const int VectorDimDefault = 384;

    /// <summary>
    /// How close (cosine distance) a candidate must be to an existing
    /// memory to count as a duplicate at write time. Smaller =
    /// stricter. 0.20 is calibrated to the
    /// <c>sentence-transformers/all-MiniLM-L6-v2</c> embedding model
    /// used in the demo, where a paraphrase of an existing memory
    /// lands in the 0.10 – 0.20 range and a distinct memory lands
    /// above 0.50.
    /// </summary>
    public const double DefaultDedupThreshold = 0.20;

    /// <summary>
    /// How close (cosine distance) a candidate must be to count as a
    /// relevant recall result. Larger than the dedup threshold so the
    /// agent gets a wider net at read time than at write time.
    /// </summary>
    public const double DefaultRecallThreshold = 0.55;

    /// <summary>
    /// TTL tiers, in seconds. <c>null</c> means "no TTL" — the memory
    /// persists until explicitly deleted or evicted under memory
    /// pressure.
    /// </summary>
    public static readonly IReadOnlyDictionary<string, long?> DefaultTtlByKind =
        new Dictionary<string, long?>
        {
            ["episodic"] = 7L * 24 * 3600,
            ["semantic"] = null,
        };

    // Characters Redis Search treats as syntax inside a TAG value;
    // any of them in a user-supplied filter must be backslash-escaped
    // or the surrounding `{...}` block won't parse correctly.
    private static readonly HashSet<char> TagSpecial = new(
        "\\,.<>{}[]\"':;!@#$%^&*()-+=~| ");

    private readonly IDatabase _db;
    private readonly ISearchCommands _ft;
    private readonly IJsonCommands _json;
    private readonly IReadOnlyDictionary<string, long?> _ttlByKind;

    public string IndexName { get; }
    public string KeyPrefix { get; }
    public int VectorDim { get; }
    public double DedupThreshold { get; }
    public double RecallThreshold { get; }

    public LongTermMemory(
        IDatabase db,
        string indexName = "agentmem:idx",
        string keyPrefix = "agent:mem:",
        int vectorDim = VectorDimDefault,
        double dedupThreshold = DefaultDedupThreshold,
        double recallThreshold = DefaultRecallThreshold,
        IReadOnlyDictionary<string, long?>? ttlByKind = null)
    {
        _db = db;
        _ft = db.FT();
        _json = db.JSON();
        IndexName = indexName;
        KeyPrefix = keyPrefix;
        VectorDim = vectorDim;
        DedupThreshold = dedupThreshold;
        RecallThreshold = recallThreshold;
        _ttlByKind = ttlByKind ?? DefaultTtlByKind;
    }

    public string MemoryKey(string memoryId) => KeyPrefix + memoryId;

    // ------------------------------------------------------------------
    // Index management
    // ------------------------------------------------------------------

    /// <summary>
    /// Create the Redis Search index if it doesn't already exist.
    /// </summary>
    /// <remarks>
    /// The index is declared on the JSON document type with alias
    /// names on each path; the same <c>FT.SEARCH</c> filter clause
    /// works here as on a HASH-backed index, and the field paths
    /// (<c>$.user</c>, <c>$.embedding</c>, ...) only show up in
    /// <c>FT.CREATE</c>.
    /// </remarks>
    public void CreateIndex()
    {
        var schema = new Schema()
            .AddTextField(new FieldName("$.text", "text"))
            .AddTagField(new FieldName("$.user", "user"))
            .AddTagField(new FieldName("$.namespace", "namespace"))
            .AddTagField(new FieldName("$.kind", "kind"))
            .AddTagField(new FieldName("$.source_thread", "source_thread"))
            .AddNumericField(new FieldName("$.created_ts", "created_ts"), sortable: true)
            .AddNumericField(new FieldName("$.hit_count", "hit_count"), sortable: true)
            .AddVectorField(
                new FieldName("$.embedding", "embedding"),
                Schema.VectorField.VectorAlgo.HNSW,
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
                    .On(IndexDataType.JSON)
                    .Prefix(KeyPrefix),
                schema);
        }
        catch (RedisServerException ex)
            when (ex.Message.Contains("Index already exists", StringComparison.OrdinalIgnoreCase))
        {
            // Idempotent.
        }
    }

    /// <summary>Drop the search index. Optionally also delete the JSON docs.</summary>
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
    // Write
    // ------------------------------------------------------------------

    /// <summary>
    /// Write a new memory, deduplicating against existing entries.
    /// </summary>
    /// <remarks>
    /// <para>Runs one in-scope <c>KNN(1)</c> against the index first.
    /// If the nearest existing memory is within
    /// <see cref="DedupThreshold"/>, the new memory is skipped (its
    /// content is already represented) and the existing memory's
    /// <c>hit_count</c> is bumped via <c>JSON.NUMINCRBY</c>. Otherwise
    /// a fresh JSON document is written under a new id with a TTL
    /// derived from the memory's <c>kind</c>.</para>
    ///
    /// <para>The KNN-then-write sequence is not atomic; two workers
    /// that remember the same fact at the same time can both miss
    /// each other's in-flight write and insert duplicate memories.
    /// See the walkthrough's "Concurrency caveats" section for the
    /// production fix (periodic background consolidator that merges
    /// near-duplicates).</para>
    /// </remarks>
    public WriteResult Remember(
        string text,
        float[] embedding,
        string user = "default",
        string @namespace = "default",
        string kind = "episodic",
        string sourceThread = "",
        long? ttlSeconds = null)
    {
        if (embedding is null) throw new ArgumentNullException(nameof(embedding));
        if (embedding.Length != VectorDim)
        {
            throw new ArgumentException(
                $"embedding length is {embedding.Length}; index expects {VectorDim}",
                nameof(embedding));
        }

        var nearest = Nearest(embedding, user, @namespace, kind, k: 1);
        double? nearestDistance = nearest.Count > 0 ? nearest[0].Distance : null;
        if (nearest.Count > 0
            && nearest[0].Distance is double d
            && d <= DedupThreshold)
        {
            BumpHitCount(nearest[0].Id);
            return new WriteResult(
                Id: nearest[0].Id, Deduped: true, ExistingDistance: nearestDistance);
        }

        string id = Guid.NewGuid().ToString("N").Substring(0, 12);
        string key = MemoryKey(id);
        double now = UnixSeconds();

        // Build the JSON doc as a Dictionary<string, object?> so
        // System.Text.Json serialises the float[] embedding as a
        // bare JSON array — the encoding RediSearch expects when
        // indexing a JSON path as a vector field.
        var doc = new Dictionary<string, object?>
        {
            ["id"] = id,
            ["user"] = user,
            ["namespace"] = @namespace,
            ["kind"] = kind,
            ["source_thread"] = sourceThread,
            ["text"] = text,
            ["embedding"] = embedding,
            ["created_ts"] = now,
            ["hit_count"] = 0,
        };
        long? ttl = ttlSeconds ?? ResolveTtl(kind);

        _json.Set(key, "$", doc);
        if (ttl is long t) _db.KeyExpire(key, TimeSpan.FromSeconds(t));
        return new WriteResult(Id: id, Deduped: false, ExistingDistance: nearestDistance);
    }

    // ------------------------------------------------------------------
    // Recall
    // ------------------------------------------------------------------

    /// <summary>
    /// Return the top-k in-scope memories ranked by similarity.
    /// Memories beyond <paramref name="distanceThreshold"/> (or the
    /// instance default) are dropped — the index always returns
    /// <em>something</em> for KNN, so a recall result on an unrelated
    /// query would otherwise be a confidently-wrong false positive.
    /// </summary>
    public List<MemoryRecord> Recall(
        float[] queryEmbedding,
        string user = "default",
        string? @namespace = "default",
        string? kind = null,
        int k = 5,
        double? distanceThreshold = null)
    {
        double threshold = distanceThreshold ?? RecallThreshold;
        var candidates = Nearest(queryEmbedding, user, @namespace, kind, k);
        return candidates
            .Where(c => c.Distance is double d && d <= threshold)
            .ToList();
    }

    // ------------------------------------------------------------------
    // Admin / inspection
    // ------------------------------------------------------------------

    public IndexSnapshot IndexInfo()
    {
        try
        {
            var info = _ft.Info(IndexName);
            return new IndexSnapshot(
                NumDocs: info.NumDocs,
                IndexingFailures: info.HashIndexingFailures);
        }
        catch (RedisServerException)
        {
            return new IndexSnapshot(0, 0);
        }
    }

    public List<MemoryRecord> ListMemories(
        string? user = null,
        string? @namespace = null,
        string? kind = null,
        int limit = 100)
    {
        string filterClause = BuildFilterClause(user, @namespace, kind);
        var query = new Query(filterClause)
            .ReturnFields(
                "user", "namespace", "kind", "source_thread",
                "text", "created_ts", "hit_count")
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
            return new List<MemoryRecord>();
        }
        var out_ = new List<MemoryRecord>(result.Documents.Count);
        foreach (var doc in result.Documents)
        {
            string memoryId = StripPrefix(doc.Id ?? "");
            var props = doc.GetProperties().ToDictionary(p => p.Key, p => p.Value);
            TimeSpan? ttl = _db.KeyTimeToLive(MemoryKey(memoryId));
            long? ttlSeconds = ttl is { TotalSeconds: > 0 } v ? (long)v.TotalSeconds : null;
            out_.Add(BuildRecord(memoryId, props, ttlSeconds, distance: null));
        }
        return out_;
    }

    public bool DeleteMemory(string memoryId) => _db.KeyDelete(MemoryKey(memoryId));

    /// <summary>
    /// Drop the index and every memory document. Returns the count
    /// of documents that were removed. In production the equivalent
    /// is <c>FLUSHDB</c> on a dedicated memory database, or letting
    /// TTLs and eviction expire entries naturally.
    /// </summary>
    public long Clear()
    {
        long before = IndexInfo().NumDocs;
        DropIndex(deleteDocuments: true);
        CreateIndex();
        return before;
    }

    // ------------------------------------------------------------------
    // Internals
    // ------------------------------------------------------------------

    private List<MemoryRecord> Nearest(
        float[] embedding, string? user, string? @namespace, string? kind, int k)
    {
        if (embedding.Length != VectorDim)
        {
            throw new ArgumentException(
                $"embedding length is {embedding.Length}; index expects {VectorDim}",
                nameof(embedding));
        }
        string filterClause = BuildFilterClause(user, @namespace, kind);
        string knnQuery = $"{filterClause}=>[KNN {k} @embedding $vec AS distance]";
        byte[] vecBytes = LocalEmbedder.ToBytes(embedding);

        var query = new Query(knnQuery)
            .ReturnFields(
                "user", "namespace", "kind", "source_thread",
                "text", "created_ts", "hit_count", "distance")
            .SetSortBy("distance", ascending: true)
            .Limit(0, k)
            .AddParam("vec", vecBytes)
            .Dialect(2);
        var result = _ft.Search(IndexName, query);
        if (result.Documents is null || result.Documents.Count == 0)
        {
            return new List<MemoryRecord>();
        }
        var out_ = new List<MemoryRecord>(result.Documents.Count);
        foreach (var doc in result.Documents)
        {
            // `doc.Id` is the full Redis key (e.g.
            // `agent:mem:abc123`). Strip the prefix so the returned
            // record exposes only the opaque id the UI and
            // `DeleteMemory` work with.
            string memoryId = StripPrefix(doc.Id ?? "");
            var props = doc.GetProperties().ToDictionary(p => p.Key, p => p.Value);
            double distance = ParseDouble(props.GetValueOrDefault("distance"), 0.0);
            TimeSpan? ttl = _db.KeyTimeToLive(MemoryKey(memoryId));
            long? ttlSeconds = ttl is { TotalSeconds: > 0 } v ? (long)v.TotalSeconds : null;
            out_.Add(BuildRecord(memoryId, props, ttlSeconds, distance));
        }
        return out_;
    }

    private void BumpHitCount(string memoryId)
    {
        try
        {
            _json.NumIncrby(MemoryKey(memoryId), "$.hit_count", 1);
        }
        catch (RedisServerException)
        {
            // The doc may have expired between recall and bump —
            // fine, we just lose the hit count update.
        }
    }

    private string StripPrefix(string rawKey)
        => rawKey.StartsWith(KeyPrefix) ? rawKey.Substring(KeyPrefix.Length) : rawKey;

    private long? ResolveTtl(string kind)
        => _ttlByKind.TryGetValue(kind, out var ttl) ? ttl : null;

    private static MemoryRecord BuildRecord(
        string memoryId,
        Dictionary<string, RedisValue> props,
        long? ttlSeconds,
        double? distance)
        => new(
            Id: memoryId,
            User: ToStringSafe(props, "user"),
            Namespace: ToStringSafe(props, "namespace"),
            Kind: ToStringSafe(props, "kind"),
            SourceThread: ToStringSafe(props, "source_thread"),
            Text: ToStringSafe(props, "text"),
            CreatedTs: ParseDouble(props.GetValueOrDefault("created_ts"), 0),
            HitCount: (long)ParseDouble(props.GetValueOrDefault("hit_count"), 0),
            Distance: distance,
            TtlSeconds: ttlSeconds);

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

    internal static string BuildFilterClause(string? user, string? @namespace, string? kind)
    {
        var clauses = new List<string>(3);
        if (!string.IsNullOrEmpty(user))
            clauses.Add($"@user:{{{EscapeTagValue(user!)}}}");
        if (!string.IsNullOrEmpty(@namespace))
            clauses.Add($"@namespace:{{{EscapeTagValue(@namespace!)}}}");
        if (!string.IsNullOrEmpty(kind))
            clauses.Add($"@kind:{{{EscapeTagValue(kind!)}}}");
        return clauses.Count == 0
            ? "(*)"
            : "(" + string.Join(" ", clauses) + ")";
    }

    private static string ToStringSafe(Dictionary<string, RedisValue> props, string key)
        => props.GetValueOrDefault(key).ToString() ?? "";

    private static double ParseDouble(RedisValue value, double fallback)
    {
        if (value.IsNullOrEmpty) return fallback;
        if (value.TryParse(out double d)) return d;
        return fallback;
    }

    private static double UnixSeconds()
        => DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() / 1000.0;
}
