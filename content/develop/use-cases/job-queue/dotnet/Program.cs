using JobQueueDemo;
using StackExchange.Redis;

// Bump the thread pool to keep concurrent claim() calls from starving each
// other when many workers are running.
ThreadPool.SetMinThreads(64, 64);

var host = "127.0.0.1";
var port = 8795;
var redisHost = "localhost";
var redisPort = 6379;
var visibilityMs = 5000L;
var initialWorkers = 0;

for (var i = 0; i < args.Length; i++)
{
    switch (args[i])
    {
        case "--host" when i + 1 < args.Length:
            host = args[++i];
            break;
        case "--port" when i + 1 < args.Length:
            port = int.Parse(args[++i]);
            break;
        case "--redis-host" when i + 1 < args.Length:
            redisHost = args[++i];
            break;
        case "--redis-port" when i + 1 < args.Length:
            redisPort = int.Parse(args[++i]);
            break;
        case "--visibility-ms" when i + 1 < args.Length:
            visibilityMs = long.Parse(args[++i]);
            break;
        case "--workers" when i + 1 < args.Length:
            initialWorkers = int.Parse(args[++i]);
            break;
    }
}

ConnectionMultiplexer redis;
try
{
    redis = ConnectionMultiplexer.Connect($"{redisHost}:{redisPort}");
    redis.GetDatabase().Ping();
    Console.WriteLine($"Connected to Redis at {redisHost}:{redisPort}");
}
catch (Exception ex)
{
    Console.Error.WriteLine($"Failed to connect to Redis: {ex.Message}");
    Console.Error.WriteLine($"Make sure Redis is running at {redisHost}:{redisPort}");
    return 1;
}

var queueName = Environment.GetEnvironmentVariable("QUEUE_NAME") ?? "jobs";
var queue = new RedisJobQueue(redis, queueName: queueName, visibilityMs: visibilityMs);
var pool = new WorkerPool(queue, size: 0);
if (initialWorkers > 0)
{
    pool.Resize(initialWorkers);
    pool.Start();
}

var builder = WebApplication.CreateBuilder();
builder.Logging.SetMinimumLevel(LogLevel.Warning);
var app = builder.Build();
app.Urls.Add($"http://{host}:{port}");

app.MapGet("/", () => Results.Content(HtmlPage.Generate(visibilityMs), "text/html"));

app.MapGet("/jobs", () => Results.Json(BuildJobs(queue)));

app.MapGet("/stats", () => Results.Json(BuildStats(queue, pool)));

app.MapPost("/enqueue", async (HttpContext ctx) =>
{
    var form = await ReadForm(ctx);
    var kind = string.IsNullOrWhiteSpace(form.GetValueOrDefault("kind")) ? "email" : form["kind"];
    var recipient = string.IsNullOrWhiteSpace(form.GetValueOrDefault("recipient"))
        ? "user@example.com"
        : form["recipient"];
    var count = 1;
    if (form.TryGetValue("count", out var countRaw) && int.TryParse(countRaw, out var parsedCount))
    {
        count = Math.Clamp(parsedCount, 1, 50);
    }

    var ids = new List<string>();
    for (var i = 0; i < count; i++)
    {
        var payload = new Dictionary<string, object>
        {
            ["kind"] = kind,
            ["recipient"] = recipient,
            ["n"] = i + 1,
        };
        ids.Add(queue.Enqueue(payload));
    }

    return Results.Json(new
    {
        enqueued = ids,
        stats = BuildStats(queue, pool),
    });
});

app.MapPost("/workers/start", async (HttpContext ctx) =>
{
    var form = await ReadForm(ctx);
    var size = ParseInt(form, "size", 2, 0, 8);
    var workLatencyMs = ParseInt(form, "work_latency_ms", 400, 0, 60000);
    var failRate = ParseDouble(form, "fail_rate", 0.0, 0.0, 1.0);
    var hangRate = ParseDouble(form, "hang_rate", 0.0, 0.0, 1.0);

    pool.Configure(workLatencyMs: workLatencyMs, failRate: failRate, hangRate: hangRate);
    pool.Resize(size);
    pool.Start();
    return Results.Json(BuildStats(queue, pool));
});

