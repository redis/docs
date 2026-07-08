---
aliases:
- /develop/use-cases/feature-store/stackexchange.redis
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Build a Redis-backed online feature store in .NET with StackExchange.Redis
linkTitle: StackExchange.Redis example (C#)
title: Redis feature store with StackExchange.Redis
weight: 7
---

This guide shows you how to build a small Redis-backed online feature store
in .NET with [StackExchange.Redis]({{< relref "/develop/clients/dotnet" >}}).
The demo runs on top of ASP.NET Core's minimal-API web framework so you can
bulk-load a batch of users with a key-level TTL, run a streaming worker that
overwrites real-time features with per-field TTL, retrieve any subset of
features for one user under 2 ms, and pipeline `HMGET` across a hundred
users for batch scoring.

## Overview

Each entity (here, a user) is one Redis
[Hash]({{< relref "/develop/data-types/hashes" >}}) at a deterministic key —
`fs:user:{id}`. The hash holds every feature for that entity as one field per
feature: batch-materialized aggregates (refreshed once a day) alongside
streaming-updated signals (refreshed every few seconds). One
[`HMGET`]({{< relref "/commands/hmget" >}}) returns whichever subset the
model needs in one network round trip.

Two TTL layers solve the *mixed staleness* problem without an
application-side cleaner:

* A **key-level** [`EXPIRE`]({{< relref "/commands/expire" >}}) aligned with
  the batch materialization cycle (24 hours in the demo). If the batch
  refresher fails, the whole entity disappears at the next cycle and
  inference sees a missing entity — which the model handler can detect and
  fall back on — rather than silently outdated values.
* A **per-field** [`HEXPIRE`]({{< relref "/commands/hexpire" >}}) (Redis 7.4+)
  on each streaming feature gives that field its own shorter expiry,
  independent of the rest of the hash. If the streaming pipeline stops
  updating a feature, the field self-cleans while the batch fields stay
  populated.

That gives you:

* A single round trip for retrieval — any subset of features for one entity
  in one [`HMGET`]({{< relref "/commands/hmget" >}}).
* Sub-millisecond hot path. The Redis-side work is microseconds; in practice
  the bottleneck is the network round trip plus the model's own
  feature-prep.
* Pipelined batch scoring — one round trip for `N` users at once.
* Independent freshness per feature, expressed as a server-side TTL rather
  than as application logic.
* Self-cleanup on pipeline failure: a stalled batch refresher lets entities
  expire on schedule, and a stalled streaming worker lets each affected
  field expire on its own timer.

## How StackExchange.Redis fits the demo

Three client facts shape the helper:

* **`ConnectionMultiplexer` is a single, shared, thread-safe object.** One
  instance serves the whole process — every HTTP handler in the ASP.NET
  Core thread pool and the streaming worker pull an `IDatabase` from the
  same multiplexer with `mux.GetDatabase()`. There is no pool to manage and
  no per-call connection borrow.
* **`IBatch` is the canonical pipelining handle.** `db.CreateBatch()`
  returns a builder; you call the async methods to queue commands (each
  returns a `Task<T>` that completes when the batch is flushed), then
  `batch.Execute()` ships the lot in one round trip. The pattern is "fire
  all the async methods, *then* call Execute, *then* await the Tasks."
* **Per-field TTL is typed.** StackExchange.Redis 2.8+ exposes
  `IDatabase.HashFieldExpireAsync` (returns `ExpireResult[]` — an enum
  whose values map 1:1 to Redis's HEXPIRE return codes) and
  `IDatabase.HashFieldGetTimeToLiveAsync` (returns `long[]` in
  milliseconds). The demo pins 2.13.17.

In this example, the batch features describe a user's longer-term shape
(`country_iso`, `risk_segment`, `account_age_days`, `tx_count_7d`,
`avg_amount_30d`, `chargeback_count_180d`) and are bulk-loaded by the
`BuildFeatures` static class. The streaming features describe what the user
is doing right now (`last_login_ts`, `last_device_id`, `tx_count_5m`,
`failed_logins_15m`, `session_country`) and are written by a `StreamingWorker`
background task. The HTTP handlers in `Program.cs` read any subset of those
features through `FeatureStore`'s helper class.

## How it works

There are three paths: a **batch path** that bulk-loads features once per
materialization cycle, a **streaming path** that updates real-time features
as events arrive, and an **inference path** that reads features on the
request side.

### Batch path (per materialization cycle)

1. The batch job calls `BuildFeatures.SynthesizeUsers(N, seed)` (in
   production, the equivalent computation lives in an offline pipeline
   against the warehouse). The result is
   `Dictionary<string, IReadOnlyDictionary<string, object>>` keyed by user
   ID.
2. `store.BulkLoadAsync(rows, ttlSeconds)` queues one
   [`HSET`]({{< relref "/commands/hset" >}}) plus one
   [`EXPIRE`]({{< relref "/commands/expire" >}}) per user on an `IBatch`,
   calls `batch.Execute()` to ship the whole thing in one round trip, then
   `Task.WhenAll` waits for every per-command reply.

### Streaming path (per event)

When a user does something (login, transaction, page view) the streaming
layer computes whatever real-time signals fall out of that event and
calls `store.UpdateStreamingAsync(userId, fields, ttlSeconds)`. That queues:

1. An [`HSET`]({{< relref "/commands/hset" >}}) writing the new field values.
   Redis is single-threaded per shard, so this is atomic against any
   concurrent batch write on the same hash — no version columns, no locks.
2. An [`HEXPIRE`]({{< relref "/commands/hexpire" >}}) over exactly the
   fields that were written, with the streaming TTL. Each streaming field
   carries its own per-field expiry independent of the rest of the hash.
   Stop the worker and these fields drop out one by one as their TTLs
   elapse, while the batch fields remain populated under the longer
   key-level TTL.

### Inference path (per request)

1. The model server picks the feature subset it needs (the schema is owned
   by the model, not the store).
2. It calls `store.GetFeaturesAsync(userId, names)`, which is one
   [`HMGET`]({{< relref "/commands/hmget" >}}). StackExchange.Redis returns
   the values in the same order as the requested fields, with
   `RedisValue.Null` for any field that doesn't exist (or has expired).
3. For batch inference, the model server calls
   `store.BatchGetFeaturesAsync(userIds, names)`, which pipelines one
   [`HMGET`]({{< relref "/commands/hmget" >}}) per user across all `N`
   users in a single network round trip via `IBatch`.

### Project layout

The csproj sits at the project root with every C# source file next to it,
mirroring every other client demo in this use case:

```text
feature-store/dotnet/
├── FeatureStoreDemo.csproj
├── Program.cs              — main() + ASP.NET Core minimal-API routes
├── FeatureStore.cs         — FeatureStore class + EncodeValue + Stats record
├── BuildFeatures.cs        — SynthesizeUsers + RunCliAsync
├── StreamingWorker.cs      — background-task worker
└── HtmlTemplate.cs         — inlined HTML page (C# 11 raw string literal)
```

Build and run with `dotnet run -c Release`. The `--mode build-features`
flag short-circuits to the CLI builder before the HTTP server starts up.

## The feature-store helper

The `FeatureStore` class wraps the read/write paths
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/feature-store/dotnet/FeatureStore.cs)):

