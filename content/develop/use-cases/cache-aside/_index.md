---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Cache database reads in Redis with TTL-bounded staleness.
hideListLinks: true
linkTitle: Cache-aside
title: Redis cache-aside
weight: 4
---

## When to use Redis cache-aside

Use Redis cache-aside when you need to serve repeated reads at sub-millisecond latency without overloading your primary database, caching only the data that is actually requested.

## Why the problem is hard

Read-heavy workloads (product catalogs, user profiles, API responses) hit the same records thousands of times between updates. Primary databases optimized for durability pay the full cost of a disk-based lookup on every request; as traffic grows, P95 latency degrades, connection pools exhaust, and brief spikes cascade into broader service degradation.

An in-process cache solves this for a single instance but breaks across multiple stateless services: each instance warms independently, duplicates memory, and cannot be invalidated consistently. When a popular cached key expires under high concurrency, dozens of processes simultaneously query the database for the same record — a cache stampede that amplifies the exact load spike caching was supposed to prevent.

This use case is distinct from write-through or write-behind caching, where the cache mirrors the full dataset on every write. It is also distinct from semantic caching, which matches LLM responses by embedding similarity rather than exact key lookup.

## What you can expect from a Redis solution

You can:

-   Keep P95 read latency under 5 ms for cached entities at peak traffic.
-   Reduce primary database load proportionally to hit rate without provisioning read replicas.
-   Cache only actively requested data, keeping memory bounded to the working set.
-   Invalidate on write so stale data windows stay within a configured bound.
-   Survive popular-key expiration under load without stampeding the database.
-   Update individual fields in a cached entity without deserializing and rewriting the full object.

## How Redis supports the solution

In practice, each cached entity is stored under a key like `cache:{entity}:{id}`, with a TTL that bounds how long stale data can be served. The application reads from Redis on every request, falls back to the primary on a miss, and writes the result back to Redis. On updates, the application writes the primary and invalidates the cache key.

Redis provides the following features that make it a good fit for cache-aside:

-   [`GET`](/content/commands/get.md) and
    [`SET`](/content/commands/set.md) with per-key
    [`EX`/`PX`](/content/commands/set.md) TTL so every entry has a bounded
    staleness window, and [`DEL`](/content/commands/del.md) on write for explicit
    invalidation — keeping stale data confined to a known, configurable bound.
-   [Hashes](/content/develop/data-types/hashes.md)
    ([`HSET`](/content/commands/hset.md),
    [`HGET`](/content/commands/hget.md)) and native
    [JSON](/content/develop/data-types/json/_index.md) path access
    ([`JSON.SET`](/content/commands/json.set.md),
    [`JSON.GET`](/content/commands/json.get.md)) for structured and
    partial-field caching, avoiding full-object re-serialization on every read or update — a real
    gap in string-only stores like Memcached.
-   [Lua scripting](/content/develop/programmability/eval-intro.md) with
    [`EVAL`](/content/commands/eval.md) for atomic stampede mitigation: mutex locks
    or probabilistic early refresh execute in a single atomic step with no external locking.
-   [`TTL`](/content/commands/ttl.md) for monitoring remaining staleness on any cached
    key without recomputing.
-   Sub-millisecond reads from memory, so the cache check adds negligible overhead on the
    request path. If Redis is already in the stack for sessions, rate limiting, or queues,
    cache-aside runs on the same instance at zero marginal infrastructure cost.

<!-- TODO: add item about INCREX command when Redis 8.8 is GA -->
## Ecosystem

The following libraries and frameworks provide Redis-backed cache-aside integrations:

-   **Java**:
    [Spring Data Redis (`@Cacheable`/`@CacheEvict`)](https://docs.spring.io/spring-data/redis/reference/redis/redis-cache.html),
    [Redis Smart Cache](https://github.com/redis-field-engineering/redis-smart-cache)
    (transparent JDBC-layer cache-aside)
-   **Python**: [Flask-Caching](https://flask-caching.readthedocs.io/)
    (Redis backend),
    [Django cache framework](https://docs.djangoproject.com/en/stable/topics/cache/)
    (with [redis-py](https://redis.readthedocs.io/))
-   **Node.js**: [node-redis](https://github.com/redis/node-redis),
    [ioredis](https://github.com/redis/ioredis) (wrap route handlers with a cache-aside helper)
-   **API gateways**:
    [Kong Redis response caching](https://docs.konghq.com/hub/kong-inc/proxy-cache-advanced/)
    (configurable TTL per route)

## Code examples to build your own Redis cache-aside

The following guides show how to build a simple Redis-backed cache-aside layer in front
of a slow primary store. Each guide includes a runnable interactive demo for each of the
following client libraries:

* [redis-py (Python)](/content/develop/use-cases/cache-aside/redis-py/_index.md)
* [node-redis (Node.js)](/content/develop/use-cases/cache-aside/nodejs/_index.md)
* [go-redis (Go)](/content/develop/use-cases/cache-aside/go/_index.md)
* [Jedis (Java)](/content/develop/use-cases/cache-aside/java-jedis/_index.md)
* [Lettuce (Java)](/content/develop/use-cases/cache-aside/java-lettuce/_index.md)
* [StackExchange.Redis (C#)](/content/develop/use-cases/cache-aside/dotnet/_index.md)
* [Predis (PHP)](/content/develop/use-cases/cache-aside/php/_index.md)
* [redis-rb (Ruby)](/content/develop/use-cases/cache-aside/ruby/_index.md)
* [redis-rs (Rust)](/content/develop/use-cases/cache-aside/rust/_index.md)
