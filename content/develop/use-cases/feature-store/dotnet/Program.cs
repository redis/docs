using System.Diagnostics;
using FeatureStoreDemo;
using Microsoft.AspNetCore.Mvc;
using StackExchange.Redis;

// CLI: `--mode build-features` shells out to the batch materializer
// without spinning up the HTTP server. Defaults to running the demo
// server.
for (int i = 0; i < args.Length; i++)
{
    if (args[i] == "--mode" && i + 1 < args.Length && args[i + 1] == "build-features")
    {
        var sub = args.Where((_, idx) => idx != i && idx != i + 1).ToArray();
        return await BuildFeatures.RunCliAsync(sub);
    }
}

var host = "127.0.0.1";
var port = 8091;
var redisUri = "localhost:6379";
var keyPrefix = "fs:user:";
var batchTtlSeconds = FeatureStore.DefaultBatchTtlSeconds;
var streamingTtlSeconds = FeatureStore.DefaultStreamingTtlSeconds;
var usersPerTick = 5;
var seedUsers = 200;
var resetOnStart = true;

for (int i = 0; i < args.Length; i++)
{
    switch (args[i])
    {
        case "--host" when i + 1 < args.Length: host = args[++i]; break;
        case "--port" when i + 1 < args.Length: port = int.Parse(args[++i]); break;
        case "--redis-uri" when i + 1 < args.Length: redisUri = args[++i]; break;
        case "--key-prefix" when i + 1 < args.Length: keyPrefix = args[++i]; break;
        case "--batch-ttl-seconds" when i + 1 < args.Length: batchTtlSeconds = long.Parse(args[++i]); break;
        case "--streaming-ttl-seconds" when i + 1 < args.Length: streamingTtlSeconds = long.Parse(args[++i]); break;
        case "--users-per-tick" when i + 1 < args.Length: usersPerTick = int.Parse(args[++i]); break;
        case "--seed-users" when i + 1 < args.Length: seedUsers = int.Parse(args[++i]); break;
        case "--no-reset": resetOnStart = false; break;
        case "-h":
        case "--help":
            Console.WriteLine("Usage: dotnet run [--host H] [--port P] [--redis-uri URI] " +
                "[--key-prefix PFX] [--batch-ttl-seconds S] [--streaming-ttl-seconds S] " +
                "[--users-per-tick N] [--seed-users N] [--no-reset] " +
                "[--mode build-features (...)]");
            return 0;
    }
}

var muxOptions = ConfigurationOptions.Parse(redisUri);
muxOptions.AllowAdmin = true; // server.Keys() requires AllowAdmin
var mux = await ConnectionMultiplexer.ConnectAsync(muxOptions);

var store = new FeatureStore(mux, keyPrefix, batchTtlSeconds, streamingTtlSeconds);
var worker = new StreamingWorker(store, TimeSpan.FromSeconds(1), usersPerTick, 1337);
// Serializes materialize / reset / toggle-worker against each other
// so the pause-and-wait-for-idle dance can't race with a concurrent
// bulk-load.
var demoLock = new SemaphoreSlim(1, 1);
var demoSeed = 42;

if (resetOnStart)
{
    Console.WriteLine($"Dropping any existing users under '{keyPrefix}*' for a clean demo run (pass --no-reset to keep them).");
    await store.ResetAsync();
    store.ResetStats();
}
var seeded = await store.BulkLoadAsync(
    BuildFeatures.SynthesizeUsers(seedUsers, demoSeed),
    batchTtlSeconds);

await worker.StartAsync();

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls($"http://{host}:{port}");
builder.Logging.ClearProviders();
builder.Logging.AddConsole(o => o.LogToStandardErrorThreshold = LogLevel.Warning);
var app = builder.Build();

string IndexHtml() =>
    HtmlTemplate.Render(store.KeyPrefix, store.StreamingTtlSeconds, worker.UsersPerTick);

app.MapGet("/", () => Results.Content(IndexHtml(), "text/html; charset=utf-8"));

app.MapGet("/state", () =>
{
    var ids = store.ListEntityIds(500);
    var count = store.CountEntities();
    return Results.Json(new
    {
        key_prefix = store.KeyPrefix,
        batch_ttl_seconds = store.BatchTtlSeconds,
        streaming_ttl_seconds = store.StreamingTtlSeconds,
        entity_count = count,
        entity_ids = ids,
        stats = store.StatsSnapshot(),
        worker = worker.StatsSnapshot(),
    });
});

app.MapGet("/inspect", async ([FromQuery] string user) =>
{
    if (string.IsNullOrWhiteSpace(user))
        return Results.BadRequest(new { error = "user is required" });

    var full = await store.GetAllFeaturesAsync(user);
    var keyTtl = await store.KeyTtlSecondsAsync(user);
    if (full.Count == 0)
    {
        return Results.Json(new { exists = false, key_ttl_seconds = keyTtl });
    }
    // Iterate the known schema (batch + streaming) plus any extras
    // the hash carries so expired streaming fields surface as
    // ttl_seconds=-2 in the Inspect view rather than silently
    // disappearing.
    var names = new List<string>(FeatureStore.DefaultBatchFields);
    names.AddRange(FeatureStore.DefaultStreamingFields);
    foreach (var k in full.Keys) if (!names.Contains(k)) names.Add(k);
    var ttls = await store.FieldTtlsSecondsAsync(user, names);
    var fields = names
        .OrderBy(n => n, StringComparer.Ordinal)
        .Select(n => new
        {
            name = n,
            value = full.TryGetValue(n, out var v) ? v : "",
            ttl_seconds = ttls.TryGetValue(n, out var t) ? t : -2L,
        })
        .ToArray();
    return Results.Json(new
    {
        exists = true,
        key_ttl_seconds = keyTtl,
        fields,
    });
});

