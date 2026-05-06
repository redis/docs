---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Build ranked leaderboards with Redis sorted sets and user metadata
hideListLinks: true
linkTitle: Leaderboard
title: Redis leaderboard
weight: 3
---

## When to use a Redis leaderboard

Use a Redis leaderboard when you need to rank entities — players, products, sellers, stocks — by a score that changes continuously and serve those rankings to users in real time.

## Why the problem is hard

Computing a single entity's rank in a relational database requires an `ORDER BY` across the full table — O(N) at best — and at millions of rows this pushes query time into seconds. Caching the result doesn't help because scores change on every user action, so any TTL-based cache is immediately stale or triggers thundering-herd refreshes on expiry.

Local in-process data structures break behind load balancers because no single instance holds the complete ranking. A dedicated OLAP or leaderboard service could solve the ranking problem but adds operational overhead for what is fundamentally a single sorted data structure.

This use case is also distinct from [Redis Streams]({{< relref "/develop/data-types/streams" >}}) (which record event history but don't maintain ranked state) and from the probabilistic [Top-K]({{< relref "/develop/data-types/probabilistic/top-k" >}}) data structure (which approximates heavy hitters but cannot return exact ranks or neighborhood queries).

## What you can expect from a Redis solution

You can:

-   Show any user their exact global rank and the neighbors immediately above and below them, updated on every score change.
-   Serve top-N pages to thousands of concurrent readers without degrading write performance.
-   Run daily, weekly, and monthly boards that create and expire themselves automatically.
-   Aggregate time-windowed boards into composite rankings without application-side sorting.
-   Support millions of ranked members in roughly 500 MB of RAM.
-   Add leaderboard functionality to an existing deployment without provisioning new infrastructure.

## How Redis supports the solution

In practice, the leaderboard is stored as a Redis sorted set — one key per board — with members keyed by entity ID and scored by the value you want to rank on. A companion hash per entity holds metadata (name, avatar, tier) so the sorted set stays lightweight.

Redis provides the following features that make it a good fit for leaderboards:

-   [Sorted sets]({{< relref "/develop/data-types/sorted-sets" >}}) maintain rank order automatically, with
    [`ZADD`]({{< relref "/commands/zadd" >}}), [`ZRANGE`]({{< relref "/commands/zrange" >}}), and
    [`ZREVRANK`]({{< relref "/commands/zrevrank" >}}) all running in O(log N) regardless of set size.
-   [`ZINCRBY`]({{< relref "/commands/zincrby" >}}) updates scores atomically in place — no
    read-modify-write cycle and no cache invalidation.
-   [`ZRANGE`]({{< relref "/commands/zrange" >}}) with `REV` and `LIMIT` serves both top-N and
    "around me" neighborhood queries in a single command.
-   [`EXPIRE`]({{< relref "/commands/expire" >}}) on a per-window key cleans up daily, weekly,
    and monthly boards automatically, and
    [`ZUNIONSTORE`]({{< relref "/commands/zunionstore" >}}) aggregates windows without
    application-level coordination.
-   [Hashes]({{< relref "/develop/data-types/hashes" >}}) store entity metadata so the sorted set
    stays small and fast.
-   Sub-millisecond latency on reads and writes means the leaderboard sits on the request path
    without adding meaningful delay. If Redis is already in the stack, the leaderboard adds zero
    marginal infrastructure.

## Ecosystem

The following libraries and frameworks provide Redis sorted set integrations suitable for leaderboards:

-   **Java**:
    [Spring Data Redis (`ZSetOperations`)](https://docs.spring.io/spring-data/redis/reference/redis/template.html)
-   **Python**: [redis-py](https://redis.readthedocs.io/),
    [redis-om-python](https://github.com/redis/redis-om-python)
-   **Node.js**: [ioredis](https://github.com/redis/ioredis),
    [node-redis](https://github.com/redis/node-redis)
-   **Infrastructure**: [Redis Cloud]({{< relref "/operate/rc" >}})
    (Active-Active for multi-region with conflict-free replicated sorted sets)

## Code examples to build your own Redis leaderboard

The following guides show how to build a simple Redis-backed leaderboard.
Each guide includes a runnable interactive demo for each of the following client libraries:

* [redis-py (Python)]({{< relref "/develop/use-cases/leaderboard/redis-py" >}})
* [node-redis (Node.js)]({{< relref "/develop/use-cases/leaderboard/nodejs" >}})
* [go-redis (Go)]({{< relref "/develop/use-cases/leaderboard/go" >}})
* [Jedis (Java)]({{< relref "/develop/use-cases/leaderboard/java-jedis" >}})
* [Lettuce (Java)]({{< relref "/develop/use-cases/leaderboard/java-lettuce" >}})
* [StackExchange.Redis (C#)]({{< relref "/develop/use-cases/leaderboard/dotnet" >}})
* [Predis (PHP)]({{< relref "/develop/use-cases/leaderboard/php" >}})
* [redis-rb (Ruby)]({{< relref "/develop/use-cases/leaderboard/ruby" >}})
* [redis-rs (Rust)]({{< relref "/develop/use-cases/leaderboard/rust" >}})
