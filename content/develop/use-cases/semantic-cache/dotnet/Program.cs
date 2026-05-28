using System.Diagnostics;
using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Web;
using StackExchange.Redis;

namespace SemanticCacheDemo;

/// <summary>
/// Redis semantic-cache demo server (.NET 8 + NRedisStack + ONNX
/// Runtime).
/// </summary>
/// <remarks>
/// <para>Run this and visit <c>http://localhost:8092</c> to drive a
/// small semantic-cache demo backed by Redis Search. The UI lets you
/// type a natural-language prompt and watch the cache decide hit or
/// miss; on a hit Redis returns the cached response in tens of
/// milliseconds and the demo LLM is not called at all, while on a
/// miss the demo LLM "thinks" for ~1.5 s before answering and the
/// new prompt, response, and embedding are written back to Redis
/// for next time.</para>
///
/// <para>The server holds a single <see cref="LocalEmbedder"/>, a
/// single <see cref="RedisSemanticCache"/>, and a single
/// <see cref="MockLLM"/> for the lifetime of the process. The first
/// run downloads the embedding model into <c>./model_cache</c>;
/// everything after is local.</para>
/// </remarks>
public static class Program
{
    private const string StackLabel =
        "NRedisStack + ONNX Runtime + .NET HttpListener";

    // 1 MiB cap on POST bodies so a runaway client (or a `curl
    // --data-binary @big-file` by mistake) can't accumulate
    // unbounded memory before the handler runs. The demo's largest
    // legitimate body is a few hundred bytes of form-encoded query
    // fields; 1 MiB is a generous ceiling and matches the Node and
    // Go demos' caps.
    private const int MaxBodyBytes = 1 * 1024 * 1024;

    public static int Main(string[] argv)
    {
        // The cache stores embeddings as raw little-endian float32
        // bytes; the wire format is fixed regardless of host
        // endianness. The packer in LocalEmbedder writes little-endian
        // explicitly via BinaryPrimitives, so a hypothetical
        // big-endian .NET host would still produce the correct
        // bytes — but every supported runtime today is little-endian
        // and a surprise here would silently corrupt every vector
        // we write, so assert it loudly at startup.
        Debug.Assert(BitConverter.IsLittleEndian,
            "this demo assumes a little-endian host");

        Args args;
        try
        {
            args = Args.Parse(argv);
        }
        catch (ArgumentException ex)
        {
            Console.Error.WriteLine($"Error: {ex.Message}");
            PrintHelp();
            return 2;
        }

        ConnectionMultiplexer mux;
        try
        {
            mux = ConnectionMultiplexer.Connect(new ConfigurationOptions
            {
                EndPoints = { { args.RedisHost, args.RedisPort } },
                AbortOnConnectFail = false,
                ConnectTimeout = 2000,
                SyncTimeout = 5000,
            });
            var pingDb = mux.GetDatabase();
            pingDb.Ping();
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine(
                $"Error: cannot reach Redis at {args.RedisHost}:{args.RedisPort}");
            Console.Error.WriteLine($"  ({ex.Message})");
            return 1;
        }

        var db = mux.GetDatabase();
        var cache = new RedisSemanticCache(
            db,
            indexName: args.IndexName,
            keyPrefix: args.KeyPrefix,
            distanceThreshold: args.Threshold,
            defaultTtlSeconds: args.TtlSeconds);
        cache.CreateIndex();

        Console.WriteLine(
            "Loading embedding model (first run downloads ~90 MB of ONNX weights)...");
        LocalEmbedder embedder;
        try
        {
            embedder = LocalEmbedder.CreateAsync().GetAwaiter().GetResult();
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Error loading embedder: {ex.Message}");
            return 1;
        }
        var llm = new MockLLM(latencyMs: args.LlmLatencyMs);
        var demo = new SemanticCacheDemo(cache, embedder, llm);

        if (args.ResetOnStart)
        {
            Console.WriteLine(
                $"Dropping any existing cache under '{args.KeyPrefix}*' and " +
                "re-seeding from the FAQ list (pass --no-reset to keep).");
            int seeded = demo.Seed();
            Console.WriteLine($"Seeded {seeded} entries.");
        }

        // Load index.html once and substitute the template tokens so
        // the docs panel shows the actual values in use rather than
        // the default copies. The file ships next to the binary via
        // the <None CopyToOutputDirectory> entry in the .csproj.
        string htmlPath = Path.Combine(AppContext.BaseDirectory, "index.html");
        if (!File.Exists(htmlPath))
        {
            Console.Error.WriteLine(
                $"index.html not found next to the binary at {htmlPath}.");
            return 1;
        }
        string rawHtml = File.ReadAllText(htmlPath);
        string htmlPage = rawHtml
            .Replace("__INDEX_NAME__", args.IndexName)
            .Replace("__KEY_PREFIX__", args.KeyPrefix);

        var listener = new HttpListener();
        // HttpListener prefixes need a trailing slash; '+' wildcard
        // would require admin rights on macOS/Linux, so we bind to
        // the literal host string. Use 127.0.0.1 to keep the demo
        // off the network by default, matching the other demos.
        string prefix = $"http://{args.Host}:{args.Port}/";
        listener.Prefixes.Add(prefix);
        try
        {
            listener.Start();
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Failed to bind {prefix}: {ex.Message}");
            return 1;
        }

        Console.WriteLine(
            $"Redis semantic cache demo listening on http://{args.Host}:{args.Port}");
        Console.WriteLine(
            $"Using Redis at {args.RedisHost}:{args.RedisPort} with index '{args.IndexName}'");

        var cts = new CancellationTokenSource();
        Console.CancelKeyPress += (_, e) =>
        {
            e.Cancel = true;
            Console.WriteLine("\nShutting down...");
            cts.Cancel();
            try { listener.Stop(); } catch { /* best-effort */ }
        };

        // One handler thread per request out of the ThreadPool. The
        // ONNX session, the Redis multiplexer, and the cache are all
        // thread-safe; nothing else here needs serialising beyond
        // the seed/reset path's lock.
        while (!cts.IsCancellationRequested)
        {
            HttpListenerContext ctx;
            try
            {
                ctx = listener.GetContext();
            }
            catch (HttpListenerException) { break; }
            catch (ObjectDisposedException) { break; }
            ThreadPool.QueueUserWorkItem(_ =>
            {
                try
                {
                    HandleRequest(ctx, cache, embedder, llm, demo, htmlPage);
                }
                catch (Exception ex)
                {
                    Console.Error.WriteLine(
                        $"[demo] handler error: {ex.GetType().Name}: {ex.Message}");
                    TrySendError(ctx, ex);
                }
            });
        }

        try { listener.Close(); } catch { /* best-effort */ }
        embedder.Dispose();
        mux.Dispose();
        return 0;
    }