```csharp
using StackExchange.Redis;
using FeatureStoreDemo;

var muxOptions = ConfigurationOptions.Parse("localhost:6379");
muxOptions.AllowAdmin = true;   // needed for SCAN via IServer.Keys()
var mux = await ConnectionMultiplexer.ConnectAsync(muxOptions);

var store = new FeatureStore(
    mux,
    "fs:user:",
    batchTtlSeconds: 24 * 60 * 60,    // whole-entity TTL aligned with the daily batch cycle
    streamingTtlSeconds: 5 * 60       // per-field TTL on each streaming feature
);

// Batch materialization: one HSET + EXPIRE per user, all pipelined.
var rows = new Dictionary<string, IReadOnlyDictionary<string, object>>
{
    ["u0001"] = new Dictionary<string, object>
    {
        ["country_iso"] = "US", ["risk_segment"] = "low",
        ["tx_count_7d"] = 14, ["avg_amount_30d"] = 92.40,
        ["account_age_days"] = 612, ["chargeback_count_180d"] = 0,
    },
};
await store.BulkLoadAsync(rows, 24 * 60 * 60);

// Streaming write: HSET + HEXPIRE on just the fields that changed.
await store.UpdateStreamingAsync("u0001", new Dictionary<string, object>
{
    ["last_login_ts"] = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
    ["last_device_id"] = "ios-9f02",
    ["tx_count_5m"] = 3,
    ["failed_logins_15m"] = 0,
    ["session_country"] = "US",
}, 5 * 60);

// Inference read: HMGET of whatever the model needs.
var features = await store.GetFeaturesAsync("u0001", new[]
{
    "risk_segment", "tx_count_7d", "avg_amount_30d",
    "tx_count_5m", "failed_logins_15m",
});

// Batch scoring: pipelined HMGET across many users.
var batch = await store.BatchGetFeaturesAsync(
    new[] { "u0001", "u0002", "u0003" },
    new[] { "risk_segment", "tx_count_5m", "failed_logins_15m" });
```

