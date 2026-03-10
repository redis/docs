---
LinkTitle: FusionCache
Title: FusionCache for C#/.NET
categories:
- docs
- integrate
- oss
- rs
- rc
description: Easy to use, fast and robust hybrid cache with advanced resiliency features for C#/.NET
group: library
stack: true
summary: FusionCache is an easy to use, fast and robust hybrid cache with advanced resiliency features for C#/.NET applications.
title: FusionCache
type: integration
weight: 9
---
FusionCache can transparently handle multiple cache levels by mixing a memory cache and a distributed cache together, getting the best of both worlds. It allows for a sophisticated yet incredibly easy to use developer experience by handling all the complexities of a modern, fast and robust hybrid cache that can deal with the most complex and demanding scenarios. When coupled with Redis, performance, robustness and scaling will not be a problem anymore.

## Key Features

- **Hybrid**: Can be used as both L1 (memory only) or L1+L2 (memory + distributed)
- **Tagging**: Powerful tagging capabilities to easily work with multiple entries at once
- **Backplane**: For instant multi-node distributed notifications
- **Stampede Protection**: Both on single node (with a memory locker) and multi-node (with a distributed locker)
- **Redis Perfect Match**: Native support for all distributed parts (cache, backplane and locker)
- **Resiliency**: Fully resilient thanks to features like Fail-Safe, Eager Refresh, Factory Timeouts, Auto-Recovery and more
- **Sync+Async**: Full support for both programming models
- **.NET Ecosystem**: Seamless integration with ASP.NET Core, Entity Framework, and other .NET technologies

## Install

Using the dotnet CLI, run:

```ps
dotnet add package ZiggyCreatures.FusionCache
```

Other packages are also available to work with different distributed caches, serializers, backplanes and more.
See the [FusionCache docs](https://github.com/ZiggyCreatures/FusionCache/blob/main/docs/README.md) for more information.
## Getting Started

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

And if we want to share the same underlying connection multiplexer, we can just:

```csharp
var muxer = ConnectionMultiplexer.Connect("localhost:6379")

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

Finally, it's just a matter of simply using it:

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

## Further Reading

To learn more about FusionCache and its advanced features:

- [FusionCache Documentation](https://github.com/ZiggyCreatures/FusionCache)
- [FusionCache NuGet Package](https://www.nuget.org/packages/ZiggyCreatures.FusionCache)
- [Redis Backplane Package](https://www.nuget.org/packages/ZiggyCreatures.FusionCache.Backplane.StackExchangeRedis)

