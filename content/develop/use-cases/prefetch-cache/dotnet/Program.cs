using PrefetchCacheDemo;
using StackExchange.Redis;

// .NET grows its ThreadPool gradually (~2 threads/sec under load),
// which can starve polling threads in the pause/resume race test and
// produce false fall-through reads. Raising the floor up front keeps
// the demo's "cache converges to the primary state under load"
// behaviour clean. A production helper would be async (HashGetAllAsync,
// await Task.Delay) and avoid this entirely.
ThreadPool.SetMinThreads(64, 64);

// pauseMu serialises /clear and /reprefetch so two concurrent admin
// callers cannot pause/resume each other into a sync-worker live state.
// Mirrors the `pauseMu sync.Mutex` in the go-redis port.
var pauseMu = new object();

var host = "127.0.0.1";
var port = 8787;
var redisHost = "localhost";
var redisPort = 6379;
var cachePrefix = "cache:category:";
var ttlSeconds = 3600;
var primaryLatencyMs = 80;

for (var i = 0; i < args.Length; i++)
{
    switch (args[i])
    {
        case "--host" when i + 1 < args.Length: host = args[++i]; break;
        case "--port" when i + 1 < args.Length: port = int.Parse(args[++i]); break;
        case "--redis-host" when i + 1 < args.Length: redisHost = args[++i]; break;
        case "--redis-port" when i + 1 < args.Length: redisPort = int.Parse(args[++i]); break;
        case "--cache-prefix" when i + 1 < args.Length: cachePrefix = args[++i]; break;
        case "--ttl-seconds" when i + 1 < args.Length: ttlSeconds = int.Parse(args[++i]); break;
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
    var configuration = ConfigurationOptions.Parse($"{redisHost}:{redisPort}");
    configuration.AllowAdmin = true; // Required for SCAN-based enumeration via IServer.Keys.
    redis = ConnectionMultiplexer.Connect(configuration);
    redis.GetDatabase().Ping();
}
catch (Exception ex)
{
    Console.Error.WriteLine($"Failed to connect to Redis at {redisHost}:{redisPort}: {ex.Message}");
    return 1;
}

var cache = new PrefetchCache(redis.GetDatabase(), prefix: cachePrefix, ttlSeconds: ttlSeconds);
var primary = new MockPrimaryStore(primaryLatencyMs);
var sync = new SyncWorker(primary, cache);

var startupSw = System.Diagnostics.Stopwatch.StartNew();
cache.Clear();
var initialLoaded = cache.BulkLoad(primary.ListRecords());
startupSw.Stop();
sync.Start();

var builder = WebApplication.CreateBuilder();
builder.WebHost.UseUrls($"http://{host}:{port}");
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

app.MapGet("/", () => Results.Content(HtmlPage.Generate(cache.TtlSeconds), "text/html; charset=utf-8"));

app.MapGet("/categories", () => Results.Json(new
{
    cache_ids = cache.Ids(),
    primary_ids = primary.ListIds(),
}));

app.MapGet("/read", (string? id) =>
{
    if (string.IsNullOrEmpty(id))
    {
        return Results.BadRequest(new { error = "Missing 'id' query parameter." });
    }
    var result = cache.Get(id);
    return Results.Json(new
    {
        id,
        record = result.Record,
        hit = result.Hit,
        redis_latency_ms = Round2(result.RedisLatencyMs),
        ttl_remaining = cache.TtlRemaining(id),
        stats = BuildStats(),
    });
});

app.MapGet("/stats", () => Results.Json(BuildStats()));

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
        return Results.NotFound(new { error = $"Unknown category '{id}'." });
    }
    return Results.Json(new { id, field, value, stats = BuildStats() });
});