    // ------------------------------------------------------------------
    // HTTP request handling
    // ------------------------------------------------------------------

    private static void HandleRequest(
        HttpListenerContext ctx,
        RedisSemanticCache cache,
        LocalEmbedder embedder,
        MockLLM llm,
        SemanticCacheDemo demo,
        string htmlPage)
    {
        var req = ctx.Request;
        string path = req.Url?.AbsolutePath ?? "/";

        if (string.Equals(req.HttpMethod, "GET", StringComparison.OrdinalIgnoreCase))
        {
            switch (path)
            {
                case "/":
                case "/index.html":
                    SendHtml(ctx, 200, htmlPage);
                    return;
                case "/state":
                    SendJson(ctx, 200, BuildState(cache, embedder, llm));
                    return;
                default:
                    SendJson(ctx, 404, ErrorPayload("not found", null));
                    return;
            }
        }

        if (string.Equals(req.HttpMethod, "POST", StringComparison.OrdinalIgnoreCase))
        {
            // Reject oversized bodies before reading them. The
            // Content-Length header isn't authoritative — a client
            // could lie or stream — so we also bound the read below.
            if (req.ContentLength64 > MaxBodyBytes)
            {
                SendJson(ctx, 413, ErrorPayload(
                    $"request body exceeds {MaxBodyBytes} bytes", null));
                return;
            }
            string body;
            try
            {
                body = ReadBodyCapped(req, MaxBodyBytes);
            }
            catch (BodyTooLargeException ex)
            {
                // A client without an honest Content-Length header
                // (chunked, or just lying) still gets a clean 413
                // here rather than falling through to the generic
                // exception handler that would respond 500.
                SendJson(ctx, 413, ErrorPayload(ex.Message, null));
                return;
            }
            var form = ParseForm(body);

            switch (path)
            {
                case "/query":
                    HandleQuery(ctx, form, demo, llm);
                    return;
                case "/reset":
                    demo.Seed();
                    SendJson(ctx, 200, new JsonObject { ["ok"] = true });
                    return;
                case "/drop":
                    HandleDrop(ctx, form, cache);
                    return;
                default:
                    SendJson(ctx, 404, ErrorPayload("not found", null));
                    return;
            }
        }

        SendJson(ctx, 405, ErrorPayload("method not allowed", null));
    }

