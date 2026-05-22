---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis prefetch cache in C# with StackExchange.Redis
linkTitle: StackExchange.Redis example (C#)
title: Redis prefetch cache with StackExchange.Redis
weight: 6
---

This guide shows you how to implement a Redis prefetch cache in C# with [StackExchange.Redis](https://stackexchange.github.io/StackExchange.Redis/). It includes a small local web server built with ASP.NET Core minimal APIs so you can watch the cache pre-load at startup, see a background sync worker apply primary mutations within milliseconds, and break the cache to confirm that reads never fall back to the primary.

## Overview

Prefetch caching pre-loads a working set of reference data into Redis before the first request arrives, so every read on the request path is a cache hit. A separate sync worker keeps the cache current as the source of truth changes — there is no fall-back to the primary on the read path.

That gives you:

* Near-100% cache hit ratios for reference and master data
* Sub-millisecond reads for lookup-heavy paths at peak traffic
* All reference-data reads offloaded from the primary database
* Source-database changes propagated into Redis within a few milliseconds
* A long safety-net TTL that bounds memory if the sync pipeline ever stops

In this example, each cached category is stored as a Redis hash under a key like `cache:category:{id}`. The hash holds the category fields (`id`, `name`, `display_order`, `featured`, `parent_id`) and the key has a long safety-net TTL that the sync worker refreshes on every add or update event. Delete events remove the cache key outright, so there is no TTL to refresh in that case.

## How it works

The flow has three independent paths:

1. **On startup**, the demo server calls `cache.BulkLoad(primary.ListRecords())`, which pipelines `DEL` + `HSET` + `EXPIRE` for every record in one round trip.
2. **On every read**, the application calls `cache.Get(entityId)`, which runs `HGETALL` against Redis only. A miss is treated as an error, not a trigger to query the primary.
3. **On every primary mutation**, the primary appends a change event to an in-process queue. The sync worker thread drains the queue and calls `cache.ApplyChange(event)`. For an `Upsert`, the helper rewrites the cache hash and refreshes the safety-net TTL; for a `Delete`, it removes the cache key.

In a real system the in-process change queue is replaced by a CDC pipeline — [Redis Data Integration]({{< relref "/integrate/redis-data-integration" >}}), Debezium plus a lightweight consumer, or an equivalent tool that tails the source's binlog/WAL and pushes events into Redis.

## The prefetch-cache helper

The `PrefetchCache` class wraps the cache operations
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/prefetch-cache/dotnet/PrefetchCache.cs)):

```csharp
using StackExchange.Redis;
using PrefetchCacheDemo;

var redis = ConnectionMultiplexer.Connect("localhost:6379");
var primary = new MockPrimaryStore();
var cache = new PrefetchCache(redis.GetDatabase(), ttlSeconds: 3600);

// Pre-load every primary record into Redis in one pipelined round trip.
cache.BulkLoad(primary.ListRecords());

// Start the sync worker so primary mutations propagate into Redis.
var sync = new SyncWorker(primary, cache);
sync.Start();

// Read paths now go to Redis only.
var result = cache.Get("cat-001");
```

### Data model

Each cached category is stored in a Redis hash:

```text
cache:category:cat-001
  id            = cat-001
  name          = Beverages
  display_order = 1
  featured      = true
  parent_id     = 
```

The implementation uses:

* [`HSET`]({{< relref "/commands/hset" >}}) + [`EXPIRE`]({{< relref "/commands/expire" >}}), batched, for the bulk load and every sync event
* [`HGETALL`]({{< relref "/commands/hgetall" >}}) on the read path
* [`DEL`]({{< relref "/commands/del" >}}) for sync-delete events and explicit invalidation
* [`SCAN`]({{< relref "/commands/scan" >}}) to enumerate the cached keyspace and to clear the prefix
* [`TTL`]({{< relref "/commands/ttl" >}}) to surface remaining safety-net time in the demo UI

## Bulk load on startup

The `BulkLoad` method pipelines a `DEL` + `HSET` + `EXPIRE` triple for every record through a StackExchange.Redis `IBatch`, so loading thousands of records takes one network RTT plus the time Redis spends executing the commands locally — typically tens of milliseconds even for a large reference table:

