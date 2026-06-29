// Redis recommendation-engine helper backed by Redis Search.
//
// Items live as Hash documents at ``product:<id>``. Each hash stores
// the item's structured metadata (name, description, category, brand,
// price, in-stock flag, rating) alongside the raw float32 bytes of its
// 384-dimensional embedding. A single Redis Search index covers every
// field, so one FT.SEARCH call does the KNN over the embedding and
// the TAG / NUMERIC / TEXT pre-filter in the same pass — no
// cross-store joins, no extra round trips.
//
// Per-user state lives in ``user:<id>:features``: a session vector
// written as an exponentially weighted average of recently-clicked
// item embeddings, plus per-category affinity counters incremented
// atomically with HINCRBYFLOAT. The next time the application reads
// that hash to build a query, it sees the click — no batch cycle, no
// cache invalidation.
//
// The recommendation flow has two paths:
//
//   * Query path (per recommendation request): FT.SEARCH with KNN over
//     the embedding, optionally pre-filtered by structured attributes
//     and optionally biased toward a session vector blended into the
//     query, followed by a log-scaled category-affinity re-rank.
//   * Click path (per user interaction): the click writes a new
//     EWMA-blended session vector and increments the category affinity
//     in the user features hash. The next query path picks both up.

using System.Globalization;
using System.Text;
using NRedisStack.RedisStackCommands;
using NRedisStack.Search;
using NRedisStack.Search.Literals.Enums;
using StackExchange.Redis;

namespace RecommendationDemo;

/// <summary>One result row from the candidate-retrieval stage.</summary>
public sealed record Candidate
{
    public string Id { get; init; } = "";
    public string Name { get; init; } = "";
    public string Description { get; init; } = "";
    public string Category { get; init; } = "";
    public string Brand { get; init; } = "";
    public double Price { get; init; }
    public double Rating { get; init; }
    public bool InStock { get; init; }
    /// <summary>
    /// Cosine distance returned by FT.SEARCH (0 = identical, 2 =
    /// opposite). Lower is better.
    /// </summary>
    public double VectorDistance { get; init; }
    /// <summary>
    /// Final ranking score. Initialised to <see cref="VectorDistance"/>
    /// and nudged downward by <see cref="Recommender.Rerank"/> when the
    /// user has category affinities. Lower is better.
    /// </summary>
    public double Score { get; set; }
}

/// <summary>Lightweight catalog row for the demo UI.</summary>
public sealed record ProductSummary
{
    public string Id { get; init; } = "";
    public string Name { get; init; } = "";
    public string Category { get; init; } = "";
    public string Brand { get; init; } = "";
    public double Price { get; init; }
    public double Rating { get; init; }
    public bool InStock { get; init; }
}

/// <summary>Readable form of a user's features hash.</summary>
public sealed class UserFeatures
{
    public float[]? SessionVec { get; set; }
    public Dictionary<string, double> Affinities { get; set; } = new();
    public int Clicks { get; set; }
    public string? LastClickedId { get; set; }
    public string? LastClickedCategory { get; set; }
}

/// <summary>Filter knob set; empty fields are ignored.</summary>
public sealed class FilterOptions
{
    public string? Category { get; set; }
    public string? Brand { get; set; }
    public double? MinPrice { get; set; }
    public double? MaxPrice { get; set; }
    public bool InStockOnly { get; set; }
    public double? MinRating { get; set; }
    public string? TextMatch { get; set; }
    /// <summary>Defaults to <c>"description"</c>.</summary>
    public string? TextField { get; set; }
}

/// <summary>Filter + KNN + session-blend settings for CandidateRetrieve.</summary>
public sealed class RetrieveOptions
{
    public FilterOptions Filter { get; set; } = new();
    /// <summary>Defaults to 10 when non-positive.</summary>
    public int K { get; set; } = 10;
    /// <summary>Optional session vector to blend into the query.</summary>
    public float[]? SessionVec { get; set; }
    /// <summary>EWMA weight for the session vector (defaults to 0.3).</summary>
    public double SessionWeight { get; set; } = 0.3;
}

