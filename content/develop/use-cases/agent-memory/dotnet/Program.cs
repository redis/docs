using System.Diagnostics;
using System.Globalization;
using System.Net;
using System.Text;
using System.Text.Json;
using System.Web;
using StackExchange.Redis;

namespace AgentMemoryDemo;

/// <summary>
/// Redis agent-memory demo server (.NET 8 + NRedisStack + ONNX
/// Runtime).
/// </summary>
/// <remarks>
/// <para>Run this and visit <c>http://localhost:8093</c> to drive a
/// small agent-memory demo backed by Redis Hashes, JSON, Search, and
/// Streams. The UI lets you type a turn, watch working memory update,
/// see semantically similar long-term memories recalled, watch the
/// write-time deduplication skip near-duplicates, and inspect the
/// per-thread event log.</para>
///
/// <para>The server holds a single <see cref="LocalEmbedder"/>, one
/// <see cref="AgentSession"/>, one <see cref="LongTermMemory"/>, and
/// one <see cref="AgentEventLog"/> for the lifetime of the process.
/// The first run downloads the embedding model into
/// <c>./model_cache</c>; everything after is local.</para>
/// </remarks>
public static class Program
{
    private const string StackLabel =
        "NRedisStack + ONNX Runtime + .NET HttpListener";

    // 1 MiB cap on POST bodies so a runaway client (or a `curl
    // --data-binary @big-file` by mistake) can't accumulate
    // unbounded memory before the handler runs. The demo's largest
    // legitimate body is a few hundred bytes of form-encoded query
    // fields; 1 MiB is a generous ceiling.
    private const int MaxBodyBytes = 1 * 1024 * 1024;

    public static int Main(string[] argv)
    {
        // The embedding is stored inside JSON documents as a JSON
        // array — host endianness doesn't matter there — but the
        // *query* vector is sent to Redis as raw little-endian
        // float32 bytes via the $vec param. The packer in
        // LocalEmbedder writes little-endian explicitly through
        // BinaryPrimitives, so a hypothetical big-endian .NET host
        // would still produce the correct bytes; every supported
        // runtime today is little-endian and a surprise here would
        // silently corrupt every recall query, so assert it loudly
        // at startup.
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
            mux.GetDatabase().Ping();
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine(
                $"Error: cannot reach Redis at {args.RedisHost}:{args.RedisPort}");
            Console.Error.WriteLine($"  ({ex.Message})");
            return 1;
        }

        var db = mux.GetDatabase();
        var session = new AgentSession(
            db,
            keyPrefix: args.SessionKeyPrefix,
            defaultTtlSeconds: args.SessionTtlSeconds);
        var memory = new LongTermMemory(
            db,
            indexName: args.MemIndexName,
            keyPrefix: args.MemKeyPrefix,
            dedupThreshold: args.DedupThreshold,
            recallThreshold: args.RecallThreshold);
        memory.CreateIndex();
        var events = new AgentEventLog(db, keyPrefix: args.EventKeyPrefix);

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

        var demo = new AgentMemoryDemo(session, memory, events, embedder);

        if (args.ResetOnStart)
        {
            Console.WriteLine(
                $"Dropping any existing memories under '{args.MemKeyPrefix}*' and " +
                "re-seeding from the sample memory list (pass --no-reset to keep).");
            int seeded = demo.SeedAll("default", "default");
            Console.WriteLine($"Seeded {seeded} memories.");
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
            .Replace("__SESSION_PREFIX__", args.SessionKeyPrefix)
            .Replace("__MEM_PREFIX__", args.MemKeyPrefix)
            .Replace("__MEM_INDEX__", args.MemIndexName)
            .Replace("__EVENT_PREFIX__", args.EventKeyPrefix);

        var listener = new HttpListener();
        // HttpListener prefixes need a trailing slash; '+' wildcard
        // would require admin rights on macOS/Linux, so we bind to
        // the literal host string. 127.0.0.1 keeps the demo off the
        // network by default.
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
            $"Redis agent memory demo listening on http://{args.Host}:{args.Port}");
        Console.WriteLine(
            $"Using Redis at {args.RedisHost}:{args.RedisPort}"
            + $" with memory index '{args.MemIndexName}'");

        var cts = new CancellationTokenSource();
        Console.CancelKeyPress += (_, e) =>
        {
            e.Cancel = true;
            Console.WriteLine("\nShutting down...");
            cts.Cancel();
            try { listener.Stop(); } catch { /* best-effort */ }
        };