### Data model

Each user is one Redis Hash. Every value is stored as a string — Redis hash
fields are bytes on the wire, so `FeatureStore.EncodeValue` renders
booleans as `"true"` / `"false"` and uses `Object.ToString()` (with
`InvariantCulture` for doubles, so a `92.40` doesn't become `"92,40"` in
locales that use a comma decimal separator). The model server is responsible
for parsing back to the right type, the same way it would when reading any
serialized feature store.

```text
fs:user:u0001                                   TTL = 86400 s (key-level)
  country_iso=US                                <no field TTL>
  risk_segment=low                              <no field TTL>
  account_age_days=612                          <no field TTL>
  tx_count_7d=14                                <no field TTL>
  avg_amount_30d=92.40                          <no field TTL>
  chargeback_count_180d=0                       <no field TTL>
  last_login_ts=1716998413541                   TTL = 300 s (per field, HEXPIRE)
  last_device_id=ios-9f02                       TTL = 300 s (per field, HEXPIRE)
  tx_count_5m=3                                 TTL = 300 s (per field, HEXPIRE)
  failed_logins_15m=0                           TTL = 300 s (per field, HEXPIRE)
  session_country=US                            TTL = 300 s (per field, HEXPIRE)
```

### Bulk-loading batch features

`BulkLoadAsync` queues one `HSET` and one `EXPIRE` per user through an
`IBatch`, then `Execute()` ships the whole batch in one round trip.

```csharp
public async Task<int> BulkLoadAsync(
    IReadOnlyDictionary<string, IReadOnlyDictionary<string, object>> rows,
    long ttlSeconds)
{
    if (rows.Count == 0) return 0;
    var batch = _db.CreateBatch();
    var tasks = new List<Task>(rows.Count * 2);
    foreach (var (entityId, fields) in rows)
    {
        var key = (RedisKey)KeyFor(entityId);
        var entries = new HashEntry[fields.Count];
        int i = 0;
        foreach (var (name, value) in fields)
            entries[i++] = new HashEntry(name, EncodeValue(value));
        tasks.Add(batch.HashSetAsync(key, entries));
        tasks.Add(batch.KeyExpireAsync(key, TimeSpan.FromSeconds(ttlSeconds)));
    }
    batch.Execute();
    await Task.WhenAll(tasks);
    ...
}
```

Two things worth noticing:

1. **Call the async methods *before* `Execute()`.** They don't run anything
   yet — they just queue the command and return a `Task` that completes
   when the batch is flushed. Order matters: a `batch.HashSetAsync(...)`
   after `batch.Execute()` is just a regular async call against the
   underlying database (and will fail because the local `IBatch` is now
   spent).