/// <summary>Tunables for <see cref="Recommender.RecordClick"/>.</summary>
public sealed class RecordClickOptions
{
    /// <summary>
    /// EWMA weight given to the *new* click; the previous session keeps
    /// <c>1 - alpha</c>. Default 0.4 biases history over the latest
    /// click so a single accidental click doesn't swing the session.
    /// </summary>
    public double EwmaAlpha { get; set; } = 0.4;
    /// <summary>Affinity bump per click (default 1.0).</summary>
    public double AffinityStep { get; set; } = 1.0;
}

/// <summary>Summary returned from <see cref="Recommender.RecordClick"/>.</summary>
public sealed record RecordClickResult(string Category, double Affinity, int Clicks, string LastClickedId);

/// <summary>Subset of FT.INFO the demo UI displays.</summary>
public sealed record IndexStats(string IndexName, long NumDocs, long IndexingFailures, double VectorIndexSizeMB);

/// <summary>
/// Indexes, queries, and re-ranks a small product catalogue. One
/// instance is safe to share across requests / threads; the underlying
/// <see cref="ConnectionMultiplexer"/> handles connection pooling.
/// </summary>
public sealed class Recommender
{
    public IDatabase Db { get; }
    public string IndexName { get; }
    public string KeyPrefix { get; }
    public string UserKeyPrefix { get; }
    public int VectorDim { get; }

    public Recommender(
        IDatabase db,
        string indexName = "recommend:idx",
        string keyPrefix = "product:",
        string userKeyPrefix = "user:",
        int vectorDim = 384)
    {
        Db = db;
        IndexName = indexName;
        KeyPrefix = keyPrefix;
        UserKeyPrefix = userKeyPrefix;
        VectorDim = vectorDim;
    }

    public string ProductKey(string productId) => KeyPrefix + productId;
    public string UserKey(string userId) => UserKeyPrefix + userId + ":features";

    // ------------------------------------------------------------------
    // Index management
    // ------------------------------------------------------------------

    /// <summary>
    /// Create the Redis Search index if it doesn't already exist. One
    /// index covers every queryable field. The vector field is HNSW
    /// with cosine distance so KNN is approximate but fast, and TAG /
    /// NUMERIC / TEXT fields share the same index so a single
    /// <c>FT.SEARCH</c> can pre-filter and KNN-rank in one pass.
    /// </summary>
    public void CreateIndex()
    {
        var schema = new Schema()
            .AddTextField(new FieldName("name", null), 1.0)
            .AddTextField(new FieldName("description", null), 0.5)
            .AddTagField("category")
            .AddTagField("brand")
            .AddTagField("in_stock")
            .AddNumericField("price", sortable: true)
            .AddNumericField("rating", sortable: true)
            .AddVectorField("embedding", Schema.VectorField.VectorAlgo.HNSW,
                new Dictionary<string, object>
                {
                    ["TYPE"] = "FLOAT32",
                    ["DIM"] = VectorDim.ToString(CultureInfo.InvariantCulture),
                    ["DISTANCE_METRIC"] = "COSINE",
                });
        var parms = new FTCreateParams()
            .On(IndexDataType.HASH)
            .Prefix(KeyPrefix);
        try
        {
            Db.FT().Create(IndexName, parms, schema);
        }
        catch (RedisServerException ex) when (ex.Message.Contains("Index already exists", StringComparison.OrdinalIgnoreCase))
        {
            // Idempotent — another caller (or a previous run) already created it.
        }
    }

    /// <summary>
    /// Drop the search index. Optionally also delete the documents.
    /// Missing-index errors are tolerated so the call is idempotent.
    /// </summary>
    public void DropIndex(bool deleteDocuments = false)
    {
        try
        {
            Db.FT().DropIndex(IndexName, dd: deleteDocuments);
        }
        catch (RedisServerException ex)
        {
            var msg = ex.Message.ToLowerInvariant();
            // Different Redis Search versions phrase the missing-index
            // error differently; tolerate either form.
            if (!msg.Contains("no such index") && !msg.Contains("unknown index name"))
            {
                throw;
            }
        }
    }

    // ------------------------------------------------------------------
    // Catalog ingest
    // ------------------------------------------------------------------