        // One handler thread per request out of the ThreadPool. The
        // ONNX session, the Redis multiplexer, the session helper,
        // the memory helper, and the event log are all thread-safe;
        // ``currentThreadId`` on the demo is mutable shared state
        // but reads and writes race only in the corner case the
        // walkthrough's Concurrency caveats section documents.
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
                    HandleRequest(ctx, demo, session, memory, events, embedder, htmlPage);
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
    // Request dispatch
    // ------------------------------------------------------------------

    private static void HandleRequest(
        HttpListenerContext ctx,
        AgentMemoryDemo demo,
        AgentSession session,
        LongTermMemory memory,
        AgentEventLog events,
        LocalEmbedder embedder,
        string htmlPage)
    {
        var req = ctx.Request;
        string path = req.Url?.AbsolutePath ?? "/";

        if (string.Equals(req.HttpMethod, "GET", StringComparison.OrdinalIgnoreCase))
        {
            if (path == "/" || path == "/index.html")
            {
                SendHtml(ctx, htmlPage);
                return;
            }
            if (path == "/state")
            {
                var qs = HttpUtility.ParseQueryString(req.Url?.Query ?? "");
                string user = qs["user"] ?? demo.DefaultUser;
                string @namespace = qs["namespace"] ?? demo.DefaultNamespace;
                SendJson(ctx, BuildState(demo, session, memory, events, embedder, user, @namespace));
                return;
            }
            SendJson(ctx, new { error = "not found" }, 404);
            return;
        }

        if (string.Equals(req.HttpMethod, "POST", StringComparison.OrdinalIgnoreCase))
        {
            string body = ReadBody(req);
            var form = HttpUtility.ParseQueryString(body);

            if (path == "/turn")
            {
                string text = (form["text"] ?? "").Trim();
                if (text.Length == 0)
                {
                    SendJson(ctx, new { error = "text is required" }, 400);
                    return;
                }
                double threshold = ClampThreshold(form["threshold"], memory.RecallThreshold);
                var payload = demo.HandleTurn(
                    text: text,
                    user: form["user"] ?? "default",
                    @namespace: form["namespace"] ?? "default",
                    kind: form["kind"] ?? "episodic",
                    role: form["role"] ?? "user",
                    threshold: threshold,
                    action: form["action"] ?? "turn");
                SendJson(ctx, payload);
                return;
            }

            if (path == "/new_thread")
            {
                string threadId = demo.NewThread(
                    user: form["user"] ?? "default",
                    @namespace: form["namespace"] ?? "default");
                SendJson(ctx, new { thread_id = threadId });
                return;
            }

            if (path == "/reset")
            {
                int seeded = demo.SeedAll(
                    user: form["user"] ?? "default",
                    @namespace: form["namespace"] ?? "default");
                SendJson(ctx, new { seeded });
                return;
            }

            if (path == "/drop_memory")
            {
                string memoryId = (form["memory_id"] ?? "").Trim();
                if (memoryId.Length == 0)
                {
                    SendJson(ctx, new { error = "memory_id is required" }, 400);
                    return;
                }
                bool deleted = memory.DeleteMemory(memoryId);
                SendJson(ctx, new { deleted, memory_id = memoryId });
                return;
            }

            SendJson(ctx, new { error = "not found" }, 404);
            return;
        }

        SendJson(ctx, new { error = "method not allowed" }, 405);
    }

    private static object BuildState(
        AgentMemoryDemo demo,
        AgentSession session,
        LongTermMemory memory,
        AgentEventLog events,
        LocalEmbedder embedder,
        string user,
        string @namespace)
    {
        var info = memory.IndexInfo();
        string threadId = demo.CurrentThreadId;
        var state = session.Load(threadId);
        var memories = memory.ListMemories(user: user, @namespace: @namespace, limit: 200);
        var recentEvents = events.Recent(threadId, count: 20);
        return new
        {
            index = new
            {
                num_docs = info.NumDocs,
                indexing_failures = info.IndexingFailures,
                index_name = memory.IndexName,
                model = embedder.ModelName,
                session_ttl_seconds = session.DefaultTtlSeconds,
                dedup_threshold = memory.DedupThreshold,
                default_recall_threshold = memory.RecallThreshold,
                stack_label = StackLabel,
            },
            thread_id = threadId,
            session = state is null ? null : SerializeSession(state),
            memories = memories.Select(SerializeMemory).ToArray(),
            events = recentEvents.Select(SerializeEvent).ToArray(),
            // `recalled` is populated by /turn; on plain /state reads
            // the UI keeps showing the last turn's result, which is
            // the useful behaviour for an "agent" panel.
            recalled = Array.Empty<object>(),
        };
    }