app.MapPost("/bulk-load", async (HttpRequest req) =>
{
    await demoLock.WaitAsync();
    try
    {
        var form = await req.ReadFormAsync();
        var count = Clamp(IntOr(form["count"], 200), 1, 2000);
        var ttl = (long)Clamp(IntOr(form["ttl"], 86400), 5, 172_800);
        var rows = BuildFeatures.SynthesizeUsers(count, demoSeed);
        var sw = Stopwatch.StartNew();
        var loaded = await store.BulkLoadAsync(rows, ttl);
        sw.Stop();
        return Results.Json(new
        {
            loaded,
            ttl_seconds = ttl,
            elapsed_ms = sw.Elapsed.TotalMilliseconds,
        });
    }
    finally { demoLock.Release(); }
});

app.MapPost("/reset", async () =>
{
    await demoLock.WaitAsync();
    try
    {
        // Pause + wait-for-idle around the DEL sweep so a concurrent
        // tick can't recreate a user that was just enumerated for
        // deletion (streaming HSET creates the key if it's missing).
        var wasPaused = worker.IsPaused;
        if (worker.IsRunning)
        {
            if (!wasPaused) worker.Pause();
            await worker.WaitForIdleAsync();
        }
        try
        {
            var deleted = await store.ResetAsync();
            store.ResetStats();
            worker.ResetStats();
            return Results.Json(new { deleted });
        }
        finally
        {
            if (worker.IsRunning && !wasPaused) worker.Resume();
        }
    }
    finally { demoLock.Release(); }
});

app.MapPost("/worker/toggle", async () =>
{
    await demoLock.WaitAsync();
    try
    {
        // Three states: stopped → start (and leave unpaused);
        // running + unpaused → pause; running + paused → resume.
        // StartAsync() clears the paused flag, so a fall-through
        // would pause the worker we just brought back up.
        if (!worker.IsRunning) await worker.StartAsync();
        else if (worker.IsPaused) worker.Resume();
        else worker.Pause();
        return Results.Json(new { paused = worker.IsPaused, running = worker.IsRunning });
    }
    finally { demoLock.Release(); }
});

app.MapPost("/read", async (HttpRequest req) =>
{
    var form = await req.ReadFormAsync();
    var user = form["user"].ToString().Trim();
    if (string.IsNullOrEmpty(user))
        return Results.BadRequest(new { error = "user is required" });
    var fields = form["field"].Where(f => !string.IsNullOrEmpty(f)).ToList();
    var sw = Stopwatch.StartNew();
    var values = fields.Count > 0
        ? await store.GetFeaturesAsync(user, fields!)
        : new Dictionary<string, string>();
    sw.Stop();
    var ttls = fields.Count > 0
        ? await store.FieldTtlsSecondsAsync(user, fields!)
        : new Dictionary<string, long>();
    var keyTtl = await store.KeyTtlSecondsAsync(user);
    return Results.Json(new
    {
        requested = fields,
        values,
        ttls,
        key_ttl_seconds = keyTtl,
        returned_count = values.Count,
        elapsed_ms = sw.Elapsed.TotalMilliseconds,
    });
});

app.MapPost("/batch-read", async (HttpRequest req) =>
{
    var form = await req.ReadFormAsync();
    var count = Clamp(IntOr(form["count"], 100), 1, 500);
    var fields = form["field"].Where(f => !string.IsNullOrEmpty(f)).Cast<string>().ToList();
    if (fields.Count == 0)
    {
        fields = new List<string>(FeatureStore.DefaultStreamingFields) { "risk_segment" };
    }
    var ids = store.ListEntityIds(Math.Max(count * 2, 2000));
    if (ids.Count > count) ids = ids.Take(count).ToList();
    var sw = Stopwatch.StartNew();
    var rows = await store.BatchGetFeaturesAsync(ids, fields);
    sw.Stop();
    var sample = ids.Take(10)
        .Select(id => new
        {
            id,
            field_count = rows.TryGetValue(id, out var r) ? r.Count : 0,
        })
        .ToArray();
    return Results.Json(new
    {
        entity_count = ids.Count,
        field_count = fields.Count,
        elapsed_ms = sw.Elapsed.TotalMilliseconds,
        sample,
    });
});

Console.WriteLine($"Redis feature-store demo server listening on http://{host}:{port}");
Console.WriteLine($"Using Redis at {redisUri} with key prefix '{keyPrefix}' " +
    $"(batch TTL {batchTtlSeconds}s, streaming TTL {streamingTtlSeconds}s)");
Console.WriteLine($"Materialized {seeded} user(s); streaming worker running.");

var appTask = app.RunAsync();
var shutdownTcs = new TaskCompletionSource();

// Synchronous handler only — `async void` here would swallow any
// exception from StopAsync into an unobserved task and return to
// the runtime before the awaited cleanup completes. Signal a
// completion source instead and let the main flow await the
// shutdown chain in order, with normal exception propagation.
Console.CancelKeyPress += (_, e) =>
{
    e.Cancel = true;
    Console.WriteLine("\nShutting down...");
    shutdownTcs.TrySetResult();
};

await Task.WhenAny(appTask, shutdownTcs.Task);
await worker.StopAsync();
await app.StopAsync();
await mux.CloseAsync();
await appTask;
return 0;

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

static int Clamp(int v, int lo, int hi) => Math.Max(lo, Math.Min(hi, v));

static int IntOr(Microsoft.Extensions.Primitives.StringValues sv, int def)
{
    return int.TryParse(sv.ToString(), out var n) ? n : def;
}
