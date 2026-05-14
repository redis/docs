using System.Text.Json;
using StackExchange.Redis;
using StreamingDemo;

// .NET grows its ThreadPool gradually, which can starve polling threads
// in the consumer workers when many groups/consumers run concurrently.
// Raising the floor up front keeps the demo's behaviour clean. A
// production helper would more naturally be async (using StreamAddAsync,
// StreamRangeAsync, ScriptEvaluateAsync, etc.) and avoid this entirely.
ThreadPool.SetMinThreads(64, 64);

var port = 8785;
var redisHost = "localhost";
var redisPort = 6379;
var streamKey = "demo:events:orders";
var maxlen = 2000;
var claimIdleMs = 5000L;
var resetOnStart = true;

for (var i = 0; i < args.Length; i++)
{
    switch (args[i])
    {
        case "--port" when i + 1 < args.Length: port = int.Parse(args[++i]); break;
        case "--redis-host" when i + 1 < args.Length: redisHost = args[++i]; break;
        case "--redis-port" when i + 1 < args.Length: redisPort = int.Parse(args[++i]); break;
        case "--stream-key" when i + 1 < args.Length: streamKey = args[++i]; break;
        case "--maxlen" when i + 1 < args.Length: maxlen = int.Parse(args[++i]); break;
        case "--claim-idle-ms" when i + 1 < args.Length: claimIdleMs = long.Parse(args[++i]); break;
        case "--no-reset": resetOnStart = false; break;
    }
}

port = int.TryParse(Environment.GetEnvironmentVariable("PORT"), out var envPort) ? envPort : port;
redisHost = Environment.GetEnvironmentVariable("REDIS_HOST") ?? redisHost;
redisPort = int.TryParse(Environment.GetEnvironmentVariable("REDIS_PORT"), out var envRedisPort)
    ? envRedisPort
    : redisPort;

ConnectionMultiplexer redis;
try
{
    redis = ConnectionMultiplexer.Connect($"{redisHost}:{redisPort}");
    redis.GetDatabase().Ping();
}
catch (Exception ex)
{
    Console.Error.WriteLine($"Failed to connect to Redis at {redisHost}:{redisPort}: {ex.Message}");
    return 1;
}

var stream = new EventStream(
    redis.GetDatabase(),
    streamKey: streamKey,
    maxlenApprox: maxlen,
    claimMinIdleMs: claimIdleMs);

var defaultGroups = new Dictionary<string, string[]>
{
    ["notifications"] = new[] { "worker-a", "worker-b" },
    ["analytics"] = new[] { "worker-c" },
};

var demo = new StreamingDemoState(stream);
if (resetOnStart)
{
    Console.WriteLine(
        $"Deleting any existing data at key '{streamKey}' " +
        "for a clean demo run (pass --no-reset to keep it).");
    stream.DeleteStream();
}
demo.Seed(defaultGroups);

var builder = WebApplication.CreateBuilder();
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
builder.Logging.SetMinimumLevel(LogLevel.Warning);
var app = builder.Build();

var jsonOptions = new JsonSerializerOptions
{
    PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
};

app.MapGet("/", () => Results.Content(
    HtmlPage.Generate(stream.StreamKey, stream.MaxlenApprox, stream.ClaimMinIdleMs),
    "text/html"));

app.MapGet("/state", () => Results.Json(BuildState(), jsonOptions));

app.MapGet("/replay", (string? start, string? end, int? count) =>
{
    var startId = string.IsNullOrEmpty(start) ? "-" : start;
    var endId = string.IsNullOrEmpty(end) ? "+" : end;
    var limit = Math.Max(1, Math.Min(500, count ?? 20));
    var entries = stream.Replay(startId, endId, count: limit);
    return Results.Json(new Dictionary<string, object?>
    {
        ["start"] = startId,
        ["end"] = endId,
        ["limit"] = limit,
        ["entries"] = entries.Select(e => new Dictionary<string, object?>
        {
            ["id"] = e.Id,
            ["fields"] = e.Fields,
        }).ToList(),
    }, jsonOptions);
});

var eventTypes = new[] { "order.placed", "order.paid", "order.shipped", "order.cancelled" };

app.MapPost("/produce", async (HttpContext ctx) =>
{
    var form = await ctx.Request.ReadFormAsync();
    var count = Math.Max(1, Math.Min(500, int.TryParse(form["count"], out var c) ? c : 1));
    var rawType = (form["type"].ToString() ?? "").Trim();
    var events = new List<(string, IDictionary<string, string?>)>(count);
    for (var i = 0; i < count; i++)
    {
        var picked = string.IsNullOrEmpty(rawType)
            ? eventTypes[Random.Shared.Next(eventTypes.Length)]
            : rawType;
        events.Add((picked, FakePayload()));
    }
    var ids = stream.ProduceBatch(events);
    return Results.Json(new Dictionary<string, object?>
    {
        ["produced"] = ids.Length,
        ["ids"] = ids,
    }, jsonOptions);
});