```csharp
public int BulkLoad(IEnumerable<Dictionary<string, string>> records)
{
    var batch = _db.CreateBatch();
    var tasks = new List<Task>();
    var loaded = 0;
    foreach (var record in records)
    {
        if (!record.TryGetValue("id", out var entityId) || string.IsNullOrEmpty(entityId)) continue;
        var cacheKey = CacheKey(entityId);
        tasks.Add(batch.KeyDeleteAsync(cacheKey));
        tasks.Add(batch.HashSetAsync(
            cacheKey,
            record.Select(p => new HashEntry(p.Key, p.Value)).ToArray()));
        tasks.Add(batch.KeyExpireAsync(cacheKey, TimeSpan.FromSeconds(_ttlSeconds)));
        loaded++;
    }
    if (loaded > 0)
    {
        batch.Execute();
        Task.WaitAll(tasks.ToArray());
    }
    return loaded;
}
```

`IBatch` is non-transactional on purpose for the **startup** path: nothing is reading the cache yet, the records do not need to be applied atomically as a set, and skipping `MULTI`/`EXEC` keeps the bulk load fast. The same method is used for the live `/reprefetch` reload, which is safe because the demo pauses the sync worker around the clear-and-reload sequence — see [Re-prefetch under load](#re-prefetch-under-load) below. If you call `BulkLoad` directly from your own code on a cache that is already serving reads, either pause your writers first or rewrite it with `IDatabase.CreateTransaction()` so callers cannot observe a half-loaded record.

## Reads from Redis only

The `Get` method runs `HGETALL` and returns the cached hash. **It does not fall back to the primary on a miss.** In a healthy system, a miss never happens; if it does, the application surfaces it as an error and treats it as a sync-pipeline incident:

```csharp
public ReadResult Get(string entityId)
{
    var cacheKey = CacheKey(entityId);
    var sw = System.Diagnostics.Stopwatch.StartNew();
    var entries = _db.HashGetAll(cacheKey);
    sw.Stop();
    var redisLatencyMs = sw.Elapsed.TotalMilliseconds;

    if (entries.Length > 0)
    {
        lock (_statsLock) { _hits++; }
        return new ReadResult(ToDict(entries), Hit: true, redisLatencyMs);
    }

    lock (_statsLock) { _misses++; }
    return new ReadResult(null, Hit: false, redisLatencyMs);
}
```

This is the key behavioural difference from [cache-aside]({{< relref "/develop/use-cases/cache-aside" >}}): the request path never touches the primary, so reference-data reads cannot contribute to primary database load.

## Applying sync events

The sync worker calls `ApplyChange` for every primary mutation. For an `Upsert`, the helper rewrites the cache hash and refreshes the safety-net TTL inside a StackExchange.Redis transaction (`IDatabase.CreateTransaction()`) so the cache never holds a stale mix of old and new fields. For a `Delete`, it removes the cache key:

```csharp
public void ApplyChange(ChangeEvent change)
{
    if (string.IsNullOrEmpty(change.Id)) return;
    var cacheKey = CacheKey(change.Id);

    if (change.Op == ChangeOp.Upsert)
    {
        if (change.Fields is null || change.Fields.Count == 0) return;
        var tx = _db.CreateTransaction();
        _ = tx.KeyDeleteAsync(cacheKey);
        _ = tx.HashSetAsync(
            cacheKey,
            change.Fields.Select(p => new HashEntry(p.Key, p.Value)).ToArray());
        _ = tx.KeyExpireAsync(cacheKey, TimeSpan.FromSeconds(_ttlSeconds));
        tx.Execute();
    }
    else if (change.Op == ChangeOp.Delete)
    {
        _db.KeyDelete(cacheKey);
    }
}
```

The `DEL` before the `HSET` ensures the cached hash contains exactly the fields the primary record has now — fields that have been dropped from the primary will not linger in Redis. StackExchange.Redis transactions are optimistic (WATCH-based under the hood), but the three commands here have no conditions so they queue and dispatch atomically in a single round trip.

The "skip empty upserts" early-return is important: `HSET` with an empty array of fields throws, and a CDC pipeline that ever emits an upsert without fields would crash the sync worker on first encounter. A production consumer would route the bad event to a dead-letter queue and alert; the demo simply drops it.

## The sync worker

The `SyncWorker` runs a long-running background `Thread` (not a `Task`) so it can poll on the change queue without consuming a ThreadPool slot. Every change is applied to Redis as soon as it arrives
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/prefetch-cache/dotnet/SyncWorker.cs)):