    // ------------------------------------------------------------------
    // Serialisation helpers (match the Python/Node demo payloads
    // exactly so the same index.html JS works)
    // ------------------------------------------------------------------

    internal static object SerializeSession(SessionState s) => new
    {
        thread_id = s.ThreadId,
        user = s.User,
        agent = s.Agent,
        goal = s.Goal,
        scratchpad = s.Scratchpad,
        turn_count = s.TurnCount,
        created_ts = s.CreatedTs,
        last_active_ts = s.LastActiveTs,
        recent_turns = s.RecentTurns.Select(t => new
        {
            role = t.Role,
            content = t.Content,
            ts = t.Ts,
        }).ToArray(),
        ttl_seconds = s.TtlSeconds,
    };

    internal static object SerializeMemory(MemoryRecord m) => new
    {
        id = m.Id,
        user = m.User,
        @namespace = m.Namespace,
        kind = m.Kind,
        source_thread = m.SourceThread,
        text = m.Text,
        created_ts = m.CreatedTs,
        hit_count = m.HitCount,
        distance = m.Distance,
        ttl_seconds = m.TtlSeconds,
    };

    internal static object SerializeEvent(AgentEvent e) => new
    {
        event_id = e.EventId,
        thread_id = e.ThreadId,
        action = e.Action,
        detail = e.Detail,
        ts = e.Ts,
    };

    // ------------------------------------------------------------------
    // HTTP plumbing
    // ------------------------------------------------------------------

    private static string ReadBody(HttpListenerRequest req)
    {
        using var ms = new MemoryStream();
        var buffer = new byte[8192];
        int total = 0;
        int read;
        while ((read = req.InputStream.Read(buffer, 0, buffer.Length)) > 0)
        {
            total += read;
            if (total > MaxBodyBytes)
            {
                throw new InvalidOperationException(
                    $"request body exceeds {MaxBodyBytes} bytes");
            }
            ms.Write(buffer, 0, read);
        }
        return req.ContentEncoding.GetString(ms.ToArray());
    }

    private static void SendHtml(HttpListenerContext ctx, string html, int status = 200)
    {
        var bytes = Encoding.UTF8.GetBytes(html);
        ctx.Response.StatusCode = status;
        ctx.Response.ContentType = "text/html; charset=utf-8";
        ctx.Response.ContentLength64 = bytes.LongLength;
        ctx.Response.OutputStream.Write(bytes, 0, bytes.Length);
        ctx.Response.OutputStream.Close();
    }

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.Never,
    };

    private static void SendJson(HttpListenerContext ctx, object payload, int status = 200)
    {
        var bytes = JsonSerializer.SerializeToUtf8Bytes(payload, JsonOpts);
        ctx.Response.StatusCode = status;
        ctx.Response.ContentType = "application/json";
        ctx.Response.ContentLength64 = bytes.LongLength;
        ctx.Response.OutputStream.Write(bytes, 0, bytes.Length);
        ctx.Response.OutputStream.Close();
    }

    private static void TrySendError(HttpListenerContext ctx, Exception ex)
    {
        try
        {
            SendJson(ctx, new { error = ex.Message, type = ex.GetType().Name }, 500);
        }
        catch
        {
            // Headers may already be partially flushed; nothing left to do.
        }
    }

    private static double ClampThreshold(string? raw, double fallback)
    {
        if (!double.TryParse(raw, NumberStyles.Float, CultureInfo.InvariantCulture, out double d))
            return fallback;
        // `double.TryParse` accepts NaN/Infinity on some inputs.
        // Either would silently turn recall into "every memory" or
        // "nothing"; clamp to the meaningful cosine-distance range
        // so a malformed POST can't override the threshold semantics.
        if (!double.IsFinite(d)) return fallback;
        return Math.Max(0.0, Math.Min(2.0, d));
    }

    // ------------------------------------------------------------------
    // Help text
    // ------------------------------------------------------------------

    private static void PrintHelp()
    {
        Console.Error.WriteLine(@"Usage: dotnet run -- [flags]

  --host <host>                  HTTP bind host (default 127.0.0.1)
  --port <port>                  HTTP bind port (default 8093)
  --redis-host <host>            Redis host (default localhost)
  --redis-port <port>            Redis port (default 6379)
  --mem-index-name <name>        Memory index name (default agentmem:idx)
  --mem-key-prefix <prefix>      JSON memory key prefix (default agent:mem:)
  --session-key-prefix <prefix>  Session hash key prefix (default agent:session:)
  --event-key-prefix <prefix>    Event stream key prefix (default agent:events:)
  --session-ttl-seconds <n>      Working memory TTL (default 3600)
  --dedup-threshold <d>          Cosine distance for dedup (default 0.20)
  --recall-threshold <d>         Cosine distance for recall (default 0.55)
  --no-reset                     Skip clearing and re-seeding on startup
");
    }
}