app.MapPost("/add-worker", async (HttpContext ctx) =>
{
    var form = await ctx.Request.ReadFormAsync();
    var group = (form["group"].ToString() ?? "").Trim();
    var name = (form["name"].ToString() ?? "").Trim();
    if (string.IsNullOrEmpty(group) || string.IsNullOrEmpty(name))
    {
        return Results.Json(new { error = "group and name are required" }, jsonOptions, statusCode: 400);
    }
    var added = demo.AddWorker(group, name);
    if (!added)
    {
        return Results.Json(new { error = $"{group}/{name} already exists" }, jsonOptions, statusCode: 409);
    }
    return Results.Json(new { group, name }, jsonOptions);
});

app.MapPost("/remove-worker", async (HttpContext ctx) =>
{
    var form = await ctx.Request.ReadFormAsync();
    var group = (form["group"].ToString() ?? "").Trim();
    var name = (form["name"].ToString() ?? "").Trim();
    var result = demo.RemoveWorker(group, name);
    var status = result.Removed || result.Reason == "not-found" ? 200 : 409;
    return Results.Json(new Dictionary<string, object?>
    {
        ["removed"] = result.Removed,
        ["reason"] = result.Reason,
        ["message"] = result.Message,
        ["handed_over_to"] = result.HandedOverTo,
        ["handed_over_count"] = result.HandedOverCount,
    }, jsonOptions, statusCode: status);
});

app.MapPost("/crash", async (HttpContext ctx) =>
{
    var form = await ctx.Request.ReadFormAsync();
    var group = (form["group"].ToString() ?? "").Trim();
    var name = (form["name"].ToString() ?? "").Trim();
    var count = int.TryParse(form["count"], out var c) ? c : 1;
    var worker = demo.GetWorker(group, name);
    if (worker is null)
    {
        return Results.Json(new { error = $"unknown consumer {group}/{name}" }, jsonOptions, statusCode: 404);
    }
    worker.CrashNext(count);
    return Results.Json(new { queued = count }, jsonOptions);
});

app.MapPost("/autoclaim", async (HttpContext ctx) =>
{
    // Have the chosen consumer reap stuck PEL entries into itself.
    // This is the textbook XAUTOCLAIM recovery flow: each consumer
    // periodically calls XAUTOCLAIM with itself as the target, then
    // processes whatever was returned. The demo exposes it as a manual
    // button so you can trigger the reap on a chosen consumer after
    // waiting for the idle threshold.
    var form = await ctx.Request.ReadFormAsync();
    var group = (form["group"].ToString() ?? "").Trim();
    var consumer = (form["consumer"].ToString() ?? "").Trim();
    if (string.IsNullOrEmpty(group) || string.IsNullOrEmpty(consumer))
    {
        return Results.Json(new { error = "group and consumer are required" }, jsonOptions, statusCode: 400);
    }
    var worker = demo.GetWorker(group, consumer);
    if (worker is null)
    {
        return Results.Json(new { error = $"unknown consumer {group}/{consumer}" }, jsonOptions, statusCode: 404);
    }
    // ReapIdlePel runs XAUTOCLAIM(self) + process + ack. deleted are
    // PEL entries whose stream payload was already trimmed by MAXLEN ~
    // before the sweep ran. Redis 7+ removes them from the PEL inside
    // XAUTOCLAIM itself, so the caller doesn't have to XACK them; in
    // production they would be routed to a dead-letter store for
    // offline inspection.
    var result = worker.ReapIdlePel();
    return Results.Json(new Dictionary<string, object?>
    {
        ["claimed"] = result.Claimed,
        ["processed"] = result.Processed,
        ["deleted"] = result.DeletedIds,
        ["min_idle_ms"] = stream.ClaimMinIdleMs,
    }, jsonOptions);
});

app.MapPost("/trim", async (HttpContext ctx) =>
{
    var form = await ctx.Request.ReadFormAsync();
    var maxlenForm = int.TryParse(form["maxlen"], out var m) ? m : 0;
    var deleted = stream.TrimMaxlen(maxlenForm);
    return Results.Json(new { deleted, maxlen = maxlenForm }, jsonOptions);
});

app.MapPost("/reset", () =>
{
    var count = demo.Reset(defaultGroups);
    return Results.Json(new { consumers = count }, jsonOptions);
});

Console.WriteLine($"Redis streaming demo server listening on http://localhost:{port}");
Console.WriteLine(
    $"Using Redis at {redisHost}:{redisPort} with stream key '{streamKey}' " +
    $"(MAXLEN ~ {maxlen})");
Console.WriteLine($"Seeded {defaultGroups.Sum(g => g.Value.Length)} consumer(s) across {defaultGroups.Count} group(s)");