    /// <summary>
    /// Pipeline a batch of <c>HSET</c> writes for the catalogue. Each
    /// product must include either a non-empty <c>embedding</c>
    /// (raw float32 bytes) or <c>EmbeddingB64</c> (base64-encoded
    /// bytes — what BuildCatalog writes into catalog.json).
    /// </summary>
    public int IndexProducts(IEnumerable<CatalogProduct> products)
    {
        var list = products.ToList();
        var batch = Db.CreateBatch();
        var tasks = new List<Task>(list.Count);
        foreach (var p in list)
        {
            var entries = EncodeProduct(p);
            tasks.Add(batch.HashSetAsync(ProductKey(p.Id), entries));
        }
        batch.Execute();
        Task.WaitAll(tasks.ToArray());
        return list.Count;
    }

    private HashEntry[] EncodeProduct(CatalogProduct p)
    {
        if (string.IsNullOrEmpty(p.EmbeddingB64))
        {
            throw new ArgumentException($"product {p.Id}: no embedding (embedding_b64 missing)", nameof(p));
        }
        var vec = Convert.FromBase64String(p.EmbeddingB64);
        // The product id lives in the Redis key itself (``product:<id>``);
        // we don't repeat it as a hash field.
        return new HashEntry[]
        {
            new("name", p.Name),
            new("description", p.Description),
            new("category", p.Category),
            new("brand", p.Brand),
            new("price", p.Price.ToString("G", CultureInfo.InvariantCulture)),
            new("rating", p.Rating.ToString("G", CultureInfo.InvariantCulture)),
            new("in_stock", p.InStock ? "true" : "false"),
            new("embedding", vec),
        };
    }

    /// <summary>Cheap document count via <c>FT.SEARCH * LIMIT 0 0</c>.</summary>
    public long CountIndexed()
    {
        try
        {
            var res = Db.FT().Search(IndexName,
                new Query("*").Limit(0, 0));
            return res.TotalResults;
        }
        catch (RedisServerException)
        {
            return 0;
        }
    }

    // ------------------------------------------------------------------
    // Candidate retrieval (KNN + optional pre-filter)
    // ------------------------------------------------------------------

    /// <summary>
    /// Retrieve top-<paramref name="opts"/>.<c>K</c> candidates with
    /// <c>FT.SEARCH</c> KNN + filters.
    ///
    /// Pre-filter knobs are TAG (<c>Category</c>, <c>Brand</c>,
    /// <c>InStockOnly</c>), NUMERIC (<c>MinPrice</c> / <c>MaxPrice</c>,
    /// <c>MinRating</c>), and TEXT (<c>TextMatch</c> against
    /// <c>TextField</c>, default <c>description</c>). They combine
    /// with an implicit AND in front of the <c>KNN</c> clause, so
    /// Redis evaluates them first and then KNN-ranks only the matching
    /// documents.
    ///
    /// If <c>SessionVec</c> is provided, the query vector is blended
    /// with it before retrieval — that's the real-time signal path.
    /// </summary>
    public List<Candidate> CandidateRetrieve(float[] queryVec, RetrieveOptions opts)
    {
        var k = opts.K <= 0 ? 10 : opts.K;
        // Blend the query with the session signal so a session's
        // clicks pull the next retrieval toward what the user has
        // been engaging with. Both inputs are unit-normalised so
        // cosine scores stay comparable.
        var effective = BlendVectors(queryVec, opts.SessionVec, opts.SessionWeight);
        var filterClause = BuildFilterClause(opts.Filter);

        var queryString = $"{filterClause}=>[KNN {k} @embedding $vec AS vector_score]";
        var query = new Query(queryString)
            .AddParam("vec", Embedder.FloatsToBytes(effective))
            .SetSortBy("vector_score")
            .ReturnFields(
                new FieldName("name", null),
                new FieldName("description", null),
                new FieldName("category", null),
                new FieldName("brand", null),
                new FieldName("price", null),
                new FieldName("rating", null),
                new FieldName("in_stock", null),
                new FieldName("vector_score", null))
            .Limit(0, k)
            .Dialect(2);
        var result = Db.FT().Search(IndexName, query);
        return result.Documents.Select(DecodeCandidate).ToList();
    }