```csharp
private void Run()
{
    while (!_stopEvent.IsSet)
    {
        if (_pauseEvent.IsSet)
        {
            _pausedIdleEvent.Set();
            while (_pauseEvent.IsSet && !_stopEvent.IsSet)
            {
                _stopEvent.Wait(_pollTimeout);
            }
            _pausedIdleEvent.Reset();
            continue;
        }

        var change = _primary.NextChange(_pollTimeout);
        if (change is null) continue;
        try { _cache.ApplyChange(change); }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[sync] failed to apply {change}: {ex.Message}");
        }
    }
}
```

`ManualResetEventSlim` provides the pause and stop signals. `BlockingCollection<ChangeEvent>.TryTake(out _, timeout)` is the .NET equivalent of `queue.Queue.get(timeout=…)` from the reference; the 50 ms timeout keeps the worker responsive to pause and stop requests without busy-looping.

In production this loop is replaced by a CDC consumer reading from RDI's Redis output stream, Debezium's Kafka topic, or an equivalent change feed. The shape stays the same: drain events, apply them to Redis, advance the consumer offset.

## Invalidation and re-prefetch

Two helpers exist for testing and recovery:

* `Invalidate(entityId)` deletes a single cache key. The demo uses it to simulate a sync-pipeline failure on one record.
* `Clear()` runs `SCAN MATCH cache:category:*` and deletes every key under the prefix. The demo uses it to simulate a full cache loss.

In both cases, the recovery path is to call `BulkLoad(primary.ListRecords())` again — re-prefetching from the primary. The demo exposes this as the "Re-prefetch" button so you can see the cache come back to a fully-warm state in one operation.

### Re-prefetch under load

`Clear()` and `BulkLoad()` are not atomic against the sync worker. If a change event arrives between the snapshot (`primary.ListRecords()`) and the bulk write, the bulk write can overwrite a newer value; if a change event arrives between `Clear()`'s `SCAN` and `DEL`, the cleared entry can immediately be recreated. The demo's `/clear` and `/reprefetch` handlers solve this by pausing the sync worker around the operation:

```csharp
sync.Pause();
try
{
    cache.Clear();
    cache.BulkLoad(primary.ListRecords());
}
finally
{
    sync.Resume();
}
```

`Pause()` waits for the worker to finish whatever event it is currently applying, parks the run loop, and returns. Change events that arrive during the pause sit in the primary's `BlockingCollection` queue and apply in order once `Resume()` is called, so no event is lost.

## Hit/miss accounting

The helper keeps in-process counters for hits, misses, prefetched records, sync events applied, and the average lag between a primary change and its application to Redis. The demo UI surfaces these so you can confirm the cache is absorbing all reads and the sync worker is keeping up:

```csharp
public Dictionary<string, object> Stats()
{
    lock (_statsLock)
    {
        var total = _hits + _misses;
        var hitRate = total == 0 ? 0.0 : Math.Round(100.0 * _hits / total, 1);
        var avgLag = _syncLagSamples == 0
            ? 0.0
            : Math.Round(_syncLagMsTotal / _syncLagSamples, 2);
        return new Dictionary<string, object>
        {
            ["hits"] = _hits,
            ["misses"] = _misses,
            ["hit_rate_pct"] = hitRate,
            ["prefetched"] = _prefetched,
            ["sync_events_applied"] = _syncEventsApplied,
            ["sync_lag_ms_avg"] = avgLag,
        };
    }
}
```

In production you would emit these as counters and gauges through `Meter`/`Counter<T>` and scrape with Prometheus or OpenTelemetry. The sync-lag metric is the most important: a sudden rise indicates the CDC pipeline is falling behind.

## Prerequisites

Before running the demo, make sure that:

* Redis is running and accessible. By default, the demo connects to `localhost:6379`.
* The [.NET 8 SDK](https://dotnet.microsoft.com/download) (or newer) is installed:

```bash
dotnet --version
```

The project file pins `StackExchange.Redis` at 2.7+, which `dotnet run` restores automatically on first invocation.

If your Redis server is running elsewhere, start the demo with `--redis-host` and `--redis-port`.

## Running the demo

### Get the source files

The demo consists of five files. Download them from the [`dotnet` source folder](https://github.com/redis/docs/tree/main/content/develop/use-cases/prefetch-cache/dotnet) on GitHub, or grab them with `curl`:

```bash
mkdir prefetch-cache-demo && cd prefetch-cache-demo
BASE=https://raw.githubusercontent.com/redis/docs/main/content/develop/use-cases/prefetch-cache/dotnet
curl -O $BASE/PrefetchCacheDemo.csproj
curl -O $BASE/PrefetchCache.cs
curl -O $BASE/MockPrimaryStore.cs
curl -O $BASE/SyncWorker.cs
curl -O $BASE/Program.cs
```

### Start the demo server

From that directory:

```bash
dotnet run
```

You should see something like:

```text
Redis prefetch-cache demo server listening on http://127.0.0.1:8787
Using Redis at localhost:6379 with cache prefix 'cache:category:' and TTL 3600s
Prefetched 5 records in 92.4 ms; sync worker running
```

After starting the server, visit `http://localhost:8787`.

The demo server uses ASP.NET Core minimal APIs and only standard .NET threading primitives:

* `WebApplication.CreateBuilder()` for HTTP routing
* `BlockingCollection<T>` for the change-event queue
* `Thread` + `ManualResetEventSlim` for the sync worker

It exposes a small interactive page where you can:

* See which IDs are in the cache and in the primary, side by side
* Read a category through the cache and confirm every read is a hit
* Update a field on the primary and watch the sync worker rewrite the cache hash
* Add and delete categories and watch them appear and disappear from the cache
* Invalidate one key or clear the entire cache to simulate a sync-pipeline failure
* Re-prefetch from the primary to recover from a broken cache state
* Watch the average sync lag, and confirm primary reads stay at one until you re-prefetch — each `/reprefetch` adds another primary read for the snapshot, but normal request traffic never reaches the primary at all

## The mock primary store

To make the demo self-contained, the example includes a `MockPrimaryStore` that stands in for a source-of-truth database
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/prefetch-cache/dotnet/MockPrimaryStore.cs)):

```csharp
public class MockPrimaryStore
{
    public MockPrimaryStore(int readLatencyMs = 80) { ... }

    public List<Dictionary<string, string>> ListRecords()
    {
        Thread.Sleep(ReadLatencyMs);
        ...
    }

    public bool UpdateField(string entityId, string field, string value)
    {
        lock (_lock)
        {
            ...
            EmitChangeLocked(ChangeOp.Upsert, entityId, snapshot);
        }
        return true;
    }
}
```