AppDomain.CurrentDomain.ProcessExit += (_, _) => demo.StopAll();

app.Run();
return 0;

Dictionary<string, object?> BuildState()
{
    var streamInfo = stream.InfoStream();
    var groups = stream.InfoGroups();
    var workersSnapshot = demo.WorkersSnapshot();
    var groupsDetail = new List<Dictionary<string, object?>>();
    var pendingRows = new List<Dictionary<string, object?>>();

    foreach (var group in groups)
    {
        var groupName = (string)group["name"]!;
        var consumerInfo = stream.InfoConsumers(groupName)
            .ToDictionary(c => (string)c["name"]!, c => c);
        var consumersDetail = new List<Dictionary<string, object?>>();
        foreach (var (key, worker) in workersSnapshot)
        {
            if (key.Group != groupName)
            {
                continue;
            }
            consumerInfo.TryGetValue(key.Name, out var info);
            var status = worker.Status();
            var combined = new Dictionary<string, object?>(status);
            combined["pending"] = info is not null ? (long)info["pending"]! : 0L;
            combined["idle_ms"] = info is not null ? (long)info["idle_ms"]! : 0L;
            combined["recent"] = worker.Recent().Select(a => new Dictionary<string, object?>
            {
                ["id"] = a.Id,
                ["type"] = a.Type,
                ["fields"] = a.Fields,
                ["acked"] = a.Acked,
                ["note"] = a.Note,
            }).ToList();
            consumersDetail.Add(combined);
        }
        // Also include consumers that exist in Redis but not in our
        // in-process registry (e.g. orphaned after a restart).
        foreach (var (consumerName, info) in consumerInfo)
        {
            if (consumersDetail.Any(c => (string)c["name"]! == consumerName))
            {
                continue;
            }
            consumersDetail.Add(new Dictionary<string, object?>
            {
                ["name"] = consumerName,
                ["group"] = groupName,
                ["processed"] = 0,
                ["reaped"] = 0,
                ["crashed_drops"] = 0,
                ["paused"] = false,
                ["crash_queued"] = 0,
                ["alive"] = false,
                ["pending"] = (long)info["pending"]!,
                ["idle_ms"] = (long)info["idle_ms"]!,
                ["recent"] = new List<object>(),
            });
        }
        consumersDetail.Sort((a, b) => string.Compare((string)a["name"]!, (string)b["name"]!, StringComparison.Ordinal));
        var combinedGroup = new Dictionary<string, object?>(group)
        {
            ["consumers_detail"] = consumersDetail,
        };
        groupsDetail.Add(combinedGroup);

        foreach (var pending in stream.PendingDetail(groupName, count: 50))
        {
            pendingRows.Add(new Dictionary<string, object?>
            {
                ["id"] = pending.Id,
                ["consumer"] = pending.Consumer,
                ["idle_ms"] = pending.IdleMs,
                ["deliveries"] = pending.Deliveries,
                ["group"] = groupName,
            });
        }
    }

    var tail = stream.Tail(count: 10).Select(e => new Dictionary<string, object?>
    {
        ["id"] = e.Id,
        ["fields"] = e.Fields,
    }).ToList();

    return new Dictionary<string, object?>
    {
        ["stream"] = streamInfo,
        ["tail"] = tail,
        ["groups"] = groupsDetail,
        ["pending"] = pendingRows,
        ["stats"] = stream.Stats(),
    };
}

static IDictionary<string, string?> FakePayload()
{
    var customers = new[] { "alice", "bob", "carol", "dan", "erin" };
    return new Dictionary<string, string?>
    {
        ["order_id"] = $"o-{Random.Shared.Next(1000, 9999)}",
        ["customer"] = customers[Random.Shared.Next(customers.Length)],
        ["amount"] = (5.0 + Random.Shared.NextDouble() * 245.0).ToString("F2"),
    };
}

/// <summary>
/// In-memory registry of consumer workers across all groups.
/// </summary>
sealed class StreamingDemoState
{
    private readonly EventStream _stream;
    private readonly Dictionary<(string Group, string Name), ConsumerWorker> _workers = new();
    private readonly object _lock = new();

    public StreamingDemoState(EventStream stream)
    {
        _stream = stream;
    }

    public int Seed(IDictionary<string, string[]> groups)
    {
        lock (_lock)
        {
            foreach (var (group, names) in groups)
            {
                _stream.EnsureGroup(group, startId: "0-0");
                foreach (var name in names)
                {
                    AddWorkerLocked(group, name);
                }
            }
            return groups.Sum(g => g.Value.Length);
        }
    }

    public bool AddWorker(string group, string name)
    {
        lock (_lock)
        {
            return AddWorkerLocked(group, name);
        }
    }