app.MapPost("/add", async (HttpContext ctx) =>
{
    var form = await ctx.Request.ReadFormAsync();
    var id = form["id"].ToString().Trim();
    var name = form["name"].ToString().Trim();
    if (string.IsNullOrEmpty(id) || string.IsNullOrEmpty(name))
    {
        return Results.BadRequest(new { error = "Missing 'id' or 'name'." });
    }
    var displayOrder = form["display_order"].ToString();
    if (string.IsNullOrEmpty(displayOrder)) displayOrder = "99";
    var featured = form["featured"].ToString();
    if (string.IsNullOrEmpty(featured)) featured = "false";
    var parentId = form["parent_id"].ToString();
    var record = new Dictionary<string, string>(StringComparer.Ordinal)
    {
        ["id"] = id,
        ["name"] = name,
        ["display_order"] = displayOrder,
        ["featured"] = featured,
        ["parent_id"] = parentId,
    };
    if (!primary.AddRecord(record))
    {
        return Results.Json(new { error = $"Category '{id}' already exists." }, statusCode: 409);
    }
    return Results.Json(new { id, record, stats = BuildStats() });
});

app.MapPost("/delete", async (HttpContext ctx) =>
{
    var form = await ctx.Request.ReadFormAsync();
    var id = form["id"].ToString();
    if (string.IsNullOrEmpty(id))
    {
        return Results.BadRequest(new { error = "Missing 'id'." });
    }
    if (!primary.DeleteRecord(id))
    {
        return Results.NotFound(new { error = $"Unknown category '{id}'." });
    }
    return Results.Json(new { id, stats = BuildStats() });
});

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

app.MapPost("/clear", () =>
{
    // Serialise admin handlers so two concurrent callers cannot
    // pause/resume each other into a sync-worker live state.
    lock (pauseMu)
    {
        // Pause the sync worker so it cannot recreate keys between SCAN
        // and DEL. Queued events accumulate and apply after resume.
        sync.Pause();
        int deleted;
        try
        {
            deleted = cache.Clear();
        }
        finally
        {
            sync.Resume();
        }
        return Results.Json(new { deleted, stats = BuildStats() });
    }
});

app.MapPost("/reprefetch", () =>
{
    // Serialise admin handlers so two concurrent callers cannot
    // pause/resume each other into a sync-worker live state.
    lock (pauseMu)
    {
        // Pause the sync worker so it cannot interleave with the
        // clear + snapshot + bulk_load sequence. Without this, a change
        // applied between ListRecords() and BulkLoad() would be overwritten
        // by the stale snapshot.
        sync.Pause();
        int loaded;
        double elapsedMs;
        try
        {
            var sw = System.Diagnostics.Stopwatch.StartNew();
            cache.Clear();
            loaded = cache.BulkLoad(primary.ListRecords());
            sw.Stop();
            elapsedMs = sw.Elapsed.TotalMilliseconds;
        }
        finally
        {
            sync.Resume();
        }
        return Results.Json(new
        {
            loaded,
            elapsed_ms = Round2(elapsedMs),
            stats = BuildStats(),
        });
    }
});

app.MapPost("/reset", () =>
{
    cache.ResetStats();
    primary.ResetReads();
    return Results.Json(BuildStats());
});

Console.WriteLine($"Redis prefetch-cache demo server listening on http://{host}:{port}");
Console.WriteLine(
    $"Using Redis at {redisHost}:{redisPort}" +
    $" with cache prefix '{cachePrefix}' and TTL {ttlSeconds}s");
Console.WriteLine($"Prefetched {initialLoaded} records in {startupSw.Elapsed.TotalMilliseconds:F1} ms; sync worker running");

AppDomain.CurrentDomain.ProcessExit += (_, _) => sync.Stop();
Console.CancelKeyPress += (_, _) => sync.Stop();

app.Run();
sync.Stop();
return 0;

static class HtmlPage
{
    public static string Generate(int cacheTtl)
    {
        return Template.Replace("__CACHE_TTL__", cacheTtl.ToString());
    }