2. **`Task.WhenAll(tasks)` after `Execute()`** is how you wait for the
   server to acknowledge the whole batch. Skipping it would leak any
   per-command errors (a malformed `EXPIRE`, for example) into the next
   call instead of the batch.

In production, the equivalent of this script runs as an offline pipeline
(a Spark or Feast `materialize` job) that reads from the warehouse and
writes into Redis. The
[Feast `RedisOnlineStore`](https://docs.feast.dev/reference/online-stores/redis)
provider does exactly this under the hood; the in-house
[Redis Feature Form]({{< relref "/develop/ai/featureform" >}}) integration
covers the materialize + serve path end-to-end.

### Streaming writes with per-field TTL

`UpdateStreamingAsync` is the linchpin of the mixed-staleness story:

```csharp
public async Task UpdateStreamingAsync(
    string entityId,
    IReadOnlyDictionary<string, object> fields,
    long ttlSeconds)
{
    if (fields.Count == 0) return;
    var key = (RedisKey)KeyFor(entityId);
    var entries = new HashEntry[fields.Count];
    var names = new RedisValue[fields.Count];
    int i = 0;
    foreach (var (name, value) in fields)
    {
        entries[i] = new HashEntry(name, EncodeValue(value));
        names[i] = name;
        i++;
    }

    var batch = _db.CreateBatch();
    var hsetTask = batch.HashSetAsync(key, entries);
    var hexpireTask = batch.HashFieldExpireAsync(
        key, names, TimeSpan.FromSeconds(ttlSeconds));
    batch.Execute();
    await hsetTask;
    var codes = await hexpireTask;
    foreach (var code in codes)
    {
        if (code != ExpireResult.Success)
        {
            throw new InvalidOperationException(
                $"HEXPIRE did not set every field TTL for {key}: [{string.Join(",", codes)}]");
        }
    }
    ...
}
```

[`HEXPIRE`]({{< relref "/commands/hexpire" >}}) sets the TTL on
*individual* hash fields, not on the whole key. The two commands are
queued under one `IBatch` so Redis runs them in pipeline order: the
`HSET` first creates or overwrites the fields, then `HEXPIRE` attaches a
TTL to each of those same fields. `HashFieldExpireAsync` returns one
`ExpireResult` per field:

* `ExpireResult.Success` (= Redis code `1`): TTL set / updated.
* `ExpireResult.Due` (= `2`): the expiry was 0 or in the past, so Redis
  deleted the field instead of applying a TTL.
* `ExpireResult.ConditionNotMet` (= `0`): an `NX | XX | GT | LT`
  conditional flag was specified and not met (we never use one here).
* `ExpireResult.NoSuchField` (= `-2`): no such field, or no such key.

We always follow `HSET` with `HEXPIRE` so any code other than `Success`
means the per-field TTL invariant didn't hold — the helper throws an
`InvalidOperationException` rather than silently leaving a streaming
field with no expiry attached.

If a streaming pipeline stops, the streaming fields drop out one by one
as their per-field TTLs elapse. `FieldTtlsSecondsAsync` (which wraps
`HashFieldGetTimeToLiveAsync`) lets the model side inspect the
remaining TTL on any field. Note that the StackExchange.Redis return is
in **milliseconds** — the helper divides by 1000 to match the
`TTL` / `HTTL` second-based convention used by every other client in
this use case (and `redis-cli`).

> **HEXPIRE requires Redis 7.4 or later.** `HEXPIRE` and the field-level
> TTL commands (`HTTL`, `HPERSIST`, `HEXPIREAT`, `HPEXPIRE`,
> `HPEXPIREAT`, `HPTTL`, `HEXPIRETIME`, `HPEXPIRETIME`) were added in
> Redis 7.4. StackExchange.Redis 2.8 was the first release with the
> typed bindings; the demo pins 2.13.17.

### Inference reads with HMGET

`GetFeaturesAsync` is one `HMGET`:

```csharp
public async Task<Dictionary<string, string>> GetFeaturesAsync(
    string entityId, IReadOnlyList<string> fieldNames)
{
    var key = (RedisKey)KeyFor(entityId);
    var out_ = new Dictionary<string, string>();
    if (fieldNames.Count == 0) return out_;
    var values = await _db.HashGetAsync(
        key, fieldNames.Select(f => (RedisValue)f).ToArray());
    for (int i = 0; i < fieldNames.Count; i++)
    {
        if (!values[i].IsNull)
            out_[fieldNames[i]] = values[i].ToString();
    }
    ...
}
```

`db.HashGetAsync(key, RedisValue[] fields)` issues `HMGET` and returns
a `RedisValue[]` aligned with the input order. Missing fields come back
as `RedisValue.Null` (which `IsNull` detects); the helper drops them
from the result dict so the caller sees only the features that actually
exist on the hash.

### Batch scoring with pipelined HMGET

For batch inference, the same `HMGET` shape pipelines across users
through one `IBatch`:

```csharp
public async Task<Dictionary<string, Dictionary<string, string>>> BatchGetFeaturesAsync(
    IReadOnlyList<string> entityIds, IReadOnlyList<string> fieldNames)
{
    if (entityIds.Count == 0 || fieldNames.Count == 0)
        return new Dictionary<string, Dictionary<string, string>>();

    var fieldValues = fieldNames.Select(f => (RedisValue)f).ToArray();
    var batch = _db.CreateBatch();
    var tasks = new Task<RedisValue[]>[entityIds.Count];
    for (int i = 0; i < entityIds.Count; i++)
        tasks[i] = batch.HashGetAsync(KeyFor(entityIds[i]), fieldValues);
    batch.Execute();
    var rows = await Task.WhenAll(tasks);
    ...
}
```

One round trip for the whole batch. The demo returns a 30-user batch in
~2 ms against a local Redis after the first-call JIT/connection warm-up.

A Redis Cluster is different: an `IBatch` is bound to one shard,
because all queued commands ship through one connection to one node.
For batch reads on a cluster, the
[StackExchange.Redis cluster client]({{< relref "/develop/clients/dotnet/connect" >}})
routes non-batched `HashGetAsync` calls to the right shard
automatically — fan out parallel calls with `Task.WhenAll` and the
multiplexer handles per-shard routing. For tighter control, group
entity IDs by hash slot ahead of time and use one `CreateBatch` per
shard's connection in parallel. A hash tag like `fs:user:{vip}:u0001`
forces a known set of keys onto the same shard so one batch can cover
them all.

## The streaming worker

`StreamingWorker.cs` is the demo's stand-in for whatever Flink, Kafka
Streams, or bespoke service computes the real-time features
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/feature-store/dotnet/StreamingWorker.cs)).
It runs as a background `Task` next to the demo server so the UI can
start, pause, and resume it.