    private bool AddWorkerLocked(string group, string name)
    {
        var key = (group, name);
        if (_workers.ContainsKey(key))
        {
            return false;
        }
        _stream.EnsureGroup(group, startId: "0-0");
        var worker = new ConsumerWorker(_stream, group, name);
        worker.Start();
        _workers[key] = worker;
        return true;
    }

    public RemoveResult RemoveWorker(string group, string name)
    {
        ConsumerWorker? worker;
        string? handoverTarget;
        lock (_lock)
        {
            var key = (group, name);
            if (!_workers.TryGetValue(key, out worker))
            {
                return new RemoveResult(false, "not-found", null, null, 0);
            }
            // XGROUP DELCONSUMER destroys the consumer's PEL entries
            // outright, so any pending message it still owned would
            // become unreachable. Before deleting, hand its PEL off to
            // another consumer in the same group with XCLAIM. Without
            // a peer consumer to take over, refuse to delete.
            handoverTarget = _workers.Keys
                .Where(k => k.Group == group && k.Name != name)
                .Select(k => k.Name)
                .FirstOrDefault();
            if (handoverTarget is null)
            {
                return new RemoveResult(
                    false,
                    "no-peer",
                    $"{group}/{name} still owns pending entries and is the only consumer in its group; " +
                    "add another consumer first so its PEL can be handed over before deletion.",
                    null,
                    0);
            }
        }

        // Run the handover BEFORE removing the worker from the registry.
        // XGROUP DELCONSUMER would destroy the source's pending list, so
        // any handover failure must abort the removal — leaving the
        // worker in place lets the user retry once the underlying Redis
        // issue is resolved. The worker keeps consuming during the
        // handover; XCLAIM with MIN-IDLE-TIME 0 races acks gracefully —
        // anything the worker acks during the window is gone from
        // XPENDING and isn't moved.
        int handed;
        try
        {
            handed = _stream.HandoverPending(group, fromConsumer: name, toConsumer: handoverTarget);
        }
        catch (Exception ex)
        {
            return new RemoveResult(
                false,
                "handover-failed",
                $"Handover from {group}/{name} to {handoverTarget} failed before XGROUP DELCONSUMER could run: {ex.Message}. " +
                $"{group}/{name} is still in the group; retry the remove or investigate the Redis error before deleting " +
                "(DELCONSUMER would destroy the source consumer's pending entries).",
                null,
                0);
        }

        // Handover succeeded; now safe to remove from the registry, stop
        // the worker, and destroy the consumer record in Redis.
        lock (_lock)
        {
            _workers.Remove((group, name));
        }
        worker.Stop();
        _stream.DeleteConsumer(group, name);
        return new RemoveResult(true, null, null, handoverTarget, handed);
    }

    public ConsumerWorker? GetWorker(string group, string name)
    {
        lock (_lock)
        {
            return _workers.TryGetValue((group, name), out var worker) ? worker : null;
        }
    }

    public List<KeyValuePair<(string Group, string Name), ConsumerWorker>> WorkersSnapshot()
    {
        lock (_lock)
        {
            return _workers.ToList();
        }
    }

    public void StopAll()
    {
        List<ConsumerWorker> snapshot;
        lock (_lock)
        {
            snapshot = _workers.Values.ToList();
            _workers.Clear();
        }
        foreach (var worker in snapshot)
        {
            worker.Stop();
        }
    }

    public int Reset(IDictionary<string, string[]> defaultGroups)
    {
        StopAll();
        _stream.DeleteStream();
        _stream.ResetStats();
        return Seed(defaultGroups);
    }
}

sealed record RemoveResult(
    bool Removed,
    string? Reason,
    string? Message,
    string? HandedOverTo,
    int HandedOverCount);

static class HtmlPage
{
    public static string Generate(string streamKey, int maxlen, long claimIdleMs)
    {
        return Template
            .Replace("__STREAM_KEY__", System.Net.WebUtility.HtmlEncode(streamKey))
            .Replace("__MAXLEN__", maxlen.ToString())
            .Replace("__CLAIM_IDLE__", claimIdleMs.ToString());
    }