    // ------------------------------------------------------------------
    // Filter clause construction
    // ------------------------------------------------------------------

    // Characters Redis Search treats as syntax inside a TAG value; any
    // of them appearing in a user-supplied filter must be
    // backslash-escaped or the surrounding ``{...}`` block won't parse
    // correctly. The list comes from the Redis Search query-syntax
    // documentation. The backslash itself is included so a value
    // containing a literal ``\`` can't *eat* the next character's escape.
    private static readonly HashSet<char> TagSpecial = new(
        "\\,.<>{}[]\"':;!@#$%^&*()-+=~| ");

    /// <summary>
    /// Backslash-escape characters that have meaning inside
    /// <c>@tag:{...}</c> so a TAG filter built from external input
    /// can't accidentally close the brace, inject an additional clause,
    /// or misparse a value that simply contains a space or a hyphen.
    /// </summary>
    public static string EscapeTagValue(string value)
    {
        var sb = new StringBuilder(value.Length);
        foreach (var ch in value)
        {
            if (TagSpecial.Contains(ch)) sb.Append('\\');
            sb.Append(ch);
        }
        return sb.ToString();
    }

    /// <summary>
    /// Render the pre-filter clause that goes in front of the KNN
    /// clause. Empty filters return <c>(*)</c>, a no-op in DIALECT 2.
    /// </summary>
    public static string BuildFilterClause(FilterOptions f)
    {
        var clauses = new List<string>(6);
        if (!string.IsNullOrEmpty(f.Category))
            clauses.Add("@category:{" + EscapeTagValue(f.Category) + "}");
        if (!string.IsNullOrEmpty(f.Brand))
            clauses.Add("@brand:{" + EscapeTagValue(f.Brand) + "}");
        if (f.MinPrice.HasValue || f.MaxPrice.HasValue)
        {
            var lo = f.MinPrice.HasValue
                ? f.MinPrice.Value.ToString("G", CultureInfo.InvariantCulture)
                : "-inf";
            var hi = f.MaxPrice.HasValue
                ? f.MaxPrice.Value.ToString("G", CultureInfo.InvariantCulture)
                : "+inf";
            clauses.Add($"@price:[{lo} {hi}]");
        }
        if (f.MinRating.HasValue)
            clauses.Add($"@rating:[{f.MinRating.Value.ToString("G", CultureInfo.InvariantCulture)} +inf]");
        if (f.InStockOnly)
            clauses.Add("@in_stock:{true}");
        if (!string.IsNullOrEmpty(f.TextMatch))
        {
            var field = string.IsNullOrEmpty(f.TextField) ? "description" : f.TextField;
            // Wrapping in quotes makes the value a single phrase and
            // avoids tripping the query parser on operators (``-``,
            // ``|``, ``"``, etc.) a user might legitimately type.
            var safe = f.TextMatch.Replace("\\", "\\\\").Replace("\"", "\\\"");
            clauses.Add($"@{field}:\"{safe}\"");
        }
        return clauses.Count == 0
            ? "(*)"
            : "(" + string.Join(" ", clauses) + ")";
    }

    private Candidate DecodeCandidate(NRedisStack.Search.Document doc)
    {
        var props = doc.GetProperties().ToDictionary(p => p.Key, p => (string?)p.Value);
        string Get(string key, string fallback = "")
            => props.TryGetValue(key, out var v) ? (v ?? fallback) : fallback;
        double GetD(string key)
            => double.TryParse(Get(key, "0"), NumberStyles.Float, CultureInfo.InvariantCulture, out var v)
                ? v : 0.0;

        // ``doc.Id`` is the Redis key (``product:<id>``); strip the
        // prefix to expose the bare product id the rest of the demo uses.
        var bare = doc.Id.StartsWith(KeyPrefix, StringComparison.Ordinal)
            ? doc.Id.Substring(KeyPrefix.Length)
            : doc.Id;
        var dist = GetD("vector_score");
        return new Candidate
        {
            Id = bare,
            Name = Get("name"),
            Description = Get("description"),
            Category = Get("category"),
            Brand = Get("brand"),
            Price = GetD("price"),
            Rating = GetD("rating"),
            InStock = Get("in_stock", "false") == "true",
            VectorDistance = dist,
            Score = dist,
        };
    }