// ----------------------------------------------------------------------
// Demo orchestrator
// ----------------------------------------------------------------------

/// <summary>
/// Demo state: working memory, long-term memory, event log.
/// </summary>
/// <remarks>
/// <para><see cref="SeedAll"/> / <see cref="NewThread"/> /
/// <see cref="HandleTurn"/> all touch <see cref="CurrentThreadId"/>
/// without coordination — see the walkthrough's "Concurrency
/// caveats" section. The demo is single-user in practice, so the
/// race never triggers; a multi-user agent would carry the thread id
/// on each request instead of holding it as shared server state.</para>
/// </remarks>
public sealed class AgentMemoryDemo
{
    private readonly AgentSession _session;
    private readonly LongTermMemory _memory;
    private readonly AgentEventLog _events;
    private readonly LocalEmbedder _embedder;
    public string DefaultUser { get; }
    public string DefaultNamespace { get; }
    public string CurrentThreadId { get; private set; }

    public AgentMemoryDemo(
        AgentSession session,
        LongTermMemory memory,
        AgentEventLog events,
        LocalEmbedder embedder,
        string defaultUser = "default",
        string defaultNamespace = "default")
    {
        _session = session;
        _memory = memory;
        _events = events;
        _embedder = embedder;
        DefaultUser = defaultUser;
        DefaultNamespace = defaultNamespace;
        CurrentThreadId = session.NewThreadId();
    }

    /// <summary>Drop everything in scope and pre-populate with seed memories.</summary>
    public int SeedAll(string user, string @namespace)
    {
        _memory.Clear();
        _session.Delete(CurrentThreadId);
        _events.Clear(CurrentThreadId);
        int written = SeedMemory.Seed(_memory, _embedder, user: user, @namespace: @namespace);
        CurrentThreadId = _session.NewThreadId();
        return written;
    }

    /// <summary>Start a fresh thread. Long-term memory is unaffected.</summary>
    public string NewThread(string user, string @namespace)
    {
        _events.Clear(CurrentThreadId);
        CurrentThreadId = _session.NewThreadId();
        _session.Start(CurrentThreadId, user: user, agentName: "demo-agent", goal: "");
        _events.Record(
            CurrentThreadId,
            "thread_started",
            $"user={user} namespace={@namespace}");
        return CurrentThreadId;
    }