    private static void HandleQuery(
        HttpListenerContext ctx,
        Dictionary<string, string> form,
        SemanticCacheDemo demo,
        MockLLM llm)
    {
        string prompt = (form.GetValueOrDefault("prompt") ?? "").Trim();
        if (string.IsNullOrEmpty(prompt))
        {
            SendJson(ctx, 400, ErrorPayload("prompt is required", null));
            return;
        }

        double threshold = ClampThreshold(form.GetValueOrDefault("threshold"));
        bool lookupOnly = !string.IsNullOrEmpty(form.GetValueOrDefault("lookup_only"));
        string tenant = NonEmpty(form.GetValueOrDefault("tenant"), "acme");
        string locale = NonEmpty(form.GetValueOrDefault("locale"), "en");
        string modelVersion = NonEmpty(form.GetValueOrDefault("model_version"), llm.ModelVersion);

        var payload = demo.RunQuery(
            prompt, tenant, locale, modelVersion, threshold, lookupOnly);
        SendJson(ctx, 200, payload);
    }

    private static void HandleDrop(
        HttpListenerContext ctx,
        Dictionary<string, string> form,
        RedisSemanticCache cache)
    {
        string entryId = (form.GetValueOrDefault("entry_id") ?? "").Trim();
        if (string.IsNullOrEmpty(entryId))
        {
            SendJson(ctx, 400, ErrorPayload("entry_id is required", null));
            return;
        }
        bool deleted = cache.DeleteEntry(entryId);
        SendJson(ctx, 200, new JsonObject
        {
            ["deleted"] = deleted,
            ["entry_id"] = entryId,
        });
    }

    // ------------------------------------------------------------------
    // State assembly
    // ------------------------------------------------------------------

    private static JsonObject BuildState(
        RedisSemanticCache cache, LocalEmbedder embedder, MockLLM llm)
    {
        var info = cache.IndexInfo();
        var entries = cache.ListEntries(200);
        var index = new JsonObject
        {
            ["num_docs"] = info.NumDocs,
            ["indexing_failures"] = info.IndexingFailures,
            ["vector_index_size_mb"] = info.VectorIndexSizeMb,
            ["index_name"] = cache.IndexName,
            ["model"] = embedder.ModelName,
            ["mock_llm_latency_ms"] = llm.LatencyMs,
            // default_threshold lets the --threshold flag actually
            // reach the UI slider on first load. stack_label lets the
            // same HTML render a per-language badge without forking
            // the file per language.
            ["default_threshold"] = cache.DistanceThreshold,
            ["stack_label"] = StackLabel,
        };
        var entriesJson = new JsonArray();
        foreach (var e in entries)
        {
            entriesJson.Add(new JsonObject
            {
                ["id"] = e.Id,
                ["prompt"] = e.Prompt,
                ["response"] = e.Response,
                ["tenant"] = e.Tenant,
                ["locale"] = e.Locale,
                ["model_version"] = e.ModelVersion,
                ["safety"] = e.Safety,
                ["hit_count"] = e.HitCount,
                ["ttl_seconds"] = e.TtlSeconds,
                ["created_ts"] = e.CreatedTs,
            });
        }
        return new JsonObject
        {
            ["index"] = index,
            ["entries"] = entriesJson,
        };
    }

    // ------------------------------------------------------------------
    // HTTP plumbing
    // ------------------------------------------------------------------

    private static void SendHtml(HttpListenerContext ctx, int status, string html)
    {
        byte[] bytes = Encoding.UTF8.GetBytes(html);
        ctx.Response.StatusCode = status;
        ctx.Response.ContentType = "text/html; charset=utf-8";
        ctx.Response.ContentLength64 = bytes.Length;
        using var os = ctx.Response.OutputStream;
        os.Write(bytes, 0, bytes.Length);
    }