```csharp
private async Task RunAsync(CancellationToken ct)
{
    try
    {
        while (!ct.IsCancellationRequested)
        {
            try { await Task.Delay(_tick, ct); }
            catch (OperationCanceledException) { break; }
            if (ct.IsCancellationRequested) break;

            // Set tick_in_flight *before* the pause check so a
            // concurrent pause+wait can never see tick_in_flight=0
            // in the window between the pause check and the actual
            // DoTick call. The finally block clears the flag whether
            // we paused, succeeded, or threw.
            Interlocked.Exchange(ref _tickInFlight, 1);
            try
            {
                if (Volatile.Read(ref _paused) == 0)
                    await DoTickAsync();
            }
            catch (Exception e)
            {
                Console.Error.WriteLine($"[streaming-worker] tick failed: {e.Message}");
            }
            finally
            {
                Interlocked.Exchange(ref _tickInFlight, 0);
            }
        }
    }
    finally
    {
        // Clear running and tick_in_flight no matter how the task
        // exits so a later Start() can spin a fresh task.
        Interlocked.Exchange(ref _running, 0);
        Interlocked.Exchange(ref _tickInFlight, 0);
    }
}
```

The same pre-flight `_tickInFlight` + `finally`-clear pattern as every
other client in this use case closes the pause/in-flight race: a reset
that's about to `DEL` every key calls `worker.Pause()` to stop *future*
ticks *and* `await worker.WaitForIdleAsync()` to flush a mid-flight tick
before issuing the DEL sweep.