app.MapPost("/workers/stop", () =>
{
    pool.Stop();
    return Results.Json(BuildStats(queue, pool));
});

app.MapPost("/workers/configure", async (HttpContext ctx) =>
{
    var form = await ReadForm(ctx);
    int? workLatencyMs = null;
    double? failRate = null;
    double? hangRate = null;
    if (form.TryGetValue("work_latency_ms", out var wRaw) && int.TryParse(wRaw, out var w))
    {
        workLatencyMs = w;
    }
    if (form.TryGetValue("fail_rate", out var fRaw) && double.TryParse(fRaw, out var f))
    {
        failRate = f;
    }
    if (form.TryGetValue("hang_rate", out var hRaw) && double.TryParse(hRaw, out var h))
    {
        hangRate = h;
    }
    pool.Configure(workLatencyMs, failRate, hangRate);
    return Results.Json(BuildStats(queue, pool));
});

app.MapPost("/reclaim", () =>
{
    var reclaimed = queue.ReclaimStuck();
    return Results.Json(new
    {
        reclaimed,
        stats = BuildStats(queue, pool),
    });
});

app.MapPost("/reset", () =>
{
    pool.Stop();
    Thread.Sleep(100);
    queue.Purge();
    pool.ResetProcessed();
    return Results.Json(new { stats = BuildStats(queue, pool) });
});

Console.WriteLine($"Redis job-queue demo server listening on http://{host}:{port}");
Console.WriteLine($"Using Redis at {redisHost}:{redisPort}");
Console.WriteLine($"Visibility timeout: {visibilityMs} ms");

await app.RunAsync();
return 0;

static async Task<Dictionary<string, string>> ReadForm(HttpContext ctx)
{
    var dict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
    if (!ctx.Request.HasFormContentType)
    {
        return dict;
    }
    var form = await ctx.Request.ReadFormAsync();
    foreach (var (key, value) in form)
    {
        dict[key] = value.ToString();
    }
    return dict;
}

static int ParseInt(Dictionary<string, string> form, string key, int @default, int min, int max)
{
    if (form.TryGetValue(key, out var raw) && int.TryParse(raw, out var value))
    {
        return Math.Clamp(value, min, max);
    }
    return @default;
}

static double ParseDouble(Dictionary<string, string> form, string key, double @default, double min, double max)
{
    if (form.TryGetValue(key, out var raw) && double.TryParse(raw, out var value))
    {
        return Math.Clamp(value, min, max);
    }
    return @default;
}

static object BuildJobs(RedisJobQueue queue)
{
    var pendingIds = queue.ListPending();
    var processingIds = queue.ListProcessing();
    var completedIds = queue.ListCompleted().Take(10).ToList();
    var failedIds = queue.ListFailed().Take(10).ToList();
    return new
    {
        pending = pendingIds.Select(id => SummarizeJob(queue, id)).ToList(),
        processing = processingIds.Select(id => SummarizeJob(queue, id)).ToList(),
        completed = completedIds.Select(id => SummarizeJob(queue, id)).ToList(),
        failed = failedIds.Select(id => SummarizeJob(queue, id)).ToList(),
    };
}

static object SummarizeJob(RedisJobQueue queue, string jobId)
{
    var meta = queue.GetJob(jobId) ?? new Dictionary<string, object>();
    int attempts = 0;
    if (meta.TryGetValue("attempts", out var attemptsObj) &&
        int.TryParse(attemptsObj?.ToString(), out var parsedAttempts))
    {
        attempts = parsedAttempts;
    }
    var status = meta.TryGetValue("status", out var statusObj) && statusObj is not null
        ? statusObj.ToString() ?? "unknown"
        : "unknown";
    var payload = meta.TryGetValue("payload", out var payloadObj) && payloadObj is not null
        ? payloadObj
        : new Dictionary<string, object>();
    meta.TryGetValue("result", out var resultObj);
    meta.TryGetValue("last_error", out var lastErrorObj);
    return new
    {
        id = jobId,
        status,
        attempts,
        payload,
        result = resultObj,
        last_error = lastErrorObj,
    };
}

