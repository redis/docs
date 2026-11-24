---
LinkTitle: FusionCache
Title: FusionCache for C#/.NET
categories:
- docs
- integrate
- oss
- rs
- rc
description: A fast, resilient hybrid cache for C#/.NET that combines a memory cache with Redis
group: library
stack: true
summary: FusionCache is a hybrid cache for C#/.NET applications that combines an in-memory cache with Redis and adds resiliency features such as stampede protection and Fail-Safe.
title: FusionCache
type: integration
weight: 9
---
[FusionCache](https://github.com/ZiggyCreatures/FusionCache) combines a memory cache (level 1, or L1) and a distributed cache such as Redis (level 2, or L2) behind one API. It handles the details of a hybrid cache for you: keeping the levels in sync, protecting against cache stampedes, and surviving a slow or unavailable database or Redis server. FusionCache can use Redis for all three of its distributed parts: the cache, the backplane, and the distributed locker.

## Key features

- **Hybrid**: Use it as L1 (memory only) or L1+L2 (memory plus distributed)
- **Tagging**: Work with multiple entries at once by tagging them
- **Backplane**: Notify all nodes instantly when an entry changes
- **Stampede protection**: Works on a single node (with a memory locker) and across nodes (with a distributed locker)
- **Redis support**: Native support for the cache, the backplane, and the locker
- **Resiliency**: Fail-Safe, Eager Refresh, factory timeouts, Auto-Recovery, and more
- **Sync and async**: Full support for both programming models
- **.NET ecosystem**: Integrates with ASP.NET Core, Entity Framework, and other .NET technologies

## Requirements

The examples on this page were run with FusionCache 2.9.0 on .NET 9 against Redis 7.2. You
need a running Redis server. You can run one locally with
[Redis Open Source](/content/operate/oss_and_stack/install/archive/install-redis/_index.md),
use [Docker](https://hub.docker.com/_/redis), or connect to
[Redis Cloud](https://redis.io/cloud/).

## Install

Using the dotnet CLI, run:

```powershell
dotnet add package ZiggyCreatures.FusionCache
```

Other packages are also available to work with different distributed caches, serializers, backplanes and more.
See the [FusionCache docs](https://github.com/ZiggyCreatures/FusionCache/blob/main/docs/README.md) for more information.

## Getting started

First, install the packages for Redis (with JSON serialization):

```powershell
dotnet add package ZiggyCreatures.FusionCache
dotnet add package Microsoft.Extensions.Caching.StackExchangeRedis
dotnet add package ZiggyCreatures.FusionCache.Serialization.SystemTextJson
dotnet add package ZiggyCreatures.FusionCache.Backplane.StackExchangeRedis
```

Then at startup:

```csharp
services.AddFusionCache()
    .WithSerializer(
        new FusionCacheSystemTextJsonSerializer()
    )
    .WithDistributedCache(
        new RedisCache(new RedisCacheOptions { Configuration = "localhost:6379" })
    )
    .WithBackplane(
        new RedisBackplane(new RedisBackplaneOptions { Configuration = "localhost:6379" })
    );
```

Use code like the following to share the Redis connection multiplexer:

```csharp
var muxer = ConnectionMultiplexer.Connect("localhost:6379");

services.AddFusionCache()
    .WithSerializer(
        new FusionCacheSystemTextJsonSerializer()
    )
    .WithDistributedCache(
        new RedisCache(new RedisCacheOptions { ConnectionMultiplexerFactory = () => muxer })
    )
    .WithBackplane(
        new RedisBackplane(new RedisBackplaneOptions { ConnectionMultiplexerFactory = () => muxer })
    );
```

FusionCache is now ready to use. The simple example below demonstrates the `GetOrSetAsync` method but see [Core Methods](https://github.com/ZiggyCreatures/FusionCache/blob/main/docs/CoreMethods.md) in the FusionCache docs for full details of the API.

```csharp
var product1 = await cache.GetOrSetAsync<Product>(
    "product:1",
    async _ => GetProductFromDb(1),
    tags: ["sales", "product"]
);

var product2 = await cache.GetOrSetAsync<Product>(
    "product:2",
    async _ => GetProductFromDb(2),
    tags: ["sales", "product"]
);

var order = await cache.GetOrSetAsync<Order>(
    "order:42",
    async _ => GetOrderFromDb(42),
    tags: ["sales", "order"]
);

// LATER...

await cache.RemoveByTagAsync("product");

// NOW BOTH product:1 AND product:2 ARE GONE, ONLY order:42 IS STILL IN THE CACHE
```

## What FusionCache stores in Redis

FusionCache uses Redis in three ways:

- **Cache entries (L2)**: The Redis cache package stores each entry as a hash under the
  key you chose, prefixed with `v2:`. For example, `product:1` is stored as
  `v2:product:1`. The hash holds `absexp` and `sldexp` (expiry fields used by the
  package) and `data`, which is a JSON envelope containing your value, a timestamp, the
  entry's tags, and metadata. The key has a TTL, and an entry has a default duration of
  30 seconds unless you set another one.
- **Tag markers**: `RemoveByTagAsync("product")` doesn't scan or delete entries. It writes
  one extra entry, `v2:__fc:t:product`, that holds a timestamp. FusionCache then treats
  any entry with that tag that is older than the timestamp as expired the next time it
  reads it.
- **Backplane messages**: When a node changes or removes an entry, it publishes a message
  on a Redis pub/sub channel named `<cache name>.Backplane:v2`. The message contains the
  key and the action, not the value. Other nodes then expire their L1 copy. Redis pub/sub
  isn't scoped to a database, so if several separate caches share one Redis server, give
  each a different cache name or set `BackplaneChannelPrefix` in `FusionCacheOptions`.

## Cache data with the cache-aside pattern

`GetOrSetAsync` implements the [cache-aside](/content/develop/use-cases/cache-aside/_index.md)
pattern: it returns the cached value if there is one, and otherwise runs your factory
function, stores the result, and returns it. The examples below assume that `cache` is an
`IFusionCache` configured as in [Getting started](#getting-started).

### Read through the cache

Pass an options delegate to set how long an entry lives. In this example, the first call
runs the factory and the second call is served from the cache:

```csharp
var product = await cache.GetOrSetAsync<Product>(
    "product:1",
    async _ => await LoadProductFromDbAsync(1),
    opt => opt.SetDuration(TimeSpan.FromMinutes(5))
);
```

Redis shows the entry with a TTL of about 5 minutes.

### Invalidate on write

After you update the primary database, remove the entry so that the next read loads the
new value:

```csharp
await UpdateProductInDbAsync(product);
await cache.RemoveAsync("product:1");
```

`RemoveAsync` deletes the entry from the L1 cache and from Redis, and tells other nodes
through the backplane to drop their L1 copies.

### Prevent cache stampedes

When many callers ask for the same missing key at once, FusionCache runs the factory once
and gives all of them the result. In a test, 50 concurrent calls for one key on one node
caused one database read.

That protection is per node. In a test with four nodes (each with its own L1 cache) and 20
concurrent calls per node for one missing key, each node ran the factory, so the database
saw four reads. To make the nodes coordinate, add the Redis distributed locker:

```powershell
dotnet add package ZiggyCreatures.FusionCache.Locking.Distributed.Redis
```

```csharp
services.AddFusionCache()
    .WithSerializer(new FusionCacheSystemTextJsonSerializer())
    .WithDistributedCache(new RedisCache(new RedisCacheOptions { Configuration = "localhost:6379" }))
    .WithBackplane(new RedisBackplane(new RedisBackplaneOptions { Configuration = "localhost:6379" }))
    .WithDistributedLocker(new RedisDistributedLocker(new RedisDistributedLockerOptions { Configuration = "localhost:6379" }));
```

With the locker, the same four-node test caused one database read. The locker is an
optimization to avoid duplicate work, not a lock to protect correctness. Keep your factory
safe to run more than once.

### Serve stale data when the database is down

With Fail-Safe, FusionCache keeps an expired entry for longer and serves it if the factory
throws. The following options expire the entry after 1 second, keep it for up to 1
minute, and wait 5 seconds before calling the factory again after a failure:

```csharp
Action<FusionCacheEntryOptions> options = opt => opt
    .SetDuration(TimeSpan.FromSeconds(1))
    .SetFailSafe(true, maxDuration: TimeSpan.FromMinutes(1), throttleDuration: TimeSpan.FromSeconds(5));

var product = await cache.GetOrSetAsync<Product>(
    "product:4",
    async _ => await LoadProductFromDbAsync(4),
    options
);
```

In a test where the entry had expired and the factory then threw, the call returned the
stale product, and further calls within 5 seconds returned it without calling the factory.
The next call after the throttle period tried the factory again.

## Further reading

To learn more about FusionCache and its advanced features:

- [FusionCache Documentation](https://github.com/ZiggyCreatures/FusionCache)
- [FusionCache Redis notes](https://github.com/ZiggyCreatures/FusionCache/blob/main/docs/RedisNotes.md)
- [FusionCache NuGet Package](https://www.nuget.org/packages/ZiggyCreatures.FusionCache)
- [Redis Backplane Package](https://www.nuget.org/packages/ZiggyCreatures.FusionCache.Backplane.StackExchangeRedis)
- [Redis Distributed Locker Package](https://www.nuget.org/packages/ZiggyCreatures.FusionCache.Locking.Distributed.Redis)
