// Redis recommendation-engine demo server.
//
// Run this and visit http://localhost:8084 to drive a small product
// catalogue indexed by Redis Search. The UI lets you:
//
//   * Type a natural-language query, optionally with TAG / NUMERIC /
//     TEXT filters, and watch FT.SEARCH retrieve top-k candidates
//     with a KNN pre-filter in a single round trip.
//   * Click any product card to feed a "click" into the user session.
//     Each click writes a new exponentially weighted session vector
//     and bumps a per-category affinity counter in the user features
//     hash, both visible to the very next FT.SEARCH.
//   * Toggle session-blended retrieval and category-affinity re-ranking
//     independently to see what each layer contributes.
//   * Refresh a product's embedding live to demonstrate that the HNSW
//     index reflects the new vector on the next query, with no downtime.
//
// The server holds a single Embedder instance and reuses it for every
// query-embed step; ``catalog.json`` carries the item vectors
// pre-computed by ``BuildCatalog`` so startup stays fast.

using System.Diagnostics;
using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Web;
using StackExchange.Redis;

namespace RecommendationDemo;

public static class DemoServer
{
    private const string DemoUserId = "demo";

    public static int Run(string[] args)
    {
        // Use "localhost" so HttpListener matches both 127.0.0.1
        // and the loopback name in the Host header. Override with
        // ``--host`` (e.g. "+" for any binding on Windows).
        var host = "localhost";
        var port = 8084;
        var redisHost = "localhost";
        var redisPort = 6379;
        var indexName = "recommend:idx";
        var keyPrefix = "product:";
        string? catalogPath = null;
        var topK = 10;
        var resetOnStart = true;

        for (var i = 0; i < args.Length; i++)
        {
            switch (args[i])
            {
                case "--host" when i + 1 < args.Length: host = args[++i]; break;
                case "--port" when i + 1 < args.Length: port = int.Parse(args[++i]); break;
                case "--redis-host" when i + 1 < args.Length: redisHost = args[++i]; break;
                case "--redis-port" when i + 1 < args.Length: redisPort = int.Parse(args[++i]); break;
                case "--index-name" when i + 1 < args.Length: indexName = args[++i]; break;
                case "--key-prefix" when i + 1 < args.Length: keyPrefix = args[++i]; break;
                case "--catalog" when i + 1 < args.Length: catalogPath = args[++i]; break;
                case "--topk" when i + 1 < args.Length: topK = int.Parse(args[++i]); break;
                case "--no-reset": resetOnStart = false; break;
            }
        }

        catalogPath ??= Path.Combine(AppContext.BaseDirectory, "catalog.json");
        // The compiled binary lives under bin/Debug/net8.0/, so fall
        // back to the project directory if the binary-adjacent file
        // isn't there. That keeps ``dotnet run`` and a directly-invoked
        // executable both working.
        if (!File.Exists(catalogPath))
        {
            var alt = Path.Combine(Directory.GetCurrentDirectory(), "catalog.json");
            if (File.Exists(alt)) catalogPath = alt;
        }
        if (!File.Exists(catalogPath))
        {
            Console.Error.WriteLine($"Error: catalog file not found at {catalogPath}");
            Console.Error.WriteLine("Generate it first with: dotnet run -- build-catalog");
            return 1;
        }

        ConnectionMultiplexer mux;
        try
        {
            mux = ConnectionMultiplexer.Connect($"{redisHost}:{redisPort}");
            mux.GetDatabase().Ping();
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Error: cannot reach Redis at {redisHost}:{redisPort}: {ex.Message}");
            return 1;
        }

        var recommender = new Recommender(
            mux.GetDatabase(),
            indexName: indexName,
            keyPrefix: keyPrefix);

        Console.WriteLine("Loading embedding model...");
        using var embedder = new Embedder();

        var state = new DemoState(recommender, embedder, catalogPath, DemoUserId);

        if (resetOnStart)
        {
            Console.WriteLine(
                $"Dropping any existing index '{indexName}' and re-seeding from catalog.json (pass --no-reset to keep).");
            var seeded = state.SeedIndex();
            state.ResetUser();
            Console.WriteLine($"Indexed {seeded} products.");
        }
        else
        {
            recommender.CreateIndex();
        }

        var listener = new HttpListener();
        listener.Prefixes.Add($"http://{host}:{port}/");
        try
        {
            listener.Start();
        }
        catch (HttpListenerException ex)
        {
            Console.Error.WriteLine($"Error: cannot bind to http://{host}:{port}/ ({ex.Message})");
            return 1;
        }
        Console.WriteLine($"Redis recommendation engine demo listening on http://{host}:{port}");
        Console.WriteLine($"Using Redis at {redisHost}:{redisPort} with index '{indexName}'");

        var handler = new RequestHandler(state, topK);
        var cts = new CancellationTokenSource();
        Console.CancelKeyPress += (_, e) => { e.Cancel = true; cts.Cancel(); listener.Stop(); };

        // One thread-pool worker per request — HttpListener parks on
        // GetContextAsync, so we never burn a thread waiting.
        while (!cts.IsCancellationRequested)
        {
            HttpListenerContext ctx;
            try
            {
                ctx = listener.GetContext();
            }
            catch (HttpListenerException)
            {
                break; // listener.Stop() unblocks GetContext with this.
            }
            catch (InvalidOperationException)
            {
                break;
            }
            // Fire and forget — each request is short-lived and the
            // handler catches its own exceptions.
            _ = Task.Run(() => handler.Handle(ctx));
        }
        return 0;
    }
}

