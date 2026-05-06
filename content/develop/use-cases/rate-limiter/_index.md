---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Enforce request quotas across distributed services with Redis
hideListLinks: true
linkTitle: Rate limiter
title: Redis rate limiter
weight: 1
---

## When to use a Redis rate limiter

Use a Redis rate limiter when you need to enforce per-user, per-API, or per-tenant request quotas consistently across distributed service instances.

## Why the problem is hard

APIs and services get overloaded by traffic spikes, abusive clients, or misconfigured integrations. Without rate limiting, downstream systems — databases, third-party APIs, LLM providers, payment gateways — become unavailable or generate unbounded costs.

Local per-process counters break behind load balancers: the same client bypasses limits by hitting different instances. The rate limiter needs a centralized store fast enough to sit on the request path without adding meaningful latency.

## What you can expect from a Redis solution

You can:

-   Enforce quotas per user, IP, API key, tenant, or model across all instances.
-   Run fixed window, sliding window, and token bucket algorithms on a single Redis deployment.
-   Add a synchronous rate check to any gateway or service on the request path.
-   Protect downstream systems from overload without adding meaningful latency.

## How Redis supports the solution

In practice, a Redis rate limiter is a single shared store that every service instance queries on every request, returning an allow/deny decision in sub-millisecond time. Counters live behind keys scoped to the dimension you are limiting on (user, IP, API key, tenant, model), and time windows are cleaned up by Redis itself.

Redis provides the following features that make it a good fit for rate limiting:

-   [`INCR`]({{< relref "/commands/incr" >}}) and [`EXPIRE`]({{< relref "/commands/expire" >}})
    give you atomic fixed-window counters with automatic time-window cleanup.
-   [Hashes]({{< relref "/develop/data-types/hashes" >}}),
    [sorted sets]({{< relref "/develop/data-types/sorted-sets" >}}), and
    [strings]({{< relref "/develop/data-types/strings" >}}) cover the data shapes needed for
    sliding window and token bucket algorithms.
-   Hash field expiration in Redis 8
    ([`HEXPIRE`]({{< relref "/commands/hexpire" >}})) further simplifies time-bound
    rate limiting at the field level.
-   [Lua scripting]({{< relref "/develop/programmability/eval-intro" >}}) with
    [`EVAL`]({{< relref "/commands/eval" >}}) keeps the read-decide-update cycle atomic, so
    concurrent requests cannot double-spend tokens or lose counter updates.
-   Sub-millisecond latency means the rate check sits on the synchronous request path
    without adding meaningful delay, even at millions of requests per second.
-   [Active-Active replication]({{< relref "/operate/rs/databases/active-active" >}})
    provides CRDT-based global consistency for rate limits enforced across regions.

## Ecosystem

The following libraries and frameworks provide Redis-backed rate limiting:

-   **Node.js**:
    [rate-limiter-flexible](https://github.com/animir/node-rate-limiter-flexible),
    [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit)
    (with a Redis store)
-   **Python**: [limits](https://limits.readthedocs.io/),
    plus custom implementations on top of [redis-py](https://redis.readthedocs.io/)
-   **Go**: [go-redis/redis_rate](https://github.com/go-redis/redis_rate)
-   **API gateways**: [Kong](https://docs.konghq.com/hub/kong-inc/rate-limiting/) and
    [Envoy](https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/rate_limit_filter)
    use Redis for distributed rate limiting

## Code examples to build your own Redis rate limiter

The following guides show how to build a token bucket rate limiter with Redis and Lua scripts.
Each guide includes a runnable interactive demo for each of the following client libraries:

* [redis-py (Python)]({{< relref "/develop/use-cases/rate-limiter/redis-py" >}})
* [node-redis (Node.js)]({{< relref "/develop/use-cases/rate-limiter/nodejs" >}})
* [go-redis (Go)]({{< relref "/develop/use-cases/rate-limiter/go" >}})
* [Jedis (Java)]({{< relref "/develop/use-cases/rate-limiter/java-jedis" >}})
* [Lettuce (Java)]({{< relref "/develop/use-cases/rate-limiter/java-lettuce" >}})
* [StackExchange.Redis (C#)]({{< relref "/develop/use-cases/rate-limiter/dotnet" >}})
* [Predis (PHP)]({{< relref "/develop/use-cases/rate-limiter/php" >}})
* [redis-rb (Ruby)]({{< relref "/develop/use-cases/rate-limiter/ruby" >}})
* [redis-rs (Rust)]({{< relref "/develop/use-cases/rate-limiter/rust" >}})