    private static void SendJson(HttpListenerContext ctx, int status, JsonNode body)
    {
        byte[] bytes = Encoding.UTF8.GetBytes(body.ToJsonString());
        ctx.Response.StatusCode = status;
        ctx.Response.ContentType = "application/json";
        ctx.Response.ContentLength64 = bytes.Length;
        using var os = ctx.Response.OutputStream;
        os.Write(bytes, 0, bytes.Length);
    }

    private static void TrySendError(HttpListenerContext ctx, Exception ex)
    {
        // The headers may already be partially flushed; nothing
        // useful left to do beyond letting the connection drop.
        try
        {
            SendJson(ctx, 500, ErrorPayload(ex.Message, ex.GetType().Name));
        }
        catch
        {
            try { ctx.Response.Abort(); } catch { /* best-effort */ }
        }
    }

    private static JsonObject ErrorPayload(string message, string? type)
    {
        var o = new JsonObject { ["error"] = message };
        if (type is not null) o["type"] = type;
        return o;
    }

    /// <summary>
    /// Signals that a streamed POST body exceeded the cap before the
    /// final byte arrived. Used so the dispatch loop can return a
    /// clean 413 instead of letting a generic exception escape to
    /// the JSON-500 fallback.
    /// </summary>
    private sealed class BodyTooLargeException : Exception
    {
        public BodyTooLargeException(string message) : base(message) { }
    }

    private static string ReadBodyCapped(HttpListenerRequest req, int maxBytes)
    {
        // Read up to maxBytes + 1 so we can distinguish "exactly at
        // the limit" from "too large". HttpListener gives us a
        // forward-only stream; the Content-Length-based shortcut
        // isn't safe because a malicious client can lie.
        using var input = req.InputStream;
        var ms = new MemoryStream();
        var buf = new byte[8192];
        int total = 0;
        while (true)
        {
            int read = input.Read(buf, 0, buf.Length);
            if (read <= 0) break;
            total += read;
            if (total > maxBytes)
            {
                throw new BodyTooLargeException(
                    $"request body exceeds {maxBytes} bytes");
            }
            ms.Write(buf, 0, read);
        }
        return Encoding.UTF8.GetString(ms.ToArray());
    }

    private static Dictionary<string, string> ParseForm(string body)
    {
        var d = new Dictionary<string, string>(StringComparer.Ordinal);
        if (string.IsNullOrEmpty(body)) return d;
        foreach (var pair in body.Split('&'))
        {
            if (pair.Length == 0) continue;
            int eq = pair.IndexOf('=');
            string key, value;
            if (eq < 0)
            {
                key = HttpUtility.UrlDecode(pair);
                value = "";
            }
            else
            {
                key = HttpUtility.UrlDecode(pair.Substring(0, eq));
                value = HttpUtility.UrlDecode(pair.Substring(eq + 1));
            }
            d[key] = value;
        }
        return d;
    }

    private static string NonEmpty(string? value, string fallback)
        => string.IsNullOrEmpty(value) ? fallback : value!;

    /// <summary>
    /// Sanitise the threshold parameter from the form body. Clamps
    /// NaN/Infinity to 0.5 and otherwise clamps to [0.0, 2.0].
    /// <see cref="double.TryParse(string, out double)"/> happily
    /// handles "nan" → NaN and "inf" → +∞. Either would silently
    /// turn the lookup into a permanent hit (<c>NaN</c> comparisons
    /// are always false, so <c>distance &gt; nan</c> cannot reject)
    /// or a permanent miss; clamping to the meaningful
    /// cosine-distance range stops a malformed POST from overriding
    /// the threshold semantics.
    /// </summary>
    internal static double ClampThreshold(string? raw)
    {
        double parsed = 0.5;
        if (!string.IsNullOrEmpty(raw))
        {
            if (!double.TryParse(raw, System.Globalization.NumberStyles.Float,
                System.Globalization.CultureInfo.InvariantCulture, out parsed))
            {
                parsed = 0.5;
            }
        }
        if (!double.IsFinite(parsed)) return 0.5;
        if (parsed < 0.0) return 0.0;
        if (parsed > 2.0) return 2.0;
        return parsed;
    }

    // ------------------------------------------------------------------
    // CLI parsing
    // ------------------------------------------------------------------