    private const string Template = """""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redis Streaming Demo</title>
  <style>
    :root {
      --bg: #eef3f1;
      --panel: #ffffff;
      --ink: #1d2730;
      --accent: #267d6b;
      --accent-dark: #1a594c;
      --muted: #5c6770;
      --line: #d4dfdb;
      --ok: #d2ecdf;
      --warn: #f8e0d0;
      --pill: #d9ebe6;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Georgia, "Times New Roman", serif;
      color: var(--ink);
      background:
        radial-gradient(circle at top left, #f3faf7, transparent 32rem),
        linear-gradient(180deg, #ecf2f0 0%, var(--bg) 100%);
      min-height: 100vh;
    }
    main { max-width: 1080px; margin: 0 auto; padding: 40px 20px 72px; }
    h1 { font-size: clamp(2rem, 4.6vw, 3.4rem); line-height: 1.05; margin-bottom: 8px; }
    p.lede { max-width: 58rem; font-size: 1.05rem; color: var(--muted); }
    .grid {
      display: grid; gap: 18px;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      margin-top: 24px;
    }
    .panel {
      background: rgba(255, 255, 255, 0.96);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 10px 32px rgba(20, 60, 50, 0.07);
    }
    .panel.wide { grid-column: 1 / -1; }
    .panel h2 { margin-top: 0; margin-bottom: 8px; font-size: 1.25rem; }
    .panel h3 { margin: 14px 0 6px; font-size: 1rem; }
    .pill {
      display: inline-block; border-radius: 999px;
      background: var(--pill); color: var(--accent-dark);
      padding: 6px 10px; font-size: 0.85rem; margin-bottom: 10px;
    }
    label { display: block; font-weight: bold; margin: 10px 0 4px; }
    input, select {
      width: 100%; padding: 9px 11px;
      border-radius: 9px; border: 1px solid #c0d2cc;
      font: inherit; background: white;
    }
    button {
      appearance: none; border: 0; border-radius: 999px;
      background: var(--accent); color: white;
      padding: 10px 16px; font: inherit; cursor: pointer;
      margin-right: 6px; margin-top: 10px;
    }
    button.secondary { background: #3b4951; }
    button.danger { background: #8a3a3a; }
    button.small { padding: 5px 10px; font-size: 0.85rem; margin-top: 4px; }
    button:hover { filter: brightness(0.92); }
    dl { display: grid; grid-template-columns: max-content 1fr; gap: 6px 14px; margin: 0; }
    dt { font-weight: bold; }
    dd { margin: 0; word-break: break-word; }
    .row { display: flex; gap: 8px; flex-wrap: wrap; }
    .row > * { flex: 1 1 0; min-width: 110px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.92rem; }
    th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--line); }
    th { color: var(--muted); font-weight: bold; }
    code, .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                  font-size: 0.85rem; }
    .badge {
      display: inline-block; border-radius: 6px;
      padding: 2px 7px; font-size: 0.8rem; font-weight: bold;
    }
    .badge.ack { background: var(--ok); color: #1d4a2c; }
    .badge.drop { background: var(--warn); color: #6b3220; }
    .badge.idle { background: #e6e0f0; color: #43326a; }
    .group { border-top: 1px dashed var(--line); padding-top: 10px; margin-top: 10px; }
    .group:first-child { border-top: 0; padding-top: 0; margin-top: 0; }
    .consumers { margin-top: 6px; }
    .consumer-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; }
    .consumer-row .name { font-weight: bold; min-width: 90px; }
    #status {
      margin-top: 18px; padding: 12px 14px;
      border-radius: 12px; display: none;
    }
    #status.ok { display: block; background: var(--ok); }
    #status.error { display: block; background: var(--warn); }
  </style>
</head>
<body>
  <main>
    <div class="pill">StackExchange.Redis + ASP.NET Core minimal API</div>
    <h1>Redis Streaming Demo</h1>
    <p class="lede">
      Producers append events to a single Redis Stream
      (<code>__STREAM_KEY__</code>). Two consumer groups read the same
      stream independently: <code>notifications</code> shares its work
      across two consumers, <code>analytics</code> processes the full
      flow on its own. Acknowledge with <code>XACK</code>, recover
      crashed deliveries with <code>XAUTOCLAIM</code>, replay any range
      with <code>XRANGE</code>, and bound retention with <code>XTRIM</code>.
    </p>

    <div class="grid">
      <section class="panel wide">
        <h2>Stream state</h2>
        <div id="stream-view">Loading...</div>
        <button id="refresh-button" class="secondary">Refresh</button>
        <button id="reset-button" class="danger">Reset demo (drop stream and re-seed)</button>
      </section>

      <section class="panel">
        <h2>Produce events</h2>
        <p>Events are appended with <code>XADD</code> with an approximate
        <code>MAXLEN ~ __MAXLEN__</code> retention cap.</p>
        <label for="produce-count">How many</label>
        <input id="produce-count" type="number" min="1" max="500" value="10">
        <label for="produce-type">Event type</label>
        <select id="produce-type">
          <option value="">(random)</option>
          <option value="order.placed">order.placed</option>
          <option value="order.paid">order.paid</option>
          <option value="order.shipped">order.shipped</option>
          <option value="order.cancelled">order.cancelled</option>
        </select>
        <button id="produce-button">Produce</button>
      </section>

      <section class="panel">
        <h2>Replay range (XRANGE)</h2>
        <p>Reads a slice of history. Replay is independent of any
        consumer group — no cursors move, no acks happen.</p>
        <label for="replay-start">Start ID</label>
        <input id="replay-start" value="-">
        <label for="replay-end">End ID</label>
        <input id="replay-end" value="+">
        <label for="replay-count">Limit</label>
        <input id="replay-count" type="number" min="1" max="500" value="20">
        <button id="replay-button">Replay</button>
      </section>

      <section class="panel">
        <h2>Trim retention (XTRIM)</h2>
        <p>Cap the stream length. Approximate trimming releases whole
        macro-nodes, which is much cheaper than exact trimming.</p>
        <label for="trim-maxlen">MAXLEN ~</label>
        <input id="trim-maxlen" type="number" min="0" value="100">
        <button id="trim-button" class="secondary">XTRIM</button>
      </section>

      <section class="panel wide">
        <h2>Consumer groups</h2>
        <div id="groups-view">Loading...</div>
      </section>

      <section class="panel wide">
        <h2>Pending entries (XPENDING)</h2>
        <p>Entries delivered to a consumer that haven't been acked yet.
        Idle time &ge; <code>__CLAIM_IDLE__</code> ms is eligible for
        <code>XAUTOCLAIM</code>.</p>
        <div id="pending-view">Loading...</div>
        <div class="row">
          <select id="autoclaim-target"></select>
          <button id="autoclaim-button" class="secondary">XAUTOCLAIM to selected</button>
        </div>
      </section>

      <section class="panel wide">
        <h2>Last result</h2>
        <div id="result-view"><p>Produce events, replay a range, or trigger an autoclaim to see results.</p></div>
      </section>
    </div>

    <div id="status"></div>
  </main>

  <script>
    const streamView = document.getElementById("stream-view");
    const groupsView = document.getElementById("groups-view");
    const pendingView = document.getElementById("pending-view");
    const resultView = document.getElementById("result-view");
    const autoclaimTarget = document.getElementById("autoclaim-target");
    const statusBox = document.getElementById("status");

    function setStatus(message, kind) {
      statusBox.textContent = message;
      statusBox.className = kind;
    }

    function escapeHtml(value) {
      return String(value ?? "").replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    }

    function renderStream(state) {
      const stream = state.stream || {};
      const tail = state.tail || [];
      const tailRows = tail.map((entry) => `
        <tr>
          <td class="mono">${escapeHtml(entry.id)}</td>
          <td>${escapeHtml(entry.fields.type)}</td>
          <td class="mono">${escapeHtml(entry.fields.order_id || "")}</td>
          <td>${escapeHtml(entry.fields.amount || "")}</td>
          <td class="mono">${escapeHtml(entry.fields.customer || "")}</td>
        </tr>`).join("");
      streamView.innerHTML = `
        <dl>
          <dt>Length</dt><dd>${stream.length ?? 0}</dd>
          <dt>First ID</dt><dd class="mono">${escapeHtml(stream.first_entry_id) || "&mdash;"}</dd>
          <dt>Last ID</dt><dd class="mono">${escapeHtml(stream.last_entry_id) || "&mdash;"}</dd>
          <dt>Produced</dt><dd>${state.stats.produced_total ?? 0}</dd>
          <dt>Acked</dt><dd>${state.stats.acked_total ?? 0}</dd>
          <dt>Claimed</dt><dd>${state.stats.claimed_total ?? 0}</dd>
        </dl>
        <h3>Tail (most recent)</h3>
        ${tail.length === 0 ? "<p>(empty)</p>" :
          `<table>
             <thead><tr><th>ID</th><th>type</th><th>order_id</th><th>amount</th><th>customer</th></tr></thead>
             <tbody>${tailRows}</tbody>
           </table>`}
      `;
    }

    function renderGroups(state) {
      const groups = state.groups || [];
      if (groups.length === 0) {
        groupsView.innerHTML = "<p>No groups.</p>";
        return;
      }
      const addWorkerValues = {};
      let focusedGroup = null;
      let focusedSelectionStart = null;
      groupsView.querySelectorAll("input[id^='addworker-']").forEach((input) => {
        const group = input.id.slice("addworker-".length);
        addWorkerValues[group] = input.value;
        if (document.activeElement === input) {
          focusedGroup = group;
          focusedSelectionStart = input.selectionStart;
        }
      });
      groupsView.innerHTML = groups.map((g) => {
        const consumers = (g.consumers_detail || []).map((c) => {
          const recent = (c.recent || []).slice(0, 3).map((m) => `
            <span class="mono" title="${escapeHtml(JSON.stringify(m.fields))}">
              <span class="badge ${m.acked ? "ack" : "drop"}">${m.acked ? "ack" : "drop"}</span>
              ${escapeHtml(m.id)} ${escapeHtml(m.type)}
            </span>`).join(" &nbsp; ");
          const badges = [];
          if (c.paused) badges.push('<span class="badge idle">paused</span>');
          if (c.crash_queued > 0) badges.push(`<span class="badge drop">will drop ${c.crash_queued}</span>`);
          return `
            <div class="consumer-row">
              <span class="name">${escapeHtml(c.name)}</span>
              <span class="mono">pending=${c.pending} idle=${c.idle_ms}ms processed=${c.processed} reaped=${c.reaped ?? 0}</span>
              ${badges.join(" ")}
              <button class="small secondary" data-action="crash" data-group="${escapeHtml(g.name)}" data-name="${escapeHtml(c.name)}">Crash next 3</button>
              <button class="small danger" data-action="remove" data-group="${escapeHtml(g.name)}" data-name="${escapeHtml(c.name)}">Remove</button>
            </div>
            ${recent ? `<div class="mono" style="margin-left: 100px; font-size: 0.85rem;">${recent}</div>` : ""}`;
        }).join("");
        return `
          <div class="group">
            <h3>${escapeHtml(g.name)}
              <span class="mono" style="font-weight: normal; font-size: 0.9rem;">
                pending=${g.pending} lag=${g.lag ?? "?"} last_delivered=${escapeHtml(g.last_delivered_id)}
              </span>
            </h3>
            <div class="consumers">${consumers || "<em>(no consumers)</em>"}</div>
            <div class="row" style="max-width: 360px; margin-top: 6px;">
              <input id="addworker-${escapeHtml(g.name)}" placeholder="new-worker-name">
              <button class="small" data-action="add" data-group="${escapeHtml(g.name)}">Add consumer</button>
            </div>
          </div>`;
      }).join("");

      for (const [group, value] of Object.entries(addWorkerValues)) {
        const input = document.getElementById(`addworker-${group}`);
        if (input) input.value = value;
      }
      if (focusedGroup) {
        const input = document.getElementById(`addworker-${focusedGroup}`);
        if (input) {
          input.focus();
          if (focusedSelectionStart !== null) {
            try { input.setSelectionRange(focusedSelectionStart, focusedSelectionStart); } catch (_) {}
          }
        }
      }

      const previous = autoclaimTarget.value;
      const options = [];
      for (const g of groups) {
        for (const c of g.consumers_detail || []) {
          options.push(`<option value="${escapeHtml(g.name)}|${escapeHtml(c.name)}">${escapeHtml(g.name)} → ${escapeHtml(c.name)}</option>`);
        }
      }
      autoclaimTarget.innerHTML = options.join("");
      if (Array.from(autoclaimTarget.options).some((o) => o.value === previous)) {
        autoclaimTarget.value = previous;
      }
    }

    function renderPending(state) {
      const rows = (state.pending || []).map((p) => `
        <tr>
          <td class="mono">${escapeHtml(p.group)}</td>
          <td class="mono">${escapeHtml(p.consumer)}</td>
          <td class="mono">${escapeHtml(p.id)}</td>
          <td>${p.idle_ms} ms</td>
          <td>${p.deliveries}</td>
        </tr>`).join("");
      pendingView.innerHTML = (state.pending || []).length === 0
        ? "<p>(no entries currently pending)</p>"
        : `<table>
             <thead><tr><th>group</th><th>consumer</th><th>id</th><th>idle</th><th>deliveries</th></tr></thead>
             <tbody>${rows}</tbody>
           </table>`;
    }

    async function refresh() {
      const r = await fetch("/state");
      const state = await r.json();
      renderStream(state);
      renderGroups(state);
      renderPending(state);
    }

    document.getElementById("refresh-button").addEventListener("click", refresh);

    document.getElementById("produce-button").addEventListener("click", async () => {
      const count = parseInt(document.getElementById("produce-count").value, 10) || 1;
      const type = document.getElementById("produce-type").value;
      const body = new URLSearchParams({ count, type });
      const r = await fetch("/produce", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Produce failed.", "error"); return; }
      setStatus(`Produced ${d.produced} event(s).`, "ok");
      resultView.innerHTML = `<p>Produced <strong>${d.produced}</strong> events. New IDs:</p>
        <pre class="mono">${d.ids.map(escapeHtml).join("\n")}</pre>`;
      await refresh();
    });

    document.getElementById("replay-button").addEventListener("click", async () => {
      const params = new URLSearchParams({
        start: document.getElementById("replay-start").value,
        end: document.getElementById("replay-end").value,
        count: document.getElementById("replay-count").value,
      });
      const r = await fetch(`/replay?${params.toString()}`);
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Replay failed.", "error"); return; }
      setStatus(`Replayed ${d.entries.length} entry/entries (XRANGE).`, "ok");
      const rows = d.entries.map((e) => `
        <tr>
          <td class="mono">${escapeHtml(e.id)}</td>
          <td>${escapeHtml(e.fields.type)}</td>
          <td class="mono">${escapeHtml(e.fields.order_id || "")}</td>
          <td>${escapeHtml(e.fields.amount || "")}</td>
        </tr>`).join("");
      resultView.innerHTML = `
        <p>XRANGE ${escapeHtml(d.start)} → ${escapeHtml(d.end)} (limit ${d.limit})</p>
        ${d.entries.length === 0 ? "<p>(no entries)</p>" :
          `<table>
            <thead><tr><th>ID</th><th>type</th><th>order_id</th><th>amount</th></tr></thead>
            <tbody>${rows}</tbody>
           </table>`}`;
    });

    document.getElementById("trim-button").addEventListener("click", async () => {
      const maxlen = document.getElementById("trim-maxlen").value;
      const body = new URLSearchParams({ maxlen });
      const r = await fetch("/trim", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Trim failed.", "error"); return; }
      setStatus(`XTRIM removed ${d.deleted} entr${d.deleted === 1 ? "y" : "ies"}.`, "ok");
      await refresh();
    });

    document.getElementById("autoclaim-button").addEventListener("click", async () => {
      const target = autoclaimTarget.value;
      if (!target) { setStatus("No consumer selected.", "error"); return; }
      const [group, consumer] = target.split("|");
      const body = new URLSearchParams({ group, consumer });
      const r = await fetch("/autoclaim", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Autoclaim failed.", "error"); return; }
      const deletedCount = (d.deleted || []).length;
      const msg = deletedCount
        ? `${group}/${consumer} reaped ${d.claimed} entry/entries and processed ${d.processed}; ${deletedCount} pending ID(s) were already trimmed out of the stream and removed from the PEL by Redis.`
        : `${group}/${consumer} reaped ${d.claimed} entry/entries and processed ${d.processed}.`;
      setStatus(msg, "ok");
      const deletedBlock = deletedCount
        ? `<h3>Deleted IDs (payload already trimmed — removed from PEL by Redis)</h3>
           <p class="mono">${(d.deleted || []).map(escapeHtml).join(", ")}</p>
           <p>In production these would also be routed to a dead-letter store for offline inspection.</p>`
        : "";
      resultView.innerHTML = `
        <p><strong>${escapeHtml(group)}/${escapeHtml(consumer)}</strong> ran <code>XAUTOCLAIM</code>
           into itself with <code>min_idle_time = ${d.min_idle_ms} ms</code>,
           claimed <strong>${d.claimed}</strong> stuck entry/entries, processed
           <strong>${d.processed}</strong>, and acked them.</p>
        ${d.claimed === 0 ? "<p>(nothing was idle enough yet — try again after a few seconds)</p>" : ""}
        ${deletedBlock}`;
      await refresh();
    });

    document.getElementById("reset-button").addEventListener("click", async () => {
      if (!confirm("Drop the stream and re-seed the default groups?")) return;
      const r = await fetch("/reset", { method: "POST" });
      const d = await r.json();
      setStatus(`Reset. ${d.consumers} consumer(s) re-seeded.`, "ok");
      await refresh();
    });

    document.body.addEventListener("click", async (ev) => {
      const t = ev.target.closest("button[data-action]");
      if (!t) return;
      const action = t.dataset.action;
      const group = t.dataset.group;
      if (action === "crash") {
        const name = t.dataset.name;
        const body = new URLSearchParams({ group, name, count: "3" });
        await fetch("/crash", { method: "POST", body });
        setStatus(`Queued next 3 deliveries to ${group}/${name} for drop.`, "ok");
        await refresh();
      } else if (action === "remove") {
        const name = t.dataset.name;
        if (!confirm(`Remove ${group}/${name}? Any pending entries it still owns will be handed over to a peer consumer in the group via XCLAIM before XGROUP DELCONSUMER.`)) return;
        const body = new URLSearchParams({ group, name });
        const r = await fetch("/remove-worker", { method: "POST", body });
        const d = await r.json();
        if (!d.removed) {
          setStatus(d.message || `Could not remove ${group}/${name} (${d.reason || "unknown"}).`, "error");
        } else if (d.handed_over_count > 0) {
          setStatus(`Removed ${group}/${name}. Handed ${d.handed_over_count} pending entr${d.handed_over_count === 1 ? "y" : "ies"} over to ${d.handed_over_to}.`, "ok");
        } else {
          setStatus(`Removed ${group}/${name} (no pending entries to hand over).`, "ok");
        }
        await refresh();
      } else if (action === "add") {
        const input = document.getElementById(`addworker-${group}`);
        const name = (input.value || "").trim();
        if (!name) { setStatus("Enter a consumer name.", "error"); return; }
        const body = new URLSearchParams({ group, name });
        const r = await fetch("/add-worker", { method: "POST", body });
        const d = await r.json();
        if (!r.ok) { setStatus(d.error || "Add failed.", "error"); return; }
        input.value = "";
        setStatus(`Added ${group}/${name}.`, "ok");
        await refresh();
      }
    });

    refresh();
    setInterval(refresh, 1500);
  </script>
</body>
</html>
""""";
}