Every mutation appends a `ChangeEvent` to an in-process [`BlockingCollection<T>`](https://learn.microsoft.com/dotnet/api/system.collections.concurrent.blockingcollection-1). The sync worker drains the queue with a 50 ms timeout and applies each event to Redis. The emit happens while the mutation lock is held so two concurrent updates cannot interleave their event order on the queue. In a real system this queue is replaced by a CDC pipeline — RDI on Redis Enterprise or Debezium with a Redis consumer on open-source Redis.

## Production usage

This guide uses a deliberately small local demo so you can focus on the prefetch-cache pattern. In production, you will usually want to harden several aspects of it.

### Replace the in-process change queue with a real CDC pipeline

The demo's in-process queue is the simplest possible stand-in for a CDC change feed. In production, the change feed lives outside the application process: an RDI pipeline configured against your primary database, Debezium connectors writing to Kafka or a Redis stream, or your application explicitly publishing change events from the write path. Whatever you choose, the consumer side stays the same — read events, apply them to Redis, advance the offset.

### Use a long safety-net TTL, not a freshness TTL

The TTL on each cache key is a **safety net**: it bounds memory if the sync pipeline silently stops, so a stuck consumer cannot leave stale data in Redis indefinitely. The TTL is not the freshness mechanism — freshness comes from the sync worker, which refreshes the TTL on every add or update event (delete events remove the key). Pick a TTL that is comfortably longer than your worst-case sync lag plus your alerting window, so a transient sync hiccup never expires hot keys.

### Decide what to do on a cache miss

A prefetch cache treats a miss as an error or a missing record. The two reasonable strategies are:

* **Return a 404 to the user.** Appropriate when the cache is authoritative for the lookup — for example, when the user is asking for a category by ID and the ID is not in the cache.
* **Page on-call.** A sustained miss rate on IDs you know exist is an incident: either the prefetch did not run, or the sync pipeline is broken.

Whichever you choose, do not fall back to the primary on the read path — that is what cache-aside is for, and conflating the two patterns breaks the load-isolation guarantee that prefetch provides.

### Bound the working set to what fits in memory

Prefetch only works if the entire dataset fits in Redis memory with headroom. Estimate the size of your reference data, multiply by a growth factor, and confirm the result fits within your Redis instance's `maxmemory` minus what other use cases need. If the working set grows beyond what Redis can hold, switch the dataset to a cache-aside pattern instead — the request path will pay miss latency, but you will not OOM.

### Reconcile periodically against the primary

CDC pipelines are eventually consistent: an event can be lost (broker outage, consumer crash, configuration drift) and the cache can silently diverge from the source. Run a periodic reconciliation job that re-reads all primary records, compares them against the cache, and either re-prefetches or fixes individual entries. Even running it once a day catches drift that ad-hoc inspection would miss.

### Namespace cache keys in shared Redis deployments

If multiple applications share a Redis deployment, prefix cache keys with the application name (`cache:billing:category:{id}`) so different services cannot clobber each other's entries. The helper takes a `prefix` argument exactly for this.

### Prefer async on hot paths

The demo helper is synchronous (`HashGetAll`, `KeyDelete`, etc.) to keep the example compact. .NET's `ThreadPool` grows by only a couple of threads per second under load, so a synchronous helper combined with many concurrent HTTP handlers can starve workers and produce false cache-misses during traffic spikes. The demo works around this by calling `ThreadPool.SetMinThreads(64, 64)` at startup; a production helper would expose `async` methods (`HashGetAllAsync`, `KeyDeleteAsync`, `await Task.Delay`) and route requests through an async pipeline end-to-end. That removes the synchronous-blocking risk entirely and is the idiomatic shape for ASP.NET Core handlers.

### Use TickCount64 (not TickCount) for any deadline arithmetic

If you add timeout/deadline logic to your sync worker or maintenance handlers, use `Environment.TickCount64`, never `Environment.TickCount`. The 32-bit variant wraps every 24.9 days and adding a positive offset near the wraparound boundary produces a negative deadline that immediately exits the polling loop. The 64-bit variant has no practical wrap interval.

### Inspect cached entries directly in Redis

When testing or troubleshooting, inspect the stored cache keys directly to confirm the bulk load and the sync worker are writing what you expect:

```bash
redis-cli --scan --pattern 'cache:category:*'
redis-cli HGETALL cache:category:cat-001
redis-cli TTL cache:category:cat-001
```

If a key is missing for an ID that still exists in the primary, the prefetch did not run, the key expired without a sync refresh, or someone invalidated it. If a key is still present for an ID that was deleted in the primary, the delete event has not yet been applied. If the TTL is much lower than the configured safety-net value on a hot key, the sync worker is not keeping up.

## Learn more

* [StackExchange.Redis documentation](https://stackexchange.github.io/StackExchange.Redis/) - Install and use the StackExchange.Redis client
* [HSET command]({{< relref "/commands/hset" >}}) - Write hash fields
* [HGETALL command]({{< relref "/commands/hgetall" >}}) - Read every field of a hash
* [EXPIRE command]({{< relref "/commands/expire" >}}) - Set key expiration in seconds
* [DEL command]({{< relref "/commands/del" >}}) - Delete a key on invalidation or sync-delete
* [SCAN command]({{< relref "/commands/scan" >}}) - Iterate the cached keyspace without blocking the server
* [TTL command]({{< relref "/commands/ttl" >}}) - Inspect remaining safety-net time on a key
* [Redis Data Integration]({{< relref "/integrate/redis-data-integration" >}}) - Configuration-driven CDC into Redis on Redis Enterprise and Redis Cloud