    public sealed class Args
    {
        public string Host { get; set; } = "127.0.0.1";
        public int Port { get; set; } = 8092;
        public string RedisHost { get; set; } = "localhost";
        public int RedisPort { get; set; } = 6379;
        public string IndexName { get; set; } = "semcache:idx";
        public string KeyPrefix { get; set; } = "cache:";
        public long TtlSeconds { get; set; } = 3600;
        public double Threshold { get; set; } = 0.5;
        public double LlmLatencyMs { get; set; } = 1500.0;
        public bool ResetOnStart { get; set; } = true;

        public static Args Parse(string[] argv)
        {
            var a = new Args();
            for (int i = 0; i < argv.Length; i++)
            {
                string flag = argv[i];
                switch (flag)
                {
                    case "--host":
                        a.Host = RequireValue(argv, ++i, flag);
                        break;
                    case "--port":
                        a.Port = int.Parse(RequireValue(argv, ++i, flag),
                            System.Globalization.CultureInfo.InvariantCulture);
                        break;
                    case "--redis-host":
                        a.RedisHost = RequireValue(argv, ++i, flag);
                        break;
                    case "--redis-port":
                        a.RedisPort = int.Parse(RequireValue(argv, ++i, flag),
                            System.Globalization.CultureInfo.InvariantCulture);
                        break;
                    case "--index-name":
                        a.IndexName = RequireValue(argv, ++i, flag);
                        break;
                    case "--key-prefix":
                        a.KeyPrefix = RequireValue(argv, ++i, flag);
                        break;
                    case "--ttl-seconds":
                        a.TtlSeconds = long.Parse(RequireValue(argv, ++i, flag),
                            System.Globalization.CultureInfo.InvariantCulture);
                        break;
                    case "--threshold":
                        a.Threshold = double.Parse(RequireValue(argv, ++i, flag),
                            System.Globalization.NumberStyles.Float,
                            System.Globalization.CultureInfo.InvariantCulture);
                        break;
                    case "--llm-latency-ms":
                        a.LlmLatencyMs = double.Parse(RequireValue(argv, ++i, flag),
                            System.Globalization.NumberStyles.Float,
                            System.Globalization.CultureInfo.InvariantCulture);
                        break;
                    case "--no-reset":
                        a.ResetOnStart = false;
                        break;
                    case "-h":
                    case "--help":
                        PrintHelp();
                        Environment.Exit(0);
                        break;
                    default:
                        throw new ArgumentException($"Unknown flag: {flag}");
                }
            }
            return a;
        }

        private static string RequireValue(string[] argv, int i, string flag)
        {
            if (i >= argv.Length)
                throw new ArgumentException($"Missing value for {flag}");
            return argv[i];
        }
    }

    private static void PrintHelp()
    {
        Console.WriteLine("Usage: dotnet SemanticCacheDemo.dll [options]");
        Console.WriteLine("  --host HOST            HTTP bind host (default 127.0.0.1)");
        Console.WriteLine("  --port PORT            HTTP bind port (default 8092)");
        Console.WriteLine("  --redis-host HOST      Redis host (default localhost)");
        Console.WriteLine("  --redis-port PORT      Redis port (default 6379)");
        Console.WriteLine("  --index-name NAME      Redis Search index name (default semcache:idx)");
        Console.WriteLine("  --key-prefix PREFIX    Hash key prefix (default cache:)");
        Console.WriteLine("  --ttl-seconds N        TTL for cache entries (default 3600)");
        Console.WriteLine("  --threshold F          Default cosine-distance cutoff (default 0.5)");
        Console.WriteLine("  --llm-latency-ms F     Mock LLM latency (default 1500.0)");
        Console.WriteLine("  --no-reset             Keep existing cache instead of re-seeding");
    }
}

/// <summary>
/// Demo state: cache management, mock LLM, and cumulative seeding.
/// </summary>
public sealed class SemanticCacheDemo
{
    private readonly RedisSemanticCache _cache;
    private readonly LocalEmbedder _embedder;
    private readonly MockLLM _llm;
    private readonly object _seedLock = new();
    public string DefaultTenant { get; }
    public string DefaultLocale { get; }

    public SemanticCacheDemo(
        RedisSemanticCache cache, LocalEmbedder embedder, MockLLM llm,
        string defaultTenant = "acme", string defaultLocale = "en")
    {
        _cache = cache;
        _embedder = embedder;
        _llm = llm;
        DefaultTenant = defaultTenant;
        DefaultLocale = defaultLocale;
    }

