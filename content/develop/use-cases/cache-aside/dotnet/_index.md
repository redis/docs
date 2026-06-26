---
aliases:
- /develop/use-cases/cache-aside/stackexchange.redis
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis cache-aside layer in C# with StackExchange.Redis
linkTitle: StackExchange.Redis example (C#)
title: Redis cache-aside with StackExchange.Redis
weight: 6
---

This guide shows you how to implement a Redis cache-aside layer in C# with [StackExchange.Redis](https://stackexchange.github.io/StackExchange.Redis/). It includes a small local web server built on ASP.NET Core's minimal API so you can see cache hits, misses, invalidation on write, and stampede protection in action.

## Overview

Cache-aside is one of the most common Redis use cases for read-heavy applications. Instead of querying the primary database on every request, the application checks Redis first and only falls back to the primary on a miss. The result is written back to Redis with a TTL so the next read is served from memory.

That gives you:

* Sub-millisecond reads for the hot working set
* Bounded staleness — every entry expires within a known window
* Reduced primary database load proportional to hit rate
* Field-level updates without re-serializing the full record
* Protection against cache stampedes when popular keys expire under load

In this example, each cached product is stored as a Redis hash under a key like `cache:product:{id}`. The hash holds the product fields (`id`, `name`, `price_cents`, `stock`) and the key has a TTL so stale data is bounded automatically.

## How it works

The flow on every read looks like this:

1. The application calls `cache.Get(productId, primary.Read)`
2. The helper runs `HGETALL` against `cache:product:{id}`
3. On a hit, the cached hash is returned directly
4. On a miss, the helper acquires a Lua-backed single-flight lock and invokes the loader to fetch from the primary
5. The helper writes the result back to Redis with `HSET` plus `EXPIRE` and releases the lock
6. Concurrent callers that fail to acquire the lock wait briefly for the cache to populate, then return that value instead of issuing their own primary read

On a write, the application updates the primary and then deletes the cache key, so the next read repopulates from the new source value.

## The cache-aside helper

The `RedisCache` class wraps the cache-aside operations
([source](RedisCache.cs)):

```csharp
using StackExchange.Redis;
using CacheAsideDemo;

var redis = ConnectionMultiplexer.Connect("localhost:6379");
var primary = new MockPrimaryStore(readLatencyMs: 150);
var cache = new RedisCache(redis.GetDatabase(), ttl: 30);

// Read through the cache.
var result = cache.Get("p-001", primary.Read);
Console.WriteLine($"hit={result.Hit} latency={result.RedisLatencyMs:F2}ms");

// Update a single field without rewriting the whole record.
cache.UpdateField("p-001", "stock", "41");

// Invalidate the cache key on a write to the primary.
primary.UpdateField("p-001", "price_cents", "699");
cache.Invalidate("p-001");
```

### Data model

Each cached product is stored in a Redis hash:

```text
cache:product:p-001
  id          = p-001
  name        = Sourdough Loaf
  price_cents = 650
  stock       = 42
```

The implementation uses:

* [`HGETALL`]({{< relref "/commands/hgetall" >}}) to read the cached record
* [`HSET`]({{< relref "/commands/hset" >}}) plus [`EXPIRE`]({{< relref "/commands/expire" >}}) to repopulate after a miss
* [`DEL`]({{< relref "/commands/del" >}}) to invalidate on writes
* [`TTL`]({{< relref "/commands/ttl" >}}) to surface remaining staleness in the demo UI
* [`EVAL`]({{< relref "/commands/eval" >}}) for the Lua single-flight lock that prevents stampedes
* StackExchange.Redis transactions with `Condition.KeyExists` for the conditional field update path

## Cache-aside reads

The `Get()` method runs `HGETALL` on the cache key first. On a hit it returns the cached hash and increments the hit counter. On a miss, it delegates to a single-flight loader:

```csharp
public Result Get(string entityId, Func<string, Dictionary<string, string>?> loader)
{
    var cacheKey = CacheKey(entityId);
    var sw = System.Diagnostics.Stopwatch.StartNew();
    var entries = _db.HashGetAll(cacheKey);
    sw.Stop();
    var redisLatencyMs = sw.Elapsed.TotalMilliseconds;

    if (entries.Length > 0)
    {
        Interlocked.Increment(ref _hits);
        return new Result(ToDict(entries), Hit: true, redisLatencyMs);
    }

    Interlocked.Increment(ref _misses);
    var record = LoadWithSingleFlight(entityId, loader);
    return new Result(record, Hit: false, redisLatencyMs);
}
```

The returned record includes the measured Redis round-trip time so the demo UI can show the latency difference between a hit and a miss.

## Stampede protection with a Lua lock

When a popular key expires, every concurrent reader observes the miss at the same instant. Without coordination, all of them would query the primary and overwrite the cache redundantly — a *cache stampede*.

The helper uses a tiny Lua script to acquire a short-lived lock atomically. Only the caller that wins the `SET NX` becomes the primary loader; the rest poll the cache briefly and return the value the lock holder writes:

```lua
-- Acquire a short-lived lock with SET NX PX. Returns 1 on acquire, 0 otherwise.
if redis.call('SET', KEYS[1], ARGV[1], 'NX', 'PX', ARGV[2]) then
    return 1
end
return 0
```

A second script releases the lock only if the caller still owns it, so a lock that timed out and was re-acquired by someone else cannot be released by mistake:

```lua
if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
end
return 0
```

The C# side runs both scripts via `IDatabase.ScriptEvaluate` on every miss:

```csharp
private Dictionary<string, string>? LoadWithSingleFlight(
    string entityId,
    Func<string, Dictionary<string, string>?> loader)
{
    var cacheKey = CacheKey(entityId);
    var lockKey = LockKey(entityId);
    var token = RandomToken();

    var acquired = (long) _db.ScriptEvaluate(
        AcquireLockScript,
        new RedisKey[] { lockKey },
        new RedisValue[] { token, _lockTtlMs.ToString() });

    if (acquired == 1)
    {
        try
        {
            var record = loader(entityId);
            if (record is null) return null;
            var batch = _db.CreateBatch();
            _ = batch.KeyDeleteAsync(cacheKey);
            _ = batch.HashSetAsync(cacheKey,
                record.Select(p => new HashEntry(p.Key, p.Value)).ToArray());
            _ = batch.KeyExpireAsync(cacheKey, TimeSpan.FromSeconds(_ttl));
            batch.Execute();
            return record;
        }
        finally
        {
            _db.ScriptEvaluate(ReleaseLockScript,
                new RedisKey[] { lockKey },
                new RedisValue[] { token });
        }
    }

    Interlocked.Increment(ref _stampedesSuppressed);
    var deadline = Environment.TickCount + _lockTtlMs;
    while (Environment.TickCount < deadline)
    {
        Thread.Sleep(_waitPollMs);
        var entries = _db.HashGetAll(cacheKey);
        if (entries.Length > 0) return ToDict(entries);
    }
    return loader(entityId);
}
```

The unique `token` per caller is what makes the release script safe — only the caller that actually holds the lock can release it.

## Invalidation on write

When a write hits the primary, the application invalidates the cache key. The next read pulls fresh data from the primary:

```csharp
public bool Invalidate(string entityId)
{
    return _db.KeyDelete(CacheKey(entityId));
}
```

This is the simplest and safest pattern: never try to keep the cache and primary in sync directly, just delete the cache entry and let the next read repopulate it.

## Field-level updates

Because each record is stored as a hash, the cache helper can also update a single field in place without re-serializing the full record. The update only writes if the entry is already cached, so a partial record can never appear in Redis:

```csharp
public bool UpdateField(string entityId, string field, string value)
{
    var cacheKey = CacheKey(entityId);
    while (true)
    {
        var tx = _db.CreateTransaction();
        tx.AddCondition(Condition.KeyExists(cacheKey));
        _ = tx.HashSetAsync(cacheKey, field, value);
        _ = tx.KeyExpireAsync(cacheKey, TimeSpan.FromSeconds(_ttl));
        if (tx.Execute()) return true;
        if (!_db.KeyExists(cacheKey)) return false;
    }
}
```

StackExchange.Redis transactions wrap WATCH/MULTI/EXEC into a clean conditional API: the transaction commits atomically only if the cache key still exists, which prevents creating a partial record after an invalidation has raced in.

This is useful for hot fields that change more often than the rest of the record (a stock counter, a view count) and would otherwise force a full reload.

## Hit/miss accounting

The helper keeps in-process counters for hits, misses, and stampedes that were suppressed by the single-flight lock. The demo UI surfaces these so you can see the cache absorbing load:

```csharp
public Dictionary<string, object> Stats()
{
    var hits = Interlocked.Read(ref _hits);
    var misses = Interlocked.Read(ref _misses);
    var stampedes = Interlocked.Read(ref _stampedesSuppressed);
    var total = hits + misses;
    var hitRatePct = total == 0 ? 0.0 : Math.Round(100.0 * hits / total, 1);
    return new Dictionary<string, object>
    {
        ["hits"] = hits,
        ["misses"] = misses,
        ["stampedes_suppressed"] = stampedes,
        ["hit_rate_pct"] = hitRatePct,
    };
}
```

In production you would emit these as `IMetricsRoot` counters or push them into your observability stack rather than holding them as `long`s in process memory.

## Prerequisites

Before running the demo, make sure that:

* Redis is running and accessible. By default, the demo connects to `localhost:6379`.
* .NET 8 SDK is installed.
* The `StackExchange.Redis` NuGet package is referenced (already declared in the project file).

If your Redis server is running elsewhere, start the demo with `--redis-host` and `--redis-port`, or set `REDIS_HOST` / `REDIS_PORT` in the environment.

## Running the demo

A local demo server is included to show the cache-aside layer in action
([source](Program.cs)):

```bash
dotnet run --project CacheAsideDemo.csproj -- --port 8080 --redis-host localhost --redis-port 6379
```

The demo server uses ASP.NET Core's minimal API for HTTP handling and `Task.Run` for the stampede test:

* [Minimal APIs](https://learn.microsoft.com/aspnet/core/fundamentals/minimal-apis) for the web server
* [`System.Threading.Tasks`](https://learn.microsoft.com/dotnet/api/system.threading.tasks) for the stampede test
* [`System.Security.Cryptography.RandomNumberGenerator`](https://learn.microsoft.com/dotnet/api/system.security.cryptography.randomnumbergenerator) for the per-caller lock token

It exposes a small interactive page where you can:

* Read a product through the cache and see whether it was a hit or a miss
* Compare the measured Redis round-trip against the simulated primary read latency
* Watch the cache TTL count down between requests
* Update a field on the primary and see the cache invalidate automatically
* Run a stampede test that fires many concurrent reads at a freshly-invalidated key and confirms only one of them reaches the primary
* Reset the hit/miss counters at any time

After starting the server, visit `http://localhost:8080`.

## ThreadPool sizing for the stampede test

`Program.cs` calls `ThreadPool.SetMinThreads(64, 64)` at startup. The demo's stampede test queues up to 50 `Task.Run` work items at once, and the default ThreadPool grows at roughly two threads per second under load — that growth ramp is slow enough that some of the queued readers can time out polling for the cache and fall back to a second primary read.

Raising the ThreadPool floor is a property of *this synchronous demo* rather than the cache pattern itself. A production cache-aside helper would more naturally be `async` (`await Task.Delay`, `HashGetAllAsync`, `ScriptEvaluateAsync`) and would not block ThreadPool threads while polling.

## The mock primary store

To make the demo self-contained, the example includes a `MockPrimaryStore` that stands in for a slow disk-backed database
([source](MockPrimaryStore.cs)):

```csharp
public Dictionary<string, string>? Read(string id)
{
    Thread.Sleep(ReadLatencyMs);
    Interlocked.Increment(ref _reads);
    // ...
}
```

Every call to `Read()` sleeps for `ReadLatencyMs` so the difference between a cache hit and a miss is obvious in the UI. The store also tracks the total number of primary reads, which the stampede test uses to confirm that single-flight is working — for N concurrent readers against a cold key, you should see exactly one primary read.

In a real application this would be replaced by an Entity Framework query, an HTTP call to a downstream service, or any other slow-but-authoritative source.

## Production usage

This guide uses a deliberately small local demo so you can focus on the cache-aside pattern. In production, you will usually want to harden several aspects of it.

### Choose a TTL that matches your staleness tolerance

The TTL is the upper bound on how long a stale value can be served. Shorter TTLs mean lower hit rates and more primary load; longer TTLs mean higher hit rates and more stale reads between writes. Pick the value that matches your business tolerance for stale data, and combine it with explicit invalidation on writes for the cases where you cannot tolerate any staleness.

### Invalidate, don't try to keep the cache in sync

When the underlying record changes, delete the cache key rather than rewriting it. Cache-aside is robust precisely because it never assumes the cache holds the latest value — the next read always re-fetches from the primary on a miss.

### Use the async API on the request path

The demo uses synchronous calls (`HashGetAll`, `ScriptEvaluate`, `Thread.Sleep`) to keep the helper compact. In production, prefer `HashGetAllAsync`, `ScriptEvaluateAsync`, and `await Task.Delay` so request-handling threads return to the ThreadPool while the loader is in flight. The cache-aside structure is identical — just propagate `await`s through the call chain.

### Handle missing records explicitly

In this demo, a missing record returns `null` and nothing is cached. In a real system you may want to cache "not found" sentinels with a short TTL to absorb load from probing for non-existent IDs, while making sure the sentinel TTL is shorter than the positive cache entry so a newly-created record becomes visible quickly.

### Tune the single-flight lock TTL

The lock TTL needs to be longer than the worst-case primary read latency so a slow loader does not lose the lock midway. The unique token in `RELEASE_LOCK_SCRIPT` ensures the original caller does not delete someone else's lock if its lock has expired.

### Namespace cache keys in shared Redis deployments

If multiple applications share a Redis deployment, prefix cache keys with the application name (`cache:billing:product:{id}`) so different services cannot clobber each other's entries.

### Inspect cached entries directly in Redis

When testing or troubleshooting, inspect the stored cache key directly to confirm the application is writing the fields and TTL you expect:

```bash
redis-cli HGETALL cache:product:p-001
redis-cli TTL cache:product:p-001
```

## Learn more

* [StackExchange.Redis docs](https://stackexchange.github.io/StackExchange.Redis/) - Install and use the .NET Redis client
* [SET command]({{< relref "/commands/set" >}}) - Set a string with TTL options (`EX`, `PX`, `NX`)
* [HSET command]({{< relref "/commands/hset" >}}) - Write hash fields
* [HGETALL command]({{< relref "/commands/hgetall" >}}) - Read every field of a hash
* [EXPIRE command]({{< relref "/commands/expire" >}}) - Set key expiration in seconds
* [DEL command]({{< relref "/commands/del" >}}) - Delete a key on invalidation
* [Lua scripting]({{< relref "/develop/programmability/eval-intro" >}}) - Atomic single-flight locks and stampede mitigation