    // ------------------------------------------------------------------
    // Re-ranking with user affinities
    // ------------------------------------------------------------------

    /// <summary>
    /// Apply a per-category affinity bonus and re-sort in place.
    ///
    /// <c>UserFeatures.Affinities</c> is a <c>{category: weight}</c>
    /// map accumulated from previous clicks. The bonus is shaped by
    /// <c>log(1 + affinity) * affinityWeight</c> so repeated clicks
    /// see diminishing returns and a single dominant category can't
    /// push the bonus arbitrarily large. The bonus is subtracted from
    /// the cosine distance, so a category the user has shown interest
    /// in pulls its members up the list (closer to zero) without
    /// overwhelming the vector signal.
    /// </summary>
    public List<Candidate> Rerank(
        List<Candidate> candidates,
        UserFeatures features,
        double affinityWeight = 0.15)
    {
        if (affinityWeight <= 0 || features.Affinities.Count == 0)
        {
            // Still sort by current Score for a stable result shape.
            candidates.Sort((a, b) => a.Score.CompareTo(b.Score));
            return candidates;
        }
        foreach (var c in candidates)
        {
            var raw = features.Affinities.TryGetValue(c.Category, out var v) ? v : 0.0;
            if (raw < 0) raw = 0;
            var bonus = Math.Log(1 + raw) * affinityWeight;
            c.Score = c.VectorDistance - bonus;
        }
        candidates.Sort((a, b) => a.Score.CompareTo(b.Score));
        return candidates;
    }

    // ------------------------------------------------------------------
    // Session signals (clicks)
    // ------------------------------------------------------------------

    /// <summary>
    /// Update a user's session vector and category affinity.
    ///
    /// Reads the clicked item's embedding from its hash, blends it
    /// into the user's session vector with an exponentially weighted
    /// moving average, and bumps the category counter and click total.
    ///
    /// The affinity bump and click-count bump use <c>HINCRBYFLOAT</c>
    /// / <c>HINCRBY</c> so they're atomic against any concurrent
    /// caller. The session vector blend is inherently
    /// read-modify-write — the new vector depends on the previous one —
    /// and is *not* atomic against a concurrent click for the same
    /// user. For the per-user data this helper writes, that window is
    /// rare in practice; if it matters in a given deployment, wrap the
    /// read and the writeback in <c>WATCH/MULTI/EXEC</c> (or move the
    /// whole blend into a Lua script).
    /// </summary>
    public RecordClickResult RecordClick(string userId, string productId, RecordClickOptions? options = null)
    {
        // ``new RecordClickOptions()`` already supplies the documented
        // defaults (EwmaAlpha = 0.4, AffinityStep = 1.0). Honour
        // whatever values the caller put on the options object,
        // including zero — that's the documented "disable this
        // contribution" escape hatch (audit-checklist row 28).
        var opts = options ?? new RecordClickOptions();
        var alpha = opts.EwmaAlpha;
        var step = opts.AffinityStep;

        var productKey = ProductKey(productId);
        // Pull the fields we need from the product hash in one round trip.
        var raw = Db.HashGet(productKey, new RedisValue[] { "embedding", "category" });
        if (raw[0].IsNull)
        {
            throw new KeyNotFoundException($"unknown product {productId}");
        }
        var clickedBytes = (byte[])raw[0]!;
        var clickedVec = Embedder.BytesToFloats(clickedBytes);
        var category = raw[1].HasValue ? (string)raw[1]! : "unknown";
        if (string.IsNullOrEmpty(category)) category = "unknown";

        var userKey = UserKey(userId);
        var previous = Db.HashGet(userKey, "session_vec");
        float[] newSession;
        if (previous.IsNullOrEmpty)
        {
            // First click — the clicked vector is already unit-normalised.
            newSession = clickedVec;
        }
        else
        {
            var prevVec = Embedder.BytesToFloats((byte[])previous!);
            newSession = EwmaBlend(prevVec, clickedVec, alpha);
        }

        // Affinity and click counters are independent atomic
        // increments; only the session vector needs the
        // read-modify-write because it depends on the previous value.
        // Pipeline the three writes in one round trip.
        var batch = Db.CreateBatch();
        var hsetTask = batch.HashSetAsync(userKey, new HashEntry[]
        {
            new("session_vec", Embedder.FloatsToBytes(newSession)),
            new("last_clicked_id", productId),
            new("last_clicked_category", category),
        });
        var affTask = batch.HashIncrementAsync(userKey, "aff:" + category, step);
        var clicksTask = batch.HashIncrementAsync(userKey, "clicks", 1);
        batch.Execute();
        Task.WaitAll(hsetTask, affTask, clicksTask);

        return new RecordClickResult(category, affTask.Result, (int)clicksTask.Result, productId);
    }

