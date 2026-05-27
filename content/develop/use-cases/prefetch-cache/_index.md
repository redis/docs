---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Pre-load reference data into Redis so every read is a cache hit.
hideListLinks: true
linkTitle: Prefetch cache
title: Redis prefetch cache
weight: 5
---

## When to use Redis prefetch cache

Use a Redis prefetch cache when you need to pre-load reference or master data into cache before the first request arrives, so every read is a hit and no request ever falls through to the primary database.

## Why the problem is hard

Cache-aside guarantees cold-start misses: the first request for every key hits the primary, and between TTL expiry and the next read, every service re-fetches the same rows from a slow backend. At scale this creates latency spikes and sustained read pressure on the system of record — the load pattern is worst exactly when traffic is highest.

Prefetch solves this by loading data proactively, but that brings its own constraints. The entire working set must fit in memory, and it must stay current as the source of truth changes. Building and maintaining the sync pipeline from the source database adds engineering cost and ongoing operational burden — once the cache is the only read path, any sync lag becomes a correctness problem rather than a freshness one.

This pattern is distinct from cache-aside, where the cache populates reactively on miss and the primary is always available as a fall-back. With prefetch, the application assumes the cache is authoritative on the read path; on a miss, it does not fall back to the primary (and a sustained miss rate is treated as an incident). It is also distinct from write-through caching, where every write to the application writes both the cache and the primary in lock-step — prefetch decouples the write path from the cache and lets a separate sync pipeline catch up.

## What you can expect from a Redis solution

You can:

-   Achieve near-100% cache hit ratios for country codes, product categories, translations, configuration, and other reference tables.
-   Keep P95 read latency under 1 ms for lookup-heavy request paths at peak traffic (that is to say 95% of requests have a latency of 1 ms or less).
-   Sync source database changes into cache within seconds using a managed CDC pipeline (such as Redis Data Integration), or a small consumer in front of Debezium, Kafka, or a Redis stream.
-   Offload all reference-data reads from the primary database, avoiding the cost of dedicated read replicas.
-   Pre-warm the cache on deploy or restart so cold starts never reach the backend.
-   Bound memory with a long safety-net TTL that expires entries if the sync pipeline ever stops, so a silent failure never serves stale data forever.

## How Redis supports the solution

In practice, the application loads the full working set into Redis once at startup using a pipelined bulk write, then a separate sync worker keeps Redis current as the source of truth changes. Every reference-data read goes to Redis only — there is no fall-back path to the primary on the request critical path.

Redis provides the following features that make it a good fit for prefetch caching:

-   [Hashes]({{< relref "/develop/data-types/hashes" >}})
    ([`HSET`]({{< relref "/commands/hset" >}}),
    [`HGETALL`]({{< relref "/commands/hgetall" >}})) and native
    [JSON]({{< relref "/develop/data-types/json" >}}) documents
    ([`JSON.SET`]({{< relref "/commands/json.set" >}}),
    [`JSON.GET`]({{< relref "/commands/json.get" >}})) map directly to common
    reference-data lookup patterns — id-keyed records with a fixed set of fields,
    or richer nested documents accessed by JSONPath.
-   [Pipelined]({{< relref "/develop/clients/pools-and-muxing" >}})
    [`HSET`]({{< relref "/commands/hset" >}}) or
    [`MSET`]({{< relref "/commands/mset" >}}) batches make the initial bulk load
    fast: a few thousand records load in a single round trip, so the application
    starts serving from a fully-warm cache within seconds of boot.
-   [`EXPIRE`]({{< relref "/commands/expire" >}}) sets a long safety-net TTL on
    each entry so memory stays bounded even if the sync pipeline silently stops —
    not as the freshness mechanism, but as a guardrail.
-   [`SCAN`]({{< relref "/commands/scan" >}}) iterates the prefetched keyspace
    without blocking the server, so the application can audit cache coverage,
    list available IDs, or run a periodic reconciliation pass against the source.
-   [Streams]({{< relref "/develop/data-types/streams" >}})
    ([`XADD`]({{< relref "/commands/xadd" >}}),
    [`XREAD`]({{< relref "/commands/xread" >}})) provide a durable, replayable
    change feed when the sync worker needs to resume from a known offset after
    a restart — the canonical pattern for CDC consumers feeding Redis.
-   Sub-millisecond reads from memory, so reference-data lookups never appear on
    a flame graph. If Redis is already in the stack for sessions, rate limiting,
    or cache-aside, prefetch runs on the same instance at zero marginal cost.

## Ecosystem

The following libraries and frameworks support Redis-backed prefetch caching:

-   **Java**:
    [Spring Cache abstraction (`@Cacheable` with Redis cache store)](https://docs.spring.io/spring-data/redis/reference/redis/redis-cache.html),
    populated by a startup `CommandLineRunner` for the bulk load.
-   **Node.js**:
    [Redis OM](https://github.com/redis/redis-om-node) for object-mapping
    prefetched JSON documents.
-   **Change-data-capture (CDC)** pipelines that stream source-database changes
    into Redis without custom application code:
    [Redis Data Integration (RDI)]({{< relref "/integrate/redis-data-integration" >}})
    for relational and NoSQL sources on Redis Enterprise / Redis Cloud;
    [Debezium](https://debezium.io/) plus a lightweight Redis consumer for
    open-source Redis.
-   **API gateways**:
    [Kong](https://docs.konghq.com/hub/) plugins to route reference-data reads to
    Redis directly, bypassing the backend service entirely.

## Code examples to build your own Redis prefetch cache

The following guides show how to build a simple Redis-backed prefetch cache in front of a primary store of reference data. Each guide includes a runnable interactive demo that pre-loads records on startup, runs a background sync worker that applies primary-store changes to Redis within milliseconds, and lets you watch the cache stay current as records are added, updated, and deleted on the source.

* [redis-py (Python)]({{< relref "/develop/use-cases/prefetch-cache/redis-py" >}})
* [node-redis (Node.js)]({{< relref "/develop/use-cases/prefetch-cache/nodejs" >}})
* [go-redis (Go)]({{< relref "/develop/use-cases/prefetch-cache/go" >}})
* [Jedis (Java)]({{< relref "/develop/use-cases/prefetch-cache/java-jedis" >}})
* [Lettuce (Java)]({{< relref "/develop/use-cases/prefetch-cache/java-lettuce" >}})
* [StackExchange.Redis (C#)]({{< relref "/develop/use-cases/prefetch-cache/dotnet" >}})
* [Predis (PHP)]({{< relref "/develop/use-cases/prefetch-cache/php" >}})
* [redis-rb (Ruby)]({{< relref "/develop/use-cases/prefetch-cache/ruby" >}})
* [redis-rs (Rust)]({{< relref "/develop/use-cases/prefetch-cache/rust" >}})