/// <summary>
/// Per-process state that's not in Redis: the recommender + embedder
/// + a small in-memory ring of recent clicks for display. Access is
/// guarded with a lock because every HTTP request runs on its own
/// ThreadPool worker.
/// </summary>
internal sealed class DemoState
{
    public Recommender Recommender { get; }
    public Embedder Embedder { get; }
    public string CatalogPath { get; }
    public string UserId { get; }

    private readonly object _lock = new();
    private readonly List<RecentClick> _recents = new();
    private string? _model;

    public DemoState(Recommender recommender, Embedder embedder, string catalogPath, string userId)
    {
        Recommender = recommender;
        Embedder = embedder;
        CatalogPath = catalogPath;
        UserId = userId;
    }

    public int SeedIndex()
    {
        Recommender.DropIndex(deleteDocuments: true);
        Recommender.CreateIndex();
        var file = BuildCatalog.Load(CatalogPath);
        lock (_lock) { _model = file.Model; }
        return Recommender.IndexProducts(file.Products);
    }

    public string ModelName()
    {
        lock (_lock)
        {
            if (!string.IsNullOrEmpty(_model)) return _model!;
        }
        try
        {
            var file = BuildCatalog.Load(CatalogPath);
            lock (_lock) { _model = file.Model; }
            return file.Model;
        }
        catch
        {
            return Embedder.ModelName;
        }
    }

    public void ResetUser()
    {
        Recommender.ResetUser(UserId);
        lock (_lock) { _recents.Clear(); }
    }

    public RecordClickResult RecordClick(string productId)
    {
        var result = Recommender.RecordClick(UserId, productId);
        var name = ProductName(productId);
        lock (_lock)
        {
            _recents.Insert(0, new RecentClick(productId, name));
            if (_recents.Count > 6) _recents.RemoveRange(6, _recents.Count - 6);
        }
        return result;
    }

    public List<RecentClick> RecentsSnapshot()
    {
        lock (_lock) { return new List<RecentClick>(_recents); }
    }

    public string ProductName(string productId)
    {
        var raw = Recommender.Db.HashGet(Recommender.ProductKey(productId), "name");
        return raw.IsNullOrEmpty ? productId : (string)raw!;
    }

    public UserStateJson UserStateView()
    {
        var uf = Recommender.GetUserFeatures(UserId);
        return new UserStateJson
        {
            Clicks = uf.Clicks,
            LastClickedId = uf.LastClickedId,
            LastClickedCategory = uf.LastClickedCategory,
            Affinities = uf.Affinities,
            HasSessionVec = uf.SessionVec != null,
            SessionVecDim = uf.SessionVec?.Length ?? 0,
            RecentClicks = RecentsSnapshot(),
        };
    }
}

internal sealed record RecentClick(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("name")] string Name);

internal sealed class UserStateJson
{
    [JsonPropertyName("clicks")] public int Clicks { get; set; }
    [JsonPropertyName("last_clicked_id")] public string? LastClickedId { get; set; }
    [JsonPropertyName("last_clicked_category")] public string? LastClickedCategory { get; set; }
    [JsonPropertyName("affinities")] public Dictionary<string, double> Affinities { get; set; } = new();
    [JsonPropertyName("has_session_vec")] public bool HasSessionVec { get; set; }
    [JsonPropertyName("session_vec_dim")] public int SessionVecDim { get; set; }
    [JsonPropertyName("recent_clicks")] public List<RecentClick> RecentClicks { get; set; } = new();
}