    /// <summary>Read a user's session vector and affinities for re-ranking.</summary>
    public UserFeatures GetUserFeatures(string userId)
    {
        var raw = Db.HashGetAll(UserKey(userId));
        var features = new UserFeatures();
        if (raw.Length == 0) return features;
        foreach (var e in raw)
        {
            var name = (string)e.Name!;
            if (name == "session_vec")
            {
                var bytes = (byte[])e.Value!;
                if (bytes.Length > 0)
                {
                    var vec = Embedder.BytesToFloats(bytes);
                    // A stored session vector with the wrong length means
                    // the embedding model has changed since the click
                    // that wrote it (e.g. the catalog was rebuilt under
                    // a different model and the demo started with
                    // --no-reset). Drop the stale vector so the blended
                    // query path doesn't index out of bounds — the user
                    // sees no session signal until they click again
                    // under the current model.
                    if (vec.Length == VectorDim) features.SessionVec = vec;
                }
            }
            else if (name.StartsWith("aff:", StringComparison.Ordinal))
            {
                var cat = name.Substring(4);
                if (double.TryParse((string)e.Value!, NumberStyles.Float, CultureInfo.InvariantCulture, out var v))
                {
                    features.Affinities[cat] = v;
                }
            }
            else if (name == "clicks")
            {
                if (int.TryParse((string)e.Value!, NumberStyles.Integer, CultureInfo.InvariantCulture, out var n))
                {
                    features.Clicks = n;
                }
            }
            else if (name == "last_clicked_id")
            {
                features.LastClickedId = (string)e.Value!;
            }
            else if (name == "last_clicked_category")
            {
                features.LastClickedCategory = (string)e.Value!;
            }
        }
        return features;
    }

    /// <summary>Delete a user's feature hash. Next request starts cold.</summary>
    public void ResetUser(string userId) => Db.KeyDelete(UserKey(userId));

    // ------------------------------------------------------------------
    // Hot embedding refresh (no serving downtime)
    // ------------------------------------------------------------------

    /// <summary>
    /// Overwrite the embedding for one product. The HNSW index
    /// reflects the change as soon as the <c>HSET</c> commits, so
    /// subsequent <c>FT.SEARCH</c> calls see the new vector without an
    /// index rebuild or serving downtime. The same call path is what
    /// an offline retraining pipeline would use to roll out a
    /// re-trained model.
    ///
    /// Throws <see cref="KeyNotFoundException"/> when the product key
    /// does not already exist — <c>HSET</c> would otherwise happily
    /// create a new key with only an <c>embedding</c> field, which the
    /// index would then pick up as a partially-populated document.
    /// Also rejects vectors with the wrong dimensionality so a model
    /// swap doesn't quietly corrupt the index.
    /// </summary>
    public void RefreshEmbedding(string productId, float[] newVector)
    {
        if (newVector is null) throw new ArgumentNullException(nameof(newVector));
        if (newVector.Length != VectorDim)
        {
            throw new ArgumentException(
                $"newVector has length {newVector.Length}; index expects {VectorDim}",
                nameof(newVector));
        }
        var key = ProductKey(productId);
        if (!Db.KeyExists(key))
        {
            throw new KeyNotFoundException($"unknown product {productId}");
        }
        Db.HashSet(key, "embedding", Embedder.FloatsToBytes(newVector));
    }

    // ------------------------------------------------------------------
    // Inspection
    // ------------------------------------------------------------------