Pausing the worker is what shows off the mixed-staleness behavior: leave
it paused for longer than `StreamingTtlSeconds` and the streaming fields
disappear from every user's hash one by one, while the batch fields
remain under the longer key-level `EXPIRE`. The demo's
`Pause / resume` button lets you see this happen in real time.

## The batch builder

`BuildFeatures.cs` is the demo's nightly materializer
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/feature-store/dotnet/BuildFeatures.cs)).
It generates synthetic feature rows and calls `store.BulkLoadAsync`
once. The synthesis itself is not the point — in a real deployment the
equivalent code reads from the offline store (Snowflake, BigQuery,
Iceberg) and writes the resulting hashes into Redis.

Run the builder on its own (independently of the demo server) to
populate Redis from the command line:

```bash
dotnet run --project . -- --mode build-features --count 500 --ttl-seconds 3600
```

That writes 500 users at `fs:user:*` with a one-hour key-level TTL,
which is how a typical operator would pre-seed a feature store from the
command line when debugging.

## The interactive demo

`Program.cs` runs the ASP.NET Core minimal-API server on port 8091. The
HTML page lets you:

* **Bulk-load** any number of users (default 200) with a configurable
  key-level TTL.
* See the **store state**: user count, batch / streaming TTLs,
  cumulative read/write counters.
* See the **streaming worker** status and **pause or resume** it.
* Run an **inference read** for any user with a chosen feature subset,
  and see the value, the per-field TTL, and the read latency.
* Run **batch scoring** with a pipelined `HMGET` across `N` users.
* **Inspect** any user's full hash with field-level TTLs and the
  key-level TTL.

The server holds one `FeatureStore`, one `StreamingWorker`, and one
`ConnectionMultiplexer` for the lifetime of the process. Every handler
in the ASP.NET Core thread pool and the streaming worker share that
multiplexer — StackExchange.Redis handles the per-call multiplexing
across the underlying socket. Endpoints:

| Endpoint                  | What it does                                                                        |
|---------------------------|-------------------------------------------------------------------------------------|
| `GET  /state`             | User count, TTL config, stats counters, worker status.                              |
| `POST /bulk-load`         | Pipelined `HSET` + `EXPIRE` over N synthetic users with a chosen TTL.               |
| `POST /worker/toggle`     | Pause / resume the streaming worker.                                                |
| `POST /read`              | `HMGET` a chosen feature subset for one user; report latency and per-field TTLs.    |
| `POST /batch-read`        | Pipeline `HMGET` across N users; report total latency and per-entity field counts.  |
| `GET  /inspect`           | `HGETALL` + `HTTL` for one user; full hash view with per-field TTLs.                |
| `POST /reset`             | Drop every user under the key prefix (used by the demo's reset button).             |

## Prerequisites

* **Redis 7.4 or later.** [`HEXPIRE`]({{< relref "/commands/hexpire" >}})
  and [`HTTL`]({{< relref "/commands/httl" >}}) were added in Redis 7.4;
  the demo relies on per-field TTL for the mixed-staleness story.
* **.NET 8 SDK or later.**
* **StackExchange.Redis 2.8 or later.** The demo's csproj pins 2.13.17.
  Typed bindings for the field-TTL commands ship from 2.8.

The connection multiplexer is opened with `AllowAdmin = true` because
the demo uses `IServer.Keys()` (SCAN under the hood) to populate UI
dropdowns and to power the reset path. In a production read/write
service you would not enable `AllowAdmin`; instead, maintain an external
index of user IDs (a small Redis Set, say, keyed by tenant) and read it
to discover entities. The demo's `SCAN` use is purely a UI convenience.

If your Redis server is running elsewhere, start the demo with
`--redis-uri host:port`.

## Running the demo

### Get the source files

The demo lives in a small csproj under
[`feature-store/dotnet`](https://github.com/redis/docs/tree/main/content/develop/use-cases/feature-store/dotnet).
Clone the repo or copy the directory:

```bash
git clone https://github.com/redis/docs.git
cd docs/content/develop/use-cases/feature-store/dotnet
dotnet build -c Release
```

### Start the demo server

From the project directory:

```bash
dotnet run -c Release
```

You should see:

```text
Dropping any existing users under 'fs:user:*' for a clean demo run (pass --no-reset to keep them).
Redis feature-store demo server listening on http://127.0.0.1:8091
Using Redis at localhost:6379 with key prefix 'fs:user:' (batch TTL 86400s, streaming TTL 300s)
Materialized 200 user(s); streaming worker running.
```

Open [http://127.0.0.1:8091](http://127.0.0.1:8091). Useful things to try:

* Pick a user and click **Read features** with a mixed batch/streaming
  subset — you'll see batch fields with no per-field TTL (covered by the
  key-level TTL) and streaming fields with a positive per-field TTL.
* Click **Pipeline HMGET** with `count=100` to see the latency of a
  100-user batch read.
* Click **Pause / resume** on the streaming worker and leave it paused
  for ~5 minutes (or restart the server with
  `--streaming-ttl-seconds 30` to make it visible in seconds). Re-run
  **Read features** on any user and watch the streaming fields
  disappear while the batch fields stay.
* Click **Inspect** on a user to see the full hash with field-level
  TTLs.
* Click **Reset** to drop every user and start over.

## Production usage

The guidance below focuses on the production concerns specific to
running a feature store on Redis. For the generic
StackExchange.Redis production checklist —
[`ConfigurationOptions`]({{< relref "/develop/clients/dotnet/connect" >}})
tuning, AUTH/ACL, retry/backoff, multiplexer lifetime, and exception
handling — see the
[StackExchange.Redis production usage guide]({{< relref "/develop/clients/dotnet/produsage" >}}).
For TLS specifically, follow the
[connect-with-TLS recipe]({{< relref "/develop/clients/dotnet/connect#connect-to-your-production-redis-with-tls" >}}).
The feature-store demo runs against `localhost` with the defaults; a real
deployment should harden the client first.

### Adopting the helper outside ASP.NET Core

`FeatureStore.cs` omits `.ConfigureAwait(false)` on its `await` calls
because ASP.NET Core 8 has no synchronization context — every `await`
resumes on a thread-pool thread, so the flag is a no-op and just
clutters the source. If you copy the helper into a context that *does*
have a synchronization context (a Windows Forms or WPF app, classic
ASP.NET, a Xamarin or MAUI UI thread, or a library that needs to play
nicely with any consumer) add `.ConfigureAwait(false)` after every
`await` to avoid deadlocking the UI thread on the resumption.

### Pick the batch TTL to outlast a failed refresher

The whole-entity `EXPIRE` is your safety net against silent staleness
from a broken batch pipeline. Set it longer than your worst-case batch
outage so a single missed run doesn't take the feature store offline,
but short enough that a sustained outage causes loud failures (missing
entities) rather than quiet ones (yesterday's features being scored as
today's). The standard choice is one cycle of "expected refresh
interval × 2" — for a daily batch, 48 hours; for a 6-hour batch, 12
hours.

The same logic applies to the per-field streaming TTL: a few times the
expected update interval so a slow-but-alive streaming worker doesn't
churn features needlessly, but short enough that a stalled worker
causes visible freshness failures.

### Co-locate the online store with serving, not with training

The online store's hash representation does *not* have to match the
schema in your offline store. The batch materialization step is your
chance to flatten joins, encode categoricals, and project to whatever
shape the model server wants — so the request path is exactly one
`HMGET` and zero transforms.

The training pipeline reads from the offline store with its own
schema; the serving pipeline reads from Redis with the flattened
serving schema. Keeping those two pipelines as the same code path is
what prevents training-serving skew.

### Pipeline batch reads across shards

On a single Redis instance, an `IBatch` of `HMGET`s across `N` users is
one round trip. A Redis Cluster is different: an `IBatch` is bound to
one shard, so on a cluster you need to either fan out the per-user
`HashGetAsync` calls with `Task.WhenAll` (the multiplexer routes each
one to the right shard) or group entity IDs by hash slot and create
one `IBatch` per shard's connection in parallel.

A hash tag like `fs:user:{vip}:u0001` forces a known set of keys onto
the same shard so one `IBatch` can cover them all in a single round
trip.

### Make HEXPIRE part of every streaming write

The single biggest correctness lever in this design is that the
streaming write applies `HEXPIRE` *every time*. If a streaming worker
writes a field without renewing its TTL, the field carries whatever
expiry was there before — possibly none, possibly stale — and the
mixed-staleness invariant breaks. Keep the `HSET` and `HEXPIRE` in the
same `IBatch` (or, even safer, in the same
[Lua script]({{< relref "/develop/programmability/eval-intro" >}}) if
you don't trust the call site).

### Avoid HGETALL on the request path

`HGETALL` reads every field on the hash, including ones the model
doesn't need. With dozens of features per entity, that is wasted
serialization work on the server and wasted bandwidth on the wire.
Always specify the field list explicitly with `HashGetAsync(key, RedisValue[])`
in the model server.

The exception is debugging and feature-set discovery, where you
genuinely want the full hash. The demo's "Inspect" button uses
`HashGetAllAsync` for exactly this reason.

### Inspect the store directly with redis-cli

When testing or troubleshooting, the cli tells you everything:

```bash
# How many users currently in the store
redis-cli --scan --pattern 'fs:user:*' | wc -l

# One user's full hash and key-level TTL
redis-cli HGETALL fs:user:u0001
redis-cli TTL    fs:user:u0001

# Per-field TTL on the streaming fields
redis-cli HTTL fs:user:u0001 FIELDS 5 \
  last_login_ts last_device_id tx_count_5m failed_logins_15m session_country

# Sample HMGET as the model would issue it
redis-cli HMGET fs:user:u0001 risk_segment tx_count_7d avg_amount_30d tx_count_5m
```

A streaming field that returns `-2` from `HTTL` doesn't exist on the
hash (either it was never written, or it expired); `-1` means the
field has no TTL set (and is therefore covered only by the key-level
`EXPIRE`); any positive value is the remaining TTL in seconds.

## Learn more

This example uses the following Redis commands:

* [`HSET`]({{< relref "/commands/hset" >}}) to write a feature or a
  whole feature row in one call.
* [`HMGET`]({{< relref "/commands/hmget" >}}) to retrieve any subset of
  features for one entity in one round trip.
* [`HGETALL`]({{< relref "/commands/hgetall" >}}) for debugging and
  feature-set discovery.
* [`HEXPIRE`]({{< relref "/commands/hexpire" >}}) and
  [`HTTL`]({{< relref "/commands/httl" >}}) for per-field TTL on
  streaming features (Redis 7.4+).
* [`EXPIRE`]({{< relref "/commands/expire" >}}) and
  [`TTL`]({{< relref "/commands/ttl" >}}) for the whole-entity TTL
  aligned with the batch materialization cycle.
* Pipelined `HMGET` across many entities for batch scoring with one
  network round trip — see
  [transactions and pipelining]({{< relref "/develop/clients/dotnet/transpipe" >}}).

See the [StackExchange.Redis documentation]({{< relref "/develop/clients/dotnet" >}})
for the full client reference, and the
[Hashes overview]({{< relref "/develop/data-types/hashes" >}}) for the
deeper conceptual model.