internal sealed class IndexStateJson
{
    [JsonPropertyName("index_name")] public string IndexName { get; set; } = "";
    [JsonPropertyName("num_docs")] public long NumDocs { get; set; }
    [JsonPropertyName("indexing_failures")] public long IndexingFailures { get; set; }
    [JsonPropertyName("vector_index_size_mb")] public double VectorIndexSizeMB { get; set; }
    [JsonPropertyName("model")] public string Model { get; set; } = "";
}

internal sealed class StateView
{
    [JsonPropertyName("user")] public UserStateJson User { get; set; } = new();
    [JsonPropertyName("index")] public IndexStateJson Index { get; set; } = new();
    [JsonPropertyName("products")] public List<ProductSummaryJson> Products { get; set; } = new();
    [JsonPropertyName("categories")] public List<string> Categories { get; set; } = new();
    [JsonPropertyName("brands")] public List<string> Brands { get; set; } = new();
}

internal sealed class ProductSummaryJson
{
    [JsonPropertyName("id")] public string Id { get; set; } = "";
    [JsonPropertyName("name")] public string Name { get; set; } = "";
    [JsonPropertyName("category")] public string Category { get; set; } = "";
    [JsonPropertyName("brand")] public string Brand { get; set; } = "";
    [JsonPropertyName("price")] public double Price { get; set; }
    [JsonPropertyName("rating")] public double Rating { get; set; }
    [JsonPropertyName("in_stock")] public bool InStock { get; set; }
}

internal sealed class CandidateJson
{
    [JsonPropertyName("id")] public string Id { get; set; } = "";
    [JsonPropertyName("name")] public string Name { get; set; } = "";
    [JsonPropertyName("description")] public string Description { get; set; } = "";
    [JsonPropertyName("category")] public string Category { get; set; } = "";
    [JsonPropertyName("brand")] public string Brand { get; set; } = "";
    [JsonPropertyName("price")] public double Price { get; set; }
    [JsonPropertyName("rating")] public double Rating { get; set; }
    [JsonPropertyName("in_stock")] public bool InStock { get; set; }
    [JsonPropertyName("vector_distance")] public double VectorDistance { get; set; }
    [JsonPropertyName("score")] public double Score { get; set; }
}

internal sealed class SearchResponseJson
{
    [JsonPropertyName("candidates")] public List<CandidateJson> Candidates { get; set; } = new();
    [JsonPropertyName("filter_clause")] public string FilterClause { get; set; } = "";
    [JsonPropertyName("used_session")] public bool UsedSession { get; set; }
    [JsonPropertyName("used_rerank")] public bool UsedRerank { get; set; }
    [JsonPropertyName("embed_ms")] public double EmbedMs { get; set; }
    [JsonPropertyName("search_ms")] public double SearchMs { get; set; }
    [JsonPropertyName("rerank_ms")] public double RerankMs { get; set; }
    [JsonPropertyName("timing_ms")] public double TimingMs { get; set; }
}

internal sealed class ClickResponseJson
{
    [JsonPropertyName("category")] public string Category { get; set; } = "";
    [JsonPropertyName("affinity")] public double Affinity { get; set; }
    [JsonPropertyName("clicks")] public int Clicks { get; set; }
    [JsonPropertyName("last_clicked_id")] public string LastClickedId { get; set; } = "";
    [JsonPropertyName("name")] public string Name { get; set; } = "";
    [JsonPropertyName("user")] public UserStateJson User { get; set; } = new();
}

