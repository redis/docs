---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Store web sessions in Redis with cookie-based session IDs and TTL expiration.
hideListLinks: true
linkTitle: Session store
title: Redis session store
weight: 1
---

## When to use

Use this pattern when you need to share per-user session state (login context, shopping carts, preferences) across stateless application servers without sticky sessions or database round-trips.

## Why it's hard

HTTP is stateless, so you must rely on external state to recognize a returning user between requests.
Some of the obvious approaches have significant drawbacks:

-   **Storing sessions on individual app servers**: this requires
    [sticky routing](https://en.wikipedia.org/wiki/Load_balancing_(computing)#Persistence), which creates
    hot spots and precludes [failover](https://en.wikipedia.org/wiki/Failover).
-   **Moving session reads to a relational database**: this adds 5–20 ms per request. If you have
    thousands of concurrent users then session reads dominate connection pools, turning every page load 
    into a contention point that degrades the primary database for all other workloads.

Sessions need automatic cleanup without external sweep jobs. You will incur
direct business costs (abandoned carts, forced re-authentication, interrupted checkouts) if
you lose sessions, so durability matters more than it does with pure caching.

At operational scale, you also need to run queries against multiple sessions (for example, find all
carts containing a recalled product, count sessions per tenant), which is more complicated than just reading individual sessions.

## What Redis gives you

-   [Hashes]({{< relref "/develop/data-types/hashes" >}}) for field-level session access without 
    deserializing an entire session blob.
-   [`EXPIRE`]({{< relref "/commands/expire" >}}) with sliding TTL resets on each request so active 
    sessions stay alive while inactive ones are cleaned up automatically.
-   [Sets]({{< relref "/develop/data-types/sets" >}}) ([`SADD`]({{< relref "/commands/sadd" >}}), 
    [`SMEMBERS`]({{< relref "/commands/smembers" >}})) to track all sessions per user for multi-device 
    management ([`DEL`]({{< relref "/commands/del" >}}) plus [`SREM`]({{< relref "/commands/srem" >}}) 
    handle explicit logout or logout-all).
-   AOF and RDB [persistence]({{< relref "/operate/oss_and_stack/management/persistence" >}}) to let 
    sessions survive process and node restarts within their expiration window. 
-   Secondary indexing via [Redis Search]({{< relref "/develop/ai/search-and-query" >}}) to support     
    cross-session queries at runtime (finding affected carts, counting sessions by tenant)
    without key scanning.
-   Sub-millisecond latency on the request path, on the same Redis instance already in most stacks.

## Practical benefits

In practice you can

-   Eliminate server affinity so any instance can serve any user behind a load balancer.
-   Expire inactive sessions automatically without cleanup jobs or database sweeps.
-   Update individual session fields without re-serializing the full session.
-   Track sessions across multiple devices per user, including logout-all.
-   Query across active sessions for operational and security tasks without key scanning.
-   Retain session data across deployments and node restarts with configurable durability.

## Ecosystem

-   **Java**:
    [Spring Session Data Redis](https://docs.spring.io/spring-session/reference/configuration/redis.html)
-   **Node.js**: [`connect-redis`](https://www.npmjs.com/package/connect-redis)
    ([express-session](https://www.npmjs.com/package/express-session) store)
-   **Python**: [Flask-Session](https://flask-session.readthedocs.io/en/latest/),
    [django-redis](https://pypi.org/project/django-redis/)
-   **API gateways**: [Kong](https://docs.konghq.com/hub/kong-inc/session/),
    [Envoy](https://www.envoyproxy.io/docs/envoy/latest/start/quick-start/configuration-dynamic-control-plane)
    (Redis-backed session and token storage)

## Example implementations

The following guides show how to build a Redis-backed session store.
Each guide includes a runnable example to illustrate using the session store with a basic local
web server for each of the following client libraries:

* [redis-py (Python)]({{< relref "/develop/use-cases/session-store/redis-py" >}})
* [Node.js (Node.js)]({{< relref "/develop/use-cases/session-store/nodejs" >}})
* [go-redis (Go)]({{< relref "/develop/use-cases/session-store/go" >}})
* [Jedis (Java)]({{< relref "/develop/use-cases/session-store/java-jedis" >}})
* [Lettuce (Java)]({{< relref "/develop/use-cases/session-store/java-lettuce" >}})
* [StackExchange.Redis (C#)]({{< relref "/develop/use-cases/session-store/dotnet" >}})
* [Predis (PHP)]({{< relref "/develop/use-cases/session-store/php" >}})
* [redis-rb (Ruby)]({{< relref "/develop/use-cases/session-store/ruby" >}})
* [redis-rs (Rust)]({{< relref "/develop/use-cases/session-store/rust" >}})