static IDictionary<string, object> BuildStats(RedisJobQueue queue, WorkerPool pool)
{
    var stats = queue.Stats();
    stats["workers_running"] = pool.Running;
    stats["worker_processed_total"] = pool.TotalProcessed;
    stats["work_latency_ms"] = pool.WorkLatencyMs;
    stats["fail_rate"] = pool.FailRate;
    stats["hang_rate"] = pool.HangRate;
    return stats;
}

file static class HtmlPage
{
    public static string Generate(long visibilityMs)
    {
        return Template.Replace("{visibility_ms}", visibilityMs.ToString());
    }

    private const string Template = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redis Job Queue Demo</title>
  <style>
    :root {
      --bg: #f6f1e8;
      --panel: #fffaf2;
      --ink: #1f2933;
      --accent: #b8572f;
      --accent-dark: #8f421f;
      --muted: #5d6b75;
      --line: #e7d9c6;
      --ok: #d7f0de;
      --warn: #f7dfd7;
      --hit: #c9e7d2;
      --miss: #f5d6c6;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Georgia, "Times New Roman", serif;
      color: var(--ink);
      background:
        radial-gradient(circle at top left, #fff7ea, transparent 32rem),
        linear-gradient(180deg, #f3ecdf 0%, var(--bg) 100%);
      min-height: 100vh;
    }
    main {
      max-width: 1080px;
      margin: 0 auto;
      padding: 48px 20px 72px;
    }
    h1 { font-size: clamp(2.2rem, 5vw, 4rem); line-height: 1; margin-bottom: 12px; }
    p.lede { max-width: 56rem; font-size: 1.05rem; color: var(--muted); }
    .grid {
      display: grid;
      gap: 20px;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      margin-top: 28px;
    }
    .panel {
      background: rgba(255, 250, 242, 0.92);
      border: 1px solid var(--line);
      border-radius: 18px;
      padding: 22px;
      box-shadow: 0 16px 50px rgba(105, 74, 45, 0.08);
    }
    .panel h2 { margin-top: 0; margin-bottom: 10px; }
    .pill {
      display: inline-block;
      border-radius: 999px;
      background: #efe2cf;
      color: var(--accent-dark);
      padding: 6px 10px;
      font-size: 0.9rem;
      margin-bottom: 12px;
    }
    label { display: block; font-weight: bold; margin: 12px 0 6px; }
    input, select {
      width: 100%;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid #cfbca6;
      font: inherit;
      background: white;
    }
    button {
      appearance: none;
      border: 0;
      border-radius: 999px;
      background: var(--accent);
      color: white;
      padding: 11px 18px;
      font: inherit;
      cursor: pointer;
      margin-right: 8px;
      margin-top: 12px;
    }
    button.secondary { background: #38424a; }
    button:hover { background: var(--accent-dark); }
    button.secondary:hover { background: #20282e; }
    dl { display: grid; grid-template-columns: max-content 1fr; gap: 8px 14px; margin: 0; }
    dt { font-weight: bold; }
    dd { margin: 0; word-break: break-word; }
    .badge {
      display: inline-block;
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 0.85rem;
      font-weight: bold;
    }
    .badge.pending { background: #f4e4c1; color: #5e4514; }
    .badge.processing { background: var(--miss); color: #6b3220; }
    .badge.completed { background: var(--hit); color: #1d4a2c; }
    .badge.failed { background: #f0c2bc; color: #6b1f1c; }
    .job-list { list-style: none; padding: 0; margin: 8px 0 0; max-height: 230px; overflow-y: auto; }
    .job-list li {
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 8px 10px;
      margin-bottom: 6px;
      background: #fffdf8;
      font-size: 0.92rem;
    }
    .job-list li .meta { color: var(--muted); font-size: 0.85rem; }
    pre {
      background: #f3eadc;
      border-radius: 12px;
      padding: 14px;
      overflow-x: auto;
      margin: 0;
      font-size: 0.85rem;
    }
    #status {
      margin-top: 20px;
      padding: 14px 16px;
      border-radius: 14px;
      display: none;
    }
    #status.ok { display: block; background: var(--ok); }
    #status.error { display: block; background: var(--warn); }
    @media (max-width: 600px) {
      main { padding-top: 28px; }
      button { width: 100%; }
    }
  </style>
</head>
<body>
  <main>
    <div class="pill">StackExchange.Redis + ASP.NET Core minimal API</div>
    <h1>Redis Job Queue Demo</h1>
    <p class="lede">
      Enqueue background jobs and watch a pool of workers drain them through Redis.
      Pending jobs sit in a list; each worker uses <code>BRPOPLPUSH</code> to atomically
      claim a job and move it to a processing list. Completed jobs move to a short
      history. If a worker hangs past the {visibility_ms} ms visibility timeout,
      the reclaimer moves its job back to pending so no work is lost.
    </p>

    <div class="grid">
      <section class="panel">
        <h2>Enqueue jobs</h2>
        <label for="job-kind">Kind</label>
        <select id="job-kind">
          <option value="email">email</option>
          <option value="webhook">webhook</option>
          <option value="thumbnail">thumbnail</option>
          <option value="invoice">invoice</option>
        </select>
        <label for="job-recipient">Recipient / target</label>
        <input id="job-recipient" value="user@example.com">
        <label for="job-count">How many</label>
        <input id="job-count" type="number" value="5" min="1" max="50">
        <button id="enqueue-button">Enqueue</button>
      </section>

      <section class="panel">
        <h2>Worker pool</h2>
        <label for="worker-size">Workers</label>
        <input id="worker-size" type="number" value="2" min="0" max="8">
        <label for="work-latency">Work latency (ms)</label>
        <input id="work-latency" type="number" value="400" min="0" max="5000">
        <label for="fail-rate">Failure rate (0-1)</label>
        <input id="fail-rate" type="number" step="0.05" min="0" max="1" value="0">
        <label for="hang-rate">Hang rate (simulated crash)</label>
        <input id="hang-rate" type="number" step="0.05" min="0" max="1" value="0">
        <button id="start-button">Start / apply</button>
        <button id="stop-button" class="secondary">Stop workers</button>
      </section>

      <section class="panel">
        <h2>Reclaim &amp; reset</h2>
        <p>Reclaim moves any job sitting in the processing list past the
        {visibility_ms} ms visibility timeout back to pending.</p>
        <button id="reclaim-button">Run reclaim sweep</button>
        <button id="reset-button" class="secondary">Reset queue</button>
      </section>

      <section class="panel">
        <h2>Queue stats</h2>
        <div id="stats-view">Loading...</div>
      </section>

      <section class="panel" style="grid-column: 1 / -1;">
        <h2>Pending <span id="pending-count" class="badge pending">0</span></h2>
        <ul id="pending-list" class="job-list"></ul>
      </section>

      <section class="panel" style="grid-column: 1 / -1;">
        <h2>Processing <span id="processing-count" class="badge processing">0</span></h2>
        <ul id="processing-list" class="job-list"></ul>
      </section>

      <section class="panel">
        <h2>Recent completed <span id="completed-count" class="badge completed">0</span></h2>
        <ul id="completed-list" class="job-list"></ul>
      </section>

      <section class="panel">
        <h2>Recent failed <span id="failed-count" class="badge failed">0</span></h2>
        <ul id="failed-list" class="job-list"></ul>
      </section>
    </div>

    <div id="status"></div>
  </main>

  <script>
    const statusBox = document.getElementById("status");

    function setStatus(message, kind) {
      statusBox.textContent = message;
      statusBox.className = kind;
    }

    function escapeHtml(value) {
      return String(value ?? "").replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
      })[c]);
    }

    function renderStats(stats) {
      const view = document.getElementById("stats-view");
      if (!stats) { view.textContent = "(no data)"; return; }
      view.innerHTML = `
        <dl>
          <dt>Workers running</dt><dd>${stats.workers_running}</dd>
          <dt>Pending depth</dt><dd>${stats.pending_depth}</dd>
          <dt>Processing depth</dt><dd>${stats.processing_depth}</dd>
          <dt>Enqueued total</dt><dd>${stats.enqueued_total}</dd>
          <dt>Completed total</dt><dd>${stats.completed_total}</dd>
          <dt>Failed total</dt><dd>${stats.failed_total}</dd>
          <dt>Reclaimed total</dt><dd>${stats.reclaimed_total}</dd>
          <dt>Worker processed</dt><dd>${stats.worker_processed_total}</dd>
          <dt>Visibility timeout</dt><dd>${stats.visibility_ms} ms</dd>
          <dt>Work latency</dt><dd>${stats.work_latency_ms} ms</dd>
          <dt>Failure rate</dt><dd>${stats.fail_rate}</dd>
          <dt>Hang rate</dt><dd>${stats.hang_rate}</dd>
        </dl>
      `;
    }

    function renderJobList(elementId, jobs, countId, badgeClass) {
      const list = document.getElementById(elementId);
      const count = document.getElementById(countId);
      count.textContent = jobs.length;
      count.className = `badge ${badgeClass}`;
      if (!jobs.length) { list.innerHTML = "<li><span class=meta>(empty)</span></li>"; return; }
      list.innerHTML = jobs.map((job) => {
        const payload = job.payload && typeof job.payload === "object"
          ? JSON.stringify(job.payload)
          : escapeHtml(job.payload || "");
        const extra = job.last_error
          ? ` &middot; <span class=meta>error: ${escapeHtml(job.last_error)}</span>`
          : job.result
            ? ` &middot; <span class=meta>result: ${escapeHtml(typeof job.result === "object" ? JSON.stringify(job.result) : job.result)}</span>`
            : "";
        return `<li>
          <strong>${escapeHtml(job.id)}</strong>
          <span class=badge ${badgeClass}>${escapeHtml(job.status)}</span>
          <span class=meta>attempts: ${job.attempts}</span>
          ${extra}
          <div class=meta>${escapeHtml(payload)}</div>
        </li>`;
      }).join("");
    }

    async function refresh() {
      const [jobsResponse, statsResponse] = await Promise.all([
        fetch("/jobs"),
        fetch("/stats"),
      ]);
      const jobs = await jobsResponse.json();
      const stats = await statsResponse.json();
      renderStats(stats);
      renderJobList("pending-list", jobs.pending, "pending-count", "pending");
      renderJobList("processing-list", jobs.processing, "processing-count", "processing");
      renderJobList("completed-list", jobs.completed, "completed-count", "completed");
      renderJobList("failed-list", jobs.failed, "failed-count", "failed");
    }

    document.getElementById("enqueue-button").addEventListener("click", async () => {
      const body = new URLSearchParams({
        kind: document.getElementById("job-kind").value,
        recipient: document.getElementById("job-recipient").value,
        count: document.getElementById("job-count").value,
      });
      const response = await fetch("/enqueue", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) { setStatus(data.error || "Enqueue failed.", "error"); return; }
      setStatus(`Enqueued ${data.enqueued.length} job(s).`, "ok");
      refresh();
    });

    document.getElementById("start-button").addEventListener("click", async () => {
      const body = new URLSearchParams({
        size: document.getElementById("worker-size").value,
        work_latency_ms: document.getElementById("work-latency").value,
        fail_rate: document.getElementById("fail-rate").value,
        hang_rate: document.getElementById("hang-rate").value,
      });
      await fetch("/workers/start", { method: "POST", body });
      setStatus("Workers started.", "ok");
      refresh();
    });

    document.getElementById("stop-button").addEventListener("click", async () => {
      await fetch("/workers/stop", { method: "POST" });
      setStatus("Workers stopped.", "ok");
      refresh();
    });

    document.getElementById("reclaim-button").addEventListener("click", async () => {
      const response = await fetch("/reclaim", { method: "POST" });
      const data = await response.json();
      setStatus(`Reclaimed ${data.reclaimed.length} job(s).`, "ok");
      refresh();
    });

    document.getElementById("reset-button").addEventListener("click", async () => {
      await fetch("/reset", { method: "POST" });
      setStatus("Queue reset.", "ok");
      refresh();
    });

    refresh();
    setInterval(refresh, 800);
  </script>
</body>
</html>
""";
}