    /// <summary>Drop everything in scope and pre-populate with FAQ entries.</summary>
    public int Seed()
    {
        // Two clients hitting /reset back-to-back would otherwise
        // race on the drop/create/seed sequence and leave the index
        // in an inconsistent state.
        lock (_seedLock)
        {
            _cache.Clear();
            return SeedCache.Seed(
                _cache, _embedder,
                tenant: DefaultTenant,
                locale: DefaultLocale,
                modelVersion: _llm.ModelVersion);
        }
    }

    /// <summary>
    /// The hot path: embed, look up, optionally call the LLM, cache.
    /// </summary>
    /// <remarks>
    /// Timings are taken with <see cref="Stopwatch"/> around each
    /// bounded step so the UI can display the embed / lookup / LLM
    /// breakdown separately. The cache write on a miss is <em>not</em>
    /// included in <c>total_ms</c> so the latency number reflects
    /// the user-facing wait, not the background bookkeeping.
    /// </remarks>
    public JsonObject RunQuery(
        string prompt, string tenant, string locale, string modelVersion,
        double threshold, bool lookupOnly)
    {
        var sw = Stopwatch.StartNew();
        float[] queryVec = _embedder.EncodeOne(prompt);
        double embedMs = sw.Elapsed.TotalMilliseconds;
        sw.Restart();
        var result = _cache.Lookup(
            queryVec,
            tenant: tenant, locale: locale,
            modelVersion: modelVersion, safety: "ok",
            distanceThreshold: threshold);
        double lookupMs = sw.Elapsed.TotalMilliseconds;

        if (result is CacheHit hit)
        {
            return new JsonObject
            {
                ["outcome"] = "hit",
                ["response"] = hit.Response,
                ["entry_id"] = hit.Id,
                ["distance"] = hit.Distance,
                ["ttl_seconds"] = hit.TtlSeconds,
                ["hit_count"] = hit.HitCount,
                ["threshold"] = threshold,
                ["embed_ms"] = embedMs,
                ["lookup_ms"] = lookupMs,
                ["llm_ms"] = null,
                ["total_ms"] = embedMs + lookupMs,
                ["tokens_avoided"] = EstimateResponseTokens(hit.Prompt, hit.Response),
                ["ms_avoided"] = _llm.LatencyMs,
            };
        }

        var miss = (CacheMiss)result;

        // Miss path. In "lookup only" mode the demo reports the miss
        // without actually calling the LLM — useful for sweeping the
        // threshold against a fixed prompt to see where the cutoff
        // would fall without polluting the cache.
        if (lookupOnly)
        {
            return new JsonObject
            {
                ["outcome"] = "miss",
                ["response"] = "(LLM not called in lookup-only mode)",
                ["nearest_distance"] = miss.NearestDistance,
                ["threshold"] = threshold,
                ["wrote_entry_id"] = null,
                ["embed_ms"] = embedMs,
                ["lookup_ms"] = lookupMs,
                ["llm_ms"] = null,
                ["total_ms"] = embedMs + lookupMs,
            };
        }

        sw.Restart();
        var llmResponse = _llm.Complete(prompt);
        double llmMs = sw.Elapsed.TotalMilliseconds;

        // Write the new entry back. The embedding is the same vector
        // we already used for the lookup — no need to re-encode.
        string entryId = _cache.Put(
            prompt: prompt,
            response: llmResponse.Text,
            embedding: queryVec,
            tenant: tenant, locale: locale, modelVersion: modelVersion);

        return new JsonObject
        {
            ["outcome"] = "miss",
            ["response"] = llmResponse.Text,
            ["nearest_distance"] = miss.NearestDistance,
            ["threshold"] = threshold,
            ["wrote_entry_id"] = entryId,
            ["embed_ms"] = embedMs,
            ["lookup_ms"] = lookupMs,
            ["llm_ms"] = llmMs,
            ["total_ms"] = embedMs + lookupMs + llmMs,
        };
    }

    private static int EstimateResponseTokens(string prompt, string response)
    {
        int len = (prompt?.Length ?? 0) + (response?.Length ?? 0);
        return Math.Max(1, len / 4);
    }
}