    // Verbatim copy of the Python reference's HTML_TEMPLATE. The pill
    // text is changed to describe the .NET stack; everything else is
    // identical so the demo UI matches across clients.
    private const string Template = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redis Prefetch Cache Demo</title>
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
    main { max-width: 980px; margin: 0 auto; padding: 48px 20px 72px; }
    h1 { font-size: clamp(2.2rem, 5vw, 4rem); line-height: 1; margin-bottom: 12px; }
    p.lede { max-width: 52rem; font-size: 1.1rem; color: var(--muted); }
    .grid {
      display: grid; gap: 20px;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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
      display: inline-block; border-radius: 999px;
      background: #efe2cf; color: var(--accent-dark);
      padding: 6px 10px; font-size: 0.9rem; margin-bottom: 12px;
    }
    label { display: block; font-weight: bold; margin: 12px 0 6px; }
    input, select {
      width: 100%; padding: 10px 12px;
      border-radius: 10px; border: 1px solid #cfbca6;
      font: inherit; background: white;
    }
    button {
      appearance: none; border: 0; border-radius: 999px;
      background: var(--accent); color: white;
      padding: 11px 18px; font: inherit; cursor: pointer;
      margin-right: 8px; margin-top: 12px;
    }
    button.secondary { background: #38424a; }
    button.danger { background: #8a3a3a; }
    button:hover { background: var(--accent-dark); }
    button.secondary:hover { background: #20282e; }
    button.danger:hover { background: #6b2929; }
    dl { display: grid; grid-template-columns: max-content 1fr; gap: 8px 14px; margin: 0; }
    dt { font-weight: bold; }
    dd { margin: 0; word-break: break-word; }
    .badge {
      display: inline-block; border-radius: 6px;
      padding: 3px 8px; font-size: 0.85rem; font-weight: bold;
    }
    .badge.hit { background: var(--hit); color: #1d4a2c; }
    .badge.miss { background: var(--miss); color: #6b3220; }
    .row { display: flex; gap: 8px; flex-wrap: wrap; }
    .row > * { flex: 1 1 0; min-width: 120px; }
    #status {
      margin-top: 20px; padding: 14px 16px;
      border-radius: 14px; display: none;
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
    <h1>Redis Prefetch Cache Demo</h1>
    <p class="lede">
      Every record from the primary store has been pre-loaded into Redis.
      Reads run <code>HGETALL</code> against Redis only &mdash; there is no
      fall-back to the primary on the read path. When you add, update, or
      delete a record, the primary emits a change event that a background
      sync worker applies to Redis within a few milliseconds. A long
      safety-net TTL (__CACHE_TTL__ s) is refreshed on every add or update
      event (delete events remove the key) and bounds memory if sync ever stops.
    </p>

    <div class="grid">
      <section class="panel" style="grid-column: 1 / -1;">
        <h2>Cache state</h2>
        <div id="state-view">Loading...</div>
        <button id="refresh-state">Refresh state</button>
      </section>

      <section class="panel">
        <h2>Read a category</h2>
        <p>Reads come from Redis only. Every read should be a hit because
        the cache was pre-loaded and the sync worker keeps it current.</p>
        <label for="read-id">Category ID</label>
        <select id="read-id"></select>
        <button id="read-button">Read from cache</button>
      </section>

      <section class="panel">
        <h2>Update a field</h2>
        <p>Updates write to the primary. The sync worker picks up the
        change event and rewrites the cache hash within milliseconds.</p>
        <label for="update-id">Category</label>
        <select id="update-id"></select>
        <label for="update-field">Field</label>
        <select id="update-field">
          <option value="name">name</option>
          <option value="display_order">display_order</option>
          <option value="featured">featured</option>
          <option value="parent_id">parent_id</option>
        </select>
        <label for="update-value">New value</label>
        <input id="update-value" value="true">
        <button id="update-button">Apply update</button>
      </section>

      <section class="panel">
        <h2>Add a category</h2>
        <p>Inserts to the primary propagate to the cache through the same
        sync path.</p>
        <label for="add-id">ID</label>
        <input id="add-id" value="cat-006">
        <label for="add-name">Name</label>
        <input id="add-name" value="Seasonal">
        <label for="add-display-order">Display order</label>
        <input id="add-display-order" value="6">
        <button id="add-button">Add to primary</button>
      </section>

      <section class="panel">
        <h2>Delete a category</h2>
        <p>Deletes remove the record from the primary, and the sync worker
        removes the cache entry.</p>
        <label for="delete-id">Category</label>
        <select id="delete-id"></select>
        <button id="delete-button" class="danger">Delete from primary</button>
      </section>

      <section class="panel">
        <h2>Break the cache</h2>
        <p>Simulate a failure of the sync pipeline. Reads against the
        affected key(s) return a miss until you re-prefetch.</p>
        <label for="invalidate-id">Category</label>
        <select id="invalidate-id"></select>
        <div class="row">
          <button id="invalidate-button" class="secondary">Invalidate one</button>
          <button id="clear-button" class="danger">Clear all</button>
        </div>
        <button id="reprefetch-button">Re-prefetch from primary</button>
      </section>

      <section class="panel">
        <h2>Cache stats</h2>
        <div id="stats-view">Loading...</div>
        <button id="reset-button" class="secondary">Reset counters</button>
      </section>

      <section class="panel" style="grid-column: 1 / -1;">
        <h2>Last result</h2>
        <div id="result-view"><p>Read a category to see the cached record and timing.</p></div>
      </section>
    </div>

    <div id="status"></div>
  </main>

  <script>
    const stateView = document.getElementById("state-view");
    const readIdSelect = document.getElementById("read-id");
    const updateIdSelect = document.getElementById("update-id");
    const updateField = document.getElementById("update-field");
    const updateValue = document.getElementById("update-value");
    const addId = document.getElementById("add-id");
    const addName = document.getElementById("add-name");
    const addDisplayOrder = document.getElementById("add-display-order");
    const deleteIdSelect = document.getElementById("delete-id");
    const invalidateIdSelect = document.getElementById("invalidate-id");
    const statsView = document.getElementById("stats-view");
    const resultView = document.getElementById("result-view");
    const statusBox = document.getElementById("status");

    function setStatus(message, kind) {
      statusBox.textContent = message;
      statusBox.className = kind;
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    }

    function renderState(data) {
      const cacheIds = data.cache_ids || [];
      const primaryIds = data.primary_ids || [];
      const missing = primaryIds.filter((id) => !cacheIds.includes(id));
      const orphaned = cacheIds.filter((id) => !primaryIds.includes(id));
      stateView.innerHTML = `
        <dl>
          <dt>In cache</dt><dd>${cacheIds.length} (${cacheIds.map(escapeHtml).join(", ") || "&mdash;"})</dd>
          <dt>In primary</dt><dd>${primaryIds.length} (${primaryIds.map(escapeHtml).join(", ") || "&mdash;"})</dd>
          <dt>Missing from cache</dt><dd>${missing.length ? missing.map(escapeHtml).join(", ") : "none"}</dd>
          <dt>Orphaned in cache</dt><dd>${orphaned.length ? orphaned.map(escapeHtml).join(", ") : "none"}</dd>
        </dl>`;
      const select = (el, ids) => {
        const previous = el.value;
        el.innerHTML = ids.map((id) =>
          `<option value="${escapeHtml(id)}">${escapeHtml(id)}</option>`).join("");
        if (ids.includes(previous)) el.value = previous;
      };
      select(readIdSelect, cacheIds.length ? cacheIds : primaryIds);
      select(updateIdSelect, primaryIds);
      select(deleteIdSelect, primaryIds);
      select(invalidateIdSelect, cacheIds);
    }

    function renderStats(stats) {
      if (!stats) { statsView.textContent = "(no data)"; return; }
      statsView.innerHTML = `
        <dl>
          <dt>Hits</dt><dd>${stats.hits}</dd>
          <dt>Misses</dt><dd>${stats.misses}</dd>
          <dt>Hit rate</dt><dd>${stats.hit_rate_pct}%</dd>
          <dt>Prefetched</dt><dd>${stats.prefetched}</dd>
          <dt>Sync events applied</dt><dd>${stats.sync_events_applied}</dd>
          <dt>Avg sync lag</dt><dd>${stats.sync_lag_ms_avg} ms</dd>
          <dt>Primary reads (total)</dt><dd>${stats.primary_reads_total}</dd>
        </dl>`;
    }

    function renderRead(data) {
      if (!data || !data.record) {
        resultView.innerHTML = `<p><span class="badge miss">cache miss</span> &nbsp;
          No entry in Redis for <strong>${escapeHtml(data.id)}</strong>.</p>
          <p>With a healthy prefetch and sync, this should never happen on
          a valid id &mdash; it means either the sync pipeline is behind
          or the entry has been invalidated.</p>`;
        return;
      }
      const r = data.record;
      const badge = data.hit
        ? '<span class="badge hit">cache hit</span>'
        : '<span class="badge miss">cache miss</span>';
      resultView.innerHTML = `
        <p>${badge} &nbsp; Redis read: <strong>${data.redis_latency_ms} ms</strong>
           &nbsp; TTL remaining: <strong>${data.ttl_remaining} s</strong></p>
        <dl>
          <dt>id</dt><dd>${escapeHtml(r.id ?? "")}</dd>
          <dt>name</dt><dd>${escapeHtml(r.name ?? "")}</dd>
          <dt>display_order</dt><dd>${escapeHtml(r.display_order ?? "")}</dd>
          <dt>featured</dt><dd>${escapeHtml(r.featured ?? "")}</dd>
          <dt>parent_id</dt><dd>${escapeHtml(r.parent_id ?? "")}</dd>
        </dl>`;
    }

    async function loadState() {
      const [state, stats] = await Promise.all([
        fetch("/categories").then((r) => r.json()),
        fetch("/stats").then((r) => r.json()),
      ]);
      renderState(state);
      renderStats(stats);
    }

    async function refreshAfter(message, kind, payload) {
      if (payload && payload.stats) renderStats(payload.stats);
      await loadState();
      setStatus(message, kind);
    }

    document.getElementById("refresh-state").addEventListener("click", loadState);

    document.getElementById("read-button").addEventListener("click", async () => {
      const id = readIdSelect.value;
      if (!id) { setStatus("No id selected.", "error"); return; }
      const r = await fetch(`/read?id=${encodeURIComponent(id)}`);
      const d = await r.json();
      renderRead(d);
      if (d.stats) renderStats(d.stats);
      setStatus(d.hit ? "Served from Redis." : "Cache miss — no entry in Redis.", d.hit ? "ok" : "error");
    });

    document.getElementById("update-button").addEventListener("click", async () => {
      const id = updateIdSelect.value;
      const body = new URLSearchParams({ id, field: updateField.value, value: updateValue.value });
      const r = await fetch("/update", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Update failed.", "error"); return; }
      refreshAfter("Primary updated; sync worker will apply the change to Redis.", "ok", d);
    });

    document.getElementById("add-button").addEventListener("click", async () => {
      const body = new URLSearchParams({
        id: addId.value,
        name: addName.value,
        display_order: addDisplayOrder.value,
        featured: "false",
        parent_id: "",
      });
      const r = await fetch("/add", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Add failed.", "error"); return; }
      refreshAfter("Added to primary; sync worker will populate the cache.", "ok", d);
    });

    document.getElementById("delete-button").addEventListener("click", async () => {
      const id = deleteIdSelect.value;
      const body = new URLSearchParams({ id });
      const r = await fetch("/delete", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Delete failed.", "error"); return; }
      refreshAfter("Deleted from primary; sync worker will remove the cache entry.", "ok", d);
    });

    document.getElementById("invalidate-button").addEventListener("click", async () => {
      const id = invalidateIdSelect.value;
      if (!id) { setStatus("Nothing in the cache to invalidate.", "error"); return; }
      const body = new URLSearchParams({ id });
      const r = await fetch("/invalidate", { method: "POST", body });
      const d = await r.json();
      refreshAfter(d.deleted ? `Cache entry for ${id} deleted.` : "No cache entry to delete.", "ok", d);
    });

    document.getElementById("clear-button").addEventListener("click", async () => {
      const r = await fetch("/clear", { method: "POST" });
      const d = await r.json();
      refreshAfter(`Cleared ${d.deleted} cache entries. Reads will miss until you re-prefetch.`, "ok", d);
    });

    document.getElementById("reprefetch-button").addEventListener("click", async () => {
      setStatus("Re-prefetching all records...", "ok");
      const r = await fetch("/reprefetch", { method: "POST" });
      const d = await r.json();
      refreshAfter(`Re-prefetched ${d.loaded} records in ${d.elapsed_ms} ms.`, "ok", d);
    });

    document.getElementById("reset-button").addEventListener("click", async () => {
      const r = await fetch("/reset", { method: "POST" });
      const d = await r.json();
      renderStats(d);
      setStatus("Counters reset.", "ok");
    });

    loadState();
  </script>
</body>
</html>
""";
}