    /// <summary>
    /// One pass through the agent loop: append, recall, remember, log.
    /// </summary>
    /// <remarks>
    /// <para>The order matters. We embed once and reuse the vector
    /// for both the recall and (if asked) the remember step — no
    /// point encoding the same text twice. Recall runs <em>before</em>
    /// the remember write so the agent doesn't see its own just-
    /// written turn as a recalled memory.</para>
    /// </remarks>
    public object HandleTurn(
        string text,
        string user,
        string @namespace,
        string kind,
        string role,
        double threshold,
        string action)
    {
        string threadId = CurrentThreadId;

        var t0 = System.Diagnostics.Stopwatch.GetTimestamp();
        float[] vec = _embedder.EncodeOne(text);
        double embedMs = ElapsedMs(t0);

        // `SetGoal` only touches the goal field so existing turns
        // aren't wiped; `AppendTurn` carries the request `user`
        // through to the auto-create path so a first turn for a new
        // thread doesn't land under the default user.
        string sessionAction;
        if (action == "goal")
        {
            _session.SetGoal(threadId, text, user: user, agentName: "demo-agent");
            sessionAction = "goal_set";
        }
        else
        {
            _session.AppendTurn(
                threadId,
                role: role,
                content: text,
                user: user,
                agentName: "demo-agent");
            sessionAction = $"turn_appended:{role}";
        }

        var t1 = System.Diagnostics.Stopwatch.GetTimestamp();
        var recalled = _memory.Recall(
            queryEmbedding: vec,
            user: user,
            @namespace: @namespace,
            k: 5,
            distanceThreshold: threshold);
        double recallMs = ElapsedMs(t1);

        bool writeSkipped = kind == "skip" || action == "goal";
        WriteResult? writeResult = null;
        double writeMs = 0;
        if (!writeSkipped)
        {
            var t2 = System.Diagnostics.Stopwatch.GetTimestamp();
            writeResult = _memory.Remember(
                text: text,
                embedding: vec,
                user: user,
                @namespace: @namespace,
                kind: kind,
                sourceThread: threadId);
            writeMs = ElapsedMs(t2);
        }

        // Append to event log so the audit trail shows what happened.
        if (writeResult is not null)
        {
            string detail = writeResult.Deduped
                ? $"deduped onto {writeResult.Id}"
                : $"wrote {writeResult.Id} as {kind}";
            _events.Record(threadId, sessionAction, detail);
        }
        else
        {
            _events.Record(threadId, sessionAction, "");
        }

        return new
        {
            thread_id = threadId,
            write_skipped = writeSkipped,
            memory_id = writeResult?.Id,
            deduped = writeResult?.Deduped ?? false,
            existing_distance = writeResult?.ExistingDistance,
            kind = writeSkipped ? null : kind,
            recalled = recalled.Select(Program.SerializeMemory).ToArray(),
            embed_ms = embedMs,
            recall_ms = recallMs,
            write_ms = writeMs,
        };
    }

    private static double ElapsedMs(long start)
        => (System.Diagnostics.Stopwatch.GetTimestamp() - start)
            * 1000.0 / System.Diagnostics.Stopwatch.Frequency;
}

// ----------------------------------------------------------------------
// Arg parsing
// ----------------------------------------------------------------------

internal sealed record Args(
    string Host,
    int Port,
    string RedisHost,
    int RedisPort,
    string MemIndexName,
    string MemKeyPrefix,
    string SessionKeyPrefix,
    string EventKeyPrefix,
    long SessionTtlSeconds,
    double DedupThreshold,
    double RecallThreshold,
    bool ResetOnStart)
{
    public static Args Parse(string[] argv)
    {
        string host = "127.0.0.1";
        int port = 8093;
        string redisHost = "localhost";
        int redisPort = 6379;
        string memIndex = "agentmem:idx";
        string memPrefix = "agent:mem:";
        string sessionPrefix = "agent:session:";
        string eventPrefix = "agent:events:";
        long sessionTtl = 3600;
        double dedup = 0.20;
        double recall = 0.55;
        bool reset = true;

        for (int i = 0; i < argv.Length; i++)
        {
            string a = argv[i];
            string? Take() => i + 1 < argv.Length ? argv[++i] : null;

            switch (a)
            {
                case "--host": host = Take() ?? host; break;
                case "--port": port = int.Parse(Take() ?? "8093"); break;
                case "--redis-host": redisHost = Take() ?? redisHost; break;
                case "--redis-port": redisPort = int.Parse(Take() ?? "6379"); break;
                case "--mem-index-name": memIndex = Take() ?? memIndex; break;
                case "--mem-key-prefix": memPrefix = Take() ?? memPrefix; break;
                case "--session-key-prefix": sessionPrefix = Take() ?? sessionPrefix; break;
                case "--event-key-prefix": eventPrefix = Take() ?? eventPrefix; break;
                case "--session-ttl-seconds": sessionTtl = long.Parse(Take() ?? "3600"); break;
                case "--dedup-threshold":
                    dedup = double.Parse(Take() ?? "0.20", CultureInfo.InvariantCulture);
                    break;
                case "--recall-threshold":
                    recall = double.Parse(Take() ?? "0.55", CultureInfo.InvariantCulture);
                    break;
                case "--no-reset": reset = false; break;
                case "--help":
                case "-h":
                    throw new ArgumentException("help requested");
                default:
                    throw new ArgumentException($"unknown flag: {a}");
            }
        }

        return new Args(
            Host: host,
            Port: port,
            RedisHost: redisHost,
            RedisPort: redisPort,
            MemIndexName: memIndex,
            MemKeyPrefix: memPrefix,
            SessionKeyPrefix: sessionPrefix,
            EventKeyPrefix: eventPrefix,
            SessionTtlSeconds: sessionTtl,
            DedupThreshold: dedup,
            RecallThreshold: recall,
            ResetOnStart: reset);
    }
}