internal sealed class RequestHandler
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
        DefaultIgnoreCondition = JsonIgnoreCondition.Never,
    };

    private readonly DemoState _state;
    private readonly int _defaultTopK;

    public RequestHandler(DemoState state, int defaultTopK)
    {
        _state = state;
        _defaultTopK = defaultTopK;
    }

    public void Handle(HttpListenerContext ctx)
    {
        try
        {
            var path = ctx.Request.Url?.AbsolutePath ?? "/";
            var method = ctx.Request.HttpMethod;
            if (method == "GET" && (path == "/" || path == "/index.html"))
            {
                SendHtml(ctx, DemoHtml.Render(
                    _state.Recommender.IndexName,
                    _state.Recommender.UserKey(_state.UserId),
                    _defaultTopK));
                return;
            }
            if (method == "GET" && path == "/state") { HandleState(ctx); return; }
            if (method == "POST" && path == "/search") { HandleSearch(ctx); return; }
            if (method == "POST" && path == "/click") { HandleClick(ctx); return; }
            if (method == "POST" && path == "/reset-user") { HandleResetUser(ctx); return; }
            if (method == "POST" && path == "/reset-index") { HandleResetIndex(ctx); return; }
            if (method == "POST" && path == "/refresh-embedding") { HandleRefreshEmbedding(ctx); return; }
            ctx.Response.StatusCode = 404;
            ctx.Response.OutputStream.Close();
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[demo] unhandled: {ex}");
            try { ctx.Response.StatusCode = 500; ctx.Response.OutputStream.Close(); } catch { }
        }
    }

    private void HandleState(HttpListenerContext ctx)
    {
        var info = _state.Recommender.IndexInfo();
        var products = _state.Recommender.ListProducts(limit: 200);
        SendJson(ctx, 200, new StateView
        {
            User = _state.UserStateView(),
            Index = new IndexStateJson
            {
                IndexName = info.IndexName,
                NumDocs = info.NumDocs,
                IndexingFailures = info.IndexingFailures,
                VectorIndexSizeMB = info.VectorIndexSizeMB,
                Model = _state.ModelName(),
            },
            Products = products.Select(p => new ProductSummaryJson
            {
                Id = p.Id,
                Name = p.Name,
                Category = p.Category,
                Brand = p.Brand,
                Price = p.Price,
                Rating = p.Rating,
                InStock = p.InStock,
            }).ToList(),
            Categories = _state.Recommender.ListCategories(),
            Brands = _state.Recommender.ListBrands(),
        });
    }

    private void HandleSearch(HttpListenerContext ctx)
    {
        var form = ReadForm(ctx);
        var queryText = (form["query"] ?? "").Trim();
        if (string.IsNullOrEmpty(queryText))
        {
            SendJson(ctx, 400, new { error = "query is required" });
            return;
        }

        var sw = Stopwatch.StartNew();
        var queryVec = _state.Embedder.EncodeOne(queryText);
        sw.Stop();
        var embedMs = sw.Elapsed.TotalMilliseconds;

        var useSession = !string.IsNullOrEmpty(form["use_session"]);
        var doRerank = !string.IsNullOrEmpty(form["rerank"]);
        var features = _state.Recommender.GetUserFeatures(_state.UserId);
        var sessionVec = useSession ? features.SessionVec : null;

        var k = ParseIntOrDefault(form, "k", _defaultTopK);
        k = Math.Max(1, Math.Min(40, k));

        var filter = new FilterOptions
        {
            Category = NullIfEmpty(form["category"]),
            Brand = NullIfEmpty(form["brand"]),
            MinPrice = ParseDoubleOrNull(form, "min_price"),
            MaxPrice = ParseDoubleOrNull(form, "max_price"),
            MinRating = ParseDoubleOrNull(form, "min_rating"),
            InStockOnly = !string.IsNullOrEmpty(form["in_stock_only"]),
            TextMatch = NullIfEmpty(form["text_match"]?.Trim()),
        };
        // Echo the actual filter clause back to the UI so the docs page
        // doesn't have to guess what the server built.
        var filterClause = Recommender.BuildFilterClause(filter);

        sw.Restart();
        var candidates = _state.Recommender.CandidateRetrieve(queryVec, new RetrieveOptions
        {
            Filter = filter,
            K = k,
            SessionVec = sessionVec,
            SessionWeight = 0.3,
        });
        sw.Stop();
        var searchMs = sw.Elapsed.TotalMilliseconds;

        sw.Restart();
        if (doRerank)
        {
            candidates = _state.Recommender.Rerank(candidates, features);
        }
        sw.Stop();
        var rerankMs = sw.Elapsed.TotalMilliseconds;

        SendJson(ctx, 200, new SearchResponseJson
        {
            Candidates = candidates.Select(c => new CandidateJson
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                Category = c.Category,
                Brand = c.Brand,
                Price = c.Price,
                Rating = c.Rating,
                InStock = c.InStock,
                VectorDistance = Round4(c.VectorDistance),
                Score = Round4(c.Score),
            }).ToList(),
            FilterClause = filterClause,
            UsedSession = sessionVec != null,
            UsedRerank = doRerank && features.Affinities.Count > 0,
            EmbedMs = embedMs,
            SearchMs = searchMs,
            RerankMs = rerankMs,
            TimingMs = embedMs + searchMs + rerankMs,
        });
    }

    private void HandleClick(HttpListenerContext ctx)
    {
        var form = ReadForm(ctx);
        var productId = (form["product_id"] ?? "").Trim();
        if (string.IsNullOrEmpty(productId))
        {
            SendJson(ctx, 400, new { error = "product_id is required" });
            return;
        }
        try
        {
            var result = _state.RecordClick(productId);
            SendJson(ctx, 200, new ClickResponseJson
            {
                Category = result.Category,
                Affinity = result.Affinity,
                Clicks = result.Clicks,
                LastClickedId = result.LastClickedId,
                Name = _state.ProductName(productId),
                User = _state.UserStateView(),
            });
        }
        catch (KeyNotFoundException)
        {
            SendJson(ctx, 404, new { error = $"unknown product {productId}" });
        }
    }

    private void HandleResetUser(HttpListenerContext ctx)
    {
        _state.ResetUser();
        SendJson(ctx, 200, new { ok = true });
    }

    private void HandleResetIndex(HttpListenerContext ctx)
    {
        var seeded = _state.SeedIndex();
        _state.ResetUser();
        SendJson(ctx, 200, new { seeded });
    }

    private void HandleRefreshEmbedding(HttpListenerContext ctx)
    {
        var form = ReadForm(ctx);
        var productId = (form["product_id"] ?? "").Trim();
        var text = (form["text"] ?? "").Trim();
        if (string.IsNullOrEmpty(productId) || string.IsNullOrEmpty(text))
        {
            SendJson(ctx, 400, new { error = "product_id and text are required" });
            return;
        }
        var sw = Stopwatch.StartNew();
        var vec = _state.Embedder.EncodeOne(text);
        sw.Stop();
        var embedMs = sw.Elapsed.TotalMilliseconds;
        try
        {
            _state.Recommender.RefreshEmbedding(productId, vec);
        }
        catch (KeyNotFoundException)
        {
            SendJson(ctx, 404, new { error = $"unknown product {productId}" });
            return;
        }
        catch (ArgumentException ex)
        {
            SendJson(ctx, 400, new { error = ex.Message });
            return;
        }
        SendJson(ctx, 200, new
        {
            product_id = productId,
            embed_ms = embedMs,
        });
    }

    // -------- HTTP helpers ------------------------------------------------

    private static System.Collections.Specialized.NameValueCollection ReadForm(HttpListenerContext ctx)
    {
        using var reader = new StreamReader(ctx.Request.InputStream, ctx.Request.ContentEncoding);
        var body = reader.ReadToEnd();
        return HttpUtility.ParseQueryString(body);
    }

    private static int ParseIntOrDefault(System.Collections.Specialized.NameValueCollection form, string key, int def)
    {
        var raw = form[key];
        if (string.IsNullOrWhiteSpace(raw)) return def;
        return int.TryParse(raw, out var v) ? v : def;
    }

    private static double? ParseDoubleOrNull(System.Collections.Specialized.NameValueCollection form, string key)
    {
        var raw = form[key];
        if (string.IsNullOrWhiteSpace(raw)) return null;
        return double.TryParse(raw, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out var v)
            ? v : (double?)null;
    }

    private static string? NullIfEmpty(string? value)
        => string.IsNullOrEmpty(value) ? null : value;

    private static double Round4(double v) => Math.Round(v, 4);

    private static void SendJson(HttpListenerContext ctx, int status, object body)
    {
        ctx.Response.StatusCode = status;
        ctx.Response.ContentType = "application/json";
        var json = JsonSerializer.Serialize(body, JsonOpts);
        var bytes = Encoding.UTF8.GetBytes(json);
        ctx.Response.ContentLength64 = bytes.Length;
        ctx.Response.OutputStream.Write(bytes, 0, bytes.Length);
        ctx.Response.OutputStream.Close();
    }

    private static void SendHtml(HttpListenerContext ctx, string html)
    {
        ctx.Response.StatusCode = 200;
        ctx.Response.ContentType = "text/html; charset=utf-8";
        var bytes = Encoding.UTF8.GetBytes(html);
        ctx.Response.ContentLength64 = bytes.Length;
        ctx.Response.OutputStream.Write(bytes, 0, bytes.Length);
        ctx.Response.OutputStream.Close();
    }
}
