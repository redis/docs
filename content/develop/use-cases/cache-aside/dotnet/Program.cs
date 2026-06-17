using CacheAsideDemo;
using StackExchange.Redis;

// .NET grows its ThreadPool gradually, which can starve polling threads in
// the stampede test and cause some callers to time out and re-issue the
// primary read. Raising the floor up front keeps the demo's "1 primary read
// for N concurrent callers" behaviour clean. Most production cache-aside
// helpers would be async (await Task.Delay) and avoid this entirely.
ThreadPool.SetMinThreads(64, 64);

var port = 8080;
var redisHost = "localhost";
var redisPort = 6379;
var ttl = 30;
var primaryLatencyMs = 150;

for (var i = 0; i < args.Length; i++)
{
    switch (args[i])
    {
        case "--port" when i + 1 < args.Length: port = int.Parse(args[++i]); break;
        case "--redis-host" when i + 1 < args.Length: redisHost = args[++i]; break;
        case "--redis-port" when i + 1 < args.Length: redisPort = int.Parse(args[++i]); break;
        case "--ttl" when i + 1 < args.Length: ttl = int.Parse(args[++i]); break;
        case "--primary-latency-ms" when i + 1 < args.Length: primaryLatencyMs = int.Parse(args[++i]); break;
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

var cache = new RedisCache(redis.GetDatabase(), ttl: ttl);
var primary = new MockPrimaryStore(primaryLatencyMs);

var builder = WebApplication.CreateBuilder();
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
builder.Logging.SetMinimumLevel(LogLevel.Warning);
var app = builder.Build();

Dictionary<string, object> BuildStats()
{
    var stats = cache.Stats();
    stats["primary_reads_total"] = primary.Reads;
    stats["primary_read_latency_ms"] = primary.ReadLatencyMs;
    return stats;
}

double Round2(double value) => Math.Round(value, 2);

app.MapGet("/", () => Results.Content(
    HtmlPage.Generate(primary.ListIds(), primary.ReadLatencyMs, cache.Ttl),
    "text/html"));

app.MapGet("/products", () => Results.Json(new { products = primary.ListIds() }));

app.MapGet("/read", (string? id) =>
{
    if (string.IsNullOrEmpty(id))
    {
        return Results.BadRequest(new { error = "Missing 'id' query parameter." });
    }
    var sw = System.Diagnostics.Stopwatch.StartNew();
    var result = cache.Get(id, primary.Read);
    sw.Stop();
    if (result.Record is null)
    {
        return Results.NotFound(new { error = $"No record for '{id}'." });
    }
    return Results.Json(new
    {
        id,
        record = result.Record,
        hit = result.Hit,
        redis_latency_ms = Round2(result.RedisLatencyMs),
        total_latency_ms = Round2(sw.Elapsed.TotalMilliseconds),
        ttl_remaining = cache.TtlRemaining(id),
        stats = BuildStats(),
    });
});

app.MapGet("/stats", () => Results.Json(BuildStats()));

app.MapPost("/invalidate", async (HttpContext ctx) =>
{
    var form = await ctx.Request.ReadFormAsync();
    var id = form["id"].ToString();
    if (string.IsNullOrEmpty(id))
    {
        return Results.BadRequest(new { error = "Missing 'id'." });
    }
    var deleted = cache.Invalidate(id);
    return Results.Json(new { id, deleted, stats = BuildStats() });
});

app.MapPost("/update", async (HttpContext ctx) =>
{
    var form = await ctx.Request.ReadFormAsync();
    var id = form["id"].ToString();
    var field = form["field"].ToString();
    var value = form["value"].ToString();
    if (string.IsNullOrEmpty(id) || string.IsNullOrEmpty(field))
    {
        return Results.BadRequest(new { error = "Missing 'id' or 'field'." });
    }
    if (!primary.UpdateField(id, field, value))
    {
        return Results.NotFound(new { error = "Unknown product." });
    }
    cache.Invalidate(id);
    return Results.Json(new { id, field, value, stats = BuildStats() });
});

app.MapPost("/stampede", async (HttpContext ctx) =>
{
    var form = await ctx.Request.ReadFormAsync();
    var id = form["id"].ToString();
    if (string.IsNullOrEmpty(id))
    {
        return Results.BadRequest(new { error = "Missing 'id'." });
    }
    var concurrency = int.TryParse(form["concurrency"], out var c) ? c : 20;
    concurrency = Math.Max(2, Math.Min(50, concurrency));

    cache.Invalidate(id);
    var primaryBefore = primary.Reads;
    var sw = System.Diagnostics.Stopwatch.StartNew();
    var tasks = new Task<RedisCache.Result>[concurrency];
    for (var i = 0; i < concurrency; i++)
    {
        tasks[i] = Task.Run(() => cache.Get(id, primary.Read));
    }
    var allResults = await Task.WhenAll(tasks);
    sw.Stop();
    var results = allResults.Select(r => new
    {
        hit = r.Hit,
        redis_latency_ms = Round2(r.RedisLatencyMs),
        found = r.Record is not null,
    }).ToArray();
    var primaryDuring = primary.Reads - primaryBefore;

    return Results.Json(new
    {
        id,
        concurrency,
        primary_reads = primaryDuring,
        elapsed_ms = Round2(sw.Elapsed.TotalMilliseconds),
        results,
        stats = BuildStats(),
    });
});

app.MapPost("/reset", () =>
{
    cache.ResetStats();
    primary.ResetReads();
    return Results.Json(BuildStats());
});

Console.WriteLine($"Redis cache-aside demo server listening on http://localhost:{port}");
Console.WriteLine($"Using Redis at {redisHost}:{redisPort} with cache TTL {ttl}s");
Console.WriteLine($"Mock primary read latency: {primaryLatencyMs} ms");
app.Run();
return 0;

static class HtmlPage
{
    public static string Generate(IList<string> productIds, int primaryLatencyMs, int cacheTtl)
    {
        var options = string.Concat(productIds.Select(id =>
        {
            var safe = System.Net.WebUtility.HtmlEncode(id);
            return $"<option value=\"{safe}\">{safe}</option>";
        }));
        return Template
            .Replace("{{OPTIONS}}", options)
            .Replace("{{PRIMARY_LATENCY}}", primaryLatencyMs.ToString())
            .Replace("{{CACHE_TTL}}", cacheTtl.ToString());
    }

    private const string Template = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redis Cache-Aside Demo</title>
  <style>
    :root { --bg:#f6f1e8;--panel:#fffaf2;--ink:#1f2933;--accent:#b8572f;--accent-dark:#8f421f;
      --muted:#5d6b75;--line:#e7d9c6;--ok:#d7f0de;--warn:#f7dfd7;--hit:#c9e7d2;--miss:#f5d6c6; }
    * { box-sizing:border-box; }
    body { margin:0;font-family:Georgia,"Times New Roman",serif;color:var(--ink);
      background:radial-gradient(circle at top left,#fff7ea,transparent 32rem),
        linear-gradient(180deg,#f3ecdf 0%,var(--bg) 100%);min-height:100vh; }
    main { max-width:980px;margin:0 auto;padding:48px 20px 72px; }
    h1 { font-size:clamp(2.2rem,5vw,4rem);line-height:1;margin-bottom:12px; }
    p.lede { max-width:52rem;font-size:1.1rem;color:var(--muted); }
    .grid { display:grid;gap:20px;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));margin-top:28px; }
    .panel { background:rgba(255,250,242,0.92);border:1px solid var(--line);border-radius:18px;
      padding:22px;box-shadow:0 16px 50px rgba(105,74,45,0.08); }
    .panel h2 { margin-top:0;margin-bottom:10px; }
    .pill { display:inline-block;border-radius:999px;background:#efe2cf;color:var(--accent-dark);
      padding:6px 10px;font-size:0.9rem;margin-bottom:12px; }
    label { display:block;font-weight:bold;margin:12px 0 6px; }
    input,select { width:100%;padding:10px 12px;border-radius:10px;border:1px solid #cfbca6;font:inherit;background:white; }
    button { appearance:none;border:0;border-radius:999px;background:var(--accent);color:white;
      padding:11px 18px;font:inherit;cursor:pointer;margin-right:8px;margin-top:12px; }
    button.secondary { background:#38424a; }
    button:hover { background:var(--accent-dark); }
    button.secondary:hover { background:#20282e; }
    dl { display:grid;grid-template-columns:max-content 1fr;gap:8px 14px;margin:0; }
    dt { font-weight:bold; } dd { margin:0;word-break:break-word; }
    .badge { display:inline-block;border-radius:6px;padding:3px 8px;font-size:0.85rem;font-weight:bold; }
    .badge.hit { background:var(--hit);color:#1d4a2c; }
    .badge.miss { background:var(--miss);color:#6b3220; }
    #status { margin-top:20px;padding:14px 16px;border-radius:14px;display:none; }
    #status.ok { display:block;background:var(--ok); }
    #status.error { display:block;background:var(--warn); }
    @media (max-width:600px){ main{padding-top:28px;} button{width:100%;} }
  </style>
</head>
<body>
  <main>
    <div class="pill">StackExchange.Redis + ASP.NET Core minimal API</div>
    <h1>Redis Cache-Aside Demo</h1>
    <p class="lede">
      Read product records through Redis. The first read of any key falls
      through to a deliberately slow primary store ({{PRIMARY_LATENCY}} ms per
      read); subsequent reads come from Redis until the {{CACHE_TTL}}-second TTL
      expires or the entry is invalidated. The stampede test fires concurrent
      reads at a cold key to show a single-flight Lua lock funnelling them
      down to one primary read.
    </p>
    <div class="grid">
      <section class="panel">
        <h2>Read a product</h2>
        <label for="product-id">Product ID</label>
        <select id="product-id">{{OPTIONS}}</select>
        <button id="read-button">Read through cache</button>
        <button id="invalidate-button" class="secondary">Invalidate cache</button>
        <p>Read once to populate the cache, then again to see the hit. Wait
        for the TTL to pass or click <em>Invalidate</em> to force a miss.</p>
      </section>
      <section class="panel">
        <h2>Update a field</h2>
        <p>Updating writes to the primary and deletes the cache entry, so the
        next read sees the new value.</p>
        <label for="update-field">Field</label>
        <select id="update-field">
          <option value="name">name</option>
          <option value="price_cents">price_cents</option>
          <option value="stock">stock</option>
        </select>
        <label for="update-value">New value</label>
        <input id="update-value" value="999">
        <button id="update-button">Apply update</button>
      </section>
      <section class="panel">
        <h2>Stampede test</h2>
        <p>Invalidates the selected key, then fires N concurrent reads. With
        single-flight enabled, only one of those reads should hit the primary.</p>
        <label for="stampede-concurrency">Concurrent readers</label>
        <input id="stampede-concurrency" type="number" value="20" min="2" max="50">
        <button id="stampede-button">Run stampede test</button>
      </section>
      <section class="panel">
        <h2>Cache stats</h2>
        <div id="stats-view">Loading...</div>
        <button id="reset-button" class="secondary">Reset counters</button>
      </section>
      <section class="panel" style="grid-column: 1 / -1;">
        <h2>Last result</h2>
        <div id="result-view"><p>Read a product to see the cached record and timing.</p></div>
      </section>
    </div>
    <div id="status"></div>
  </main>
  <script>
    const productSelect = document.getElementById("product-id");
    const updateField = document.getElementById("update-field");
    const updateValue = document.getElementById("update-value");
    const stampedeConcurrency = document.getElementById("stampede-concurrency");
    const statsView = document.getElementById("stats-view");
    const resultView = document.getElementById("result-view");
    const statusBox = document.getElementById("status");
    function setStatus(message, kind) { statusBox.textContent = message; statusBox.className = kind; }
    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
    function renderStats(stats) {
      if (!stats) { statsView.textContent = "(no data)"; return; }
      statsView.innerHTML = `<dl>
        <dt>Hits</dt><dd>${stats.hits}</dd>
        <dt>Misses</dt><dd>${stats.misses}</dd>
        <dt>Hit rate</dt><dd>${stats.hit_rate_pct}%</dd>
        <dt>Stampedes suppressed</dt><dd>${stats.stampedes_suppressed}</dd>
        <dt>Primary reads (total)</dt><dd>${stats.primary_reads_total}</dd>
        <dt>Primary read latency</dt><dd>${stats.primary_read_latency_ms} ms</dd>
      </dl>`;
    }
    function renderRead(data) {
      if (!data || !data.record) { resultView.innerHTML = "<p>(no record)</p>"; return; }
      const r = data.record;
      const badge = data.hit ? '<span class="badge hit">cache hit</span>' : '<span class="badge miss">cache miss</span>';
      resultView.innerHTML = `<p>${badge} &nbsp; Redis read: <strong>${data.redis_latency_ms} ms</strong>
        &nbsp; Total: <strong>${data.total_latency_ms} ms</strong>
        &nbsp; TTL remaining: <strong>${data.ttl_remaining} s</strong></p>
        <dl>
          <dt>id</dt><dd>${escapeHtml(r.id ?? "")}</dd>
          <dt>name</dt><dd>${escapeHtml(r.name ?? "")}</dd>
          <dt>price_cents</dt><dd>${escapeHtml(r.price_cents ?? "")}</dd>
          <dt>stock</dt><dd>${escapeHtml(r.stock ?? "")}</dd>
        </dl>`;
    }
    function renderStampede(data) {
      const hits = data.results.filter((r) => r.hit).length;
      const misses = data.results.length - hits;
      resultView.innerHTML = `<p>Fired <strong>${data.concurrency}</strong> concurrent reads in
        <strong>${data.elapsed_ms}</strong> ms.</p>
        <p>Cache misses: <strong>${misses}</strong> &nbsp;
           Cache hits: <strong>${hits}</strong> &nbsp;
           Primary reads: <strong>${data.primary_reads}</strong></p>
        <p>With stampede protection, primary reads should be 1 even though all
           ${data.concurrency} callers raced for a cold key. Without it, every
           concurrent miss would query the primary independently.</p>`;
    }
    async function loadStats() { renderStats(await (await fetch("/stats")).json()); }
    document.getElementById("read-button").addEventListener("click", async () => {
      const id = productSelect.value;
      const r = await fetch(`/read?id=${encodeURIComponent(id)}`);
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Read failed.", "error"); return; }
      renderRead(d); renderStats(d.stats);
      setStatus(d.hit ? "Served from Redis." : "Loaded from primary and cached.", "ok");
    });
    document.getElementById("invalidate-button").addEventListener("click", async () => {
      const id = productSelect.value;
      const r = await fetch("/invalidate", { method: "POST", body: new URLSearchParams({ id }) });
      const d = await r.json();
      renderStats(d.stats);
      setStatus(d.deleted ? "Cache key deleted." : "No cache entry to delete.", "ok");
    });
    document.getElementById("update-button").addEventListener("click", async () => {
      const id = productSelect.value;
      const r = await fetch("/update", { method: "POST",
        body: new URLSearchParams({ id, field: updateField.value, value: updateValue.value }) });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Update failed.", "error"); return; }
      renderStats(d.stats); setStatus("Primary updated; cache invalidated.", "ok");
    });
    document.getElementById("stampede-button").addEventListener("click", async () => {
      const id = productSelect.value;
      setStatus("Running stampede test...", "ok");
      const r = await fetch("/stampede", { method: "POST",
        body: new URLSearchParams({ id, concurrency: stampedeConcurrency.value }) });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Test failed.", "error"); return; }
      renderStampede(d); renderStats(d.stats);
      setStatus(`Stampede complete: ${d.primary_reads} primary read(s) for ${d.concurrency} concurrent callers.`, "ok");
    });
    document.getElementById("reset-button").addEventListener("click", async () => {
      const r = await fetch("/reset", { method: "POST" });
      renderStats(await r.json()); setStatus("Counters reset.", "ok");
    });
    loadStats();
  </script>
</body>
</html>
""";
}