    /// <summary>Subset of <c>FT.INFO</c> useful for the demo UI.</summary>
    public IndexStats IndexInfo()
    {
        try
        {
            var info = Db.FT().Info(IndexName);
            return new IndexStats(
                IndexName: IndexName,
                NumDocs: info.NumDocs,
                IndexingFailures: info.HashIndexingFailures,
                // NRedisStack exposes ``vector_index_sz_mb`` from
                // ``FT.INFO`` as VectorIndexSzMebibytes; the units
                // match the Python / Node.js / Go ports.
                VectorIndexSizeMB: info.VectorIndexSzMebibytes);
        }
        catch (RedisServerException)
        {
            return new IndexStats(IndexName, 0, 0, 0);
        }
    }

    /// <summary>
    /// Return every indexed product (metadata only, no vector), sorted
    /// by price. Used by the demo to show the full catalogue.
    /// </summary>
    public List<ProductSummary> ListProducts(int limit = 100)
    {
        var query = new Query("*")
            .ReturnFields(
                new FieldName("name", null),
                new FieldName("category", null),
                new FieldName("brand", null),
                new FieldName("price", null),
                new FieldName("rating", null),
                new FieldName("in_stock", null))
            .Limit(0, limit)
            .SetSortBy("price")
            .Dialect(2);
        var result = Db.FT().Search(IndexName, query);
        return result.Documents.Select(doc =>
        {
            var props = doc.GetProperties().ToDictionary(p => p.Key, p => (string?)p.Value);
            string Get(string key, string fallback = "")
                => props.TryGetValue(key, out var v) ? (v ?? fallback) : fallback;
            double GetD(string key)
                => double.TryParse(Get(key, "0"), NumberStyles.Float, CultureInfo.InvariantCulture, out var v)
                    ? v : 0.0;
            var bare = doc.Id.StartsWith(KeyPrefix, StringComparison.Ordinal)
                ? doc.Id.Substring(KeyPrefix.Length)
                : doc.Id;
            return new ProductSummary
            {
                Id = bare,
                Name = Get("name"),
                Category = Get("category"),
                Brand = Get("brand"),
                Price = GetD("price"),
                Rating = GetD("rating"),
                InStock = Get("in_stock", "false") == "true",
            };
        }).ToList();
    }

    /// <summary>Distinct category values, from the TAG index, for the UI.</summary>
    public List<string> ListCategories() => ListTagVals("category");

    /// <summary>Brand-field equivalent of <see cref="ListCategories"/>.</summary>
    public List<string> ListBrands() => ListTagVals("brand");

    private List<string> ListTagVals(string field)
    {
        try
        {
            var vals = Db.FT().TagVals(IndexName, field);
            return vals.Select(v => v.ToString()).OrderBy(v => v, StringComparer.Ordinal).ToList();
        }
        catch (RedisServerException)
        {
            return new List<string>();
        }
    }

    // ------------------------------------------------------------------
    // Internal helpers
    // ------------------------------------------------------------------

    internal static float[] BlendVectors(float[] query, float[]? session, double weight)
    {
        // A null session (or a length mismatch — e.g. a stale session
        // from a different-dim model still in the user features hash)
        // means no signal to blend; return the query unchanged.
        // GetUserFeatures already drops mismatched session vectors,
        // but the defensive check here keeps the blend safe even if a
        // caller wires its own session source.
        if (session is null || weight <= 0 || session.Length != query.Length) return query;
        if (weight > 1) weight = 1;
        var mixed = new float[query.Length];
        for (var i = 0; i < query.Length; i++)
        {
            mixed[i] = (float)((1 - weight) * query[i] + weight * session[i]);
        }
        return Embedder.Normalise(mixed);
    }

    internal static float[] EwmaBlend(float[] prev, float[] next, double alpha)
    {
        // Length mismatch shouldn't happen — both vectors come from
        // the same embedder — but bail out defensively rather than
        // throwing IndexOutOfRangeException.
        if (prev.Length != next.Length) return next;
        var mixed = new float[prev.Length];
        for (var i = 0; i < prev.Length; i++)
        {
            mixed[i] = (float)(alpha * next[i] + (1 - alpha) * prev[i]);
        }
        return Embedder.Normalise(mixed);
    }
}
