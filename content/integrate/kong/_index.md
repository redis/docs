---
LinkTitle: Kong Gateway
Title: Redis with Kong Gateway
alwaysopen: false
categories:
- docs
- integrate
- oss
- rs
- rc
description: Share rate limits across Kong Gateway nodes with Redis.
group: platform
hideListLinks: false
stack: true
summary: Use the Kong rate-limiting plugin with a Redis policy so that several gateway nodes share one counter, and learn which Redis features belong to Kong Gateway Enterprise.
type: integration
weight: 20
---

[Kong Gateway](https://konghq.com/) is an API gateway. Its `rate-limiting` plugin can keep its
counters in Redis, so that several Kong nodes enforce one shared limit. See the [rate limiter use case](/content/develop/use-cases/rate-limiter/_index.md) for when to choose
this pattern.

## Requirements

The examples on this page were run with the open source Kong Gateway 3.9 image (`kong:3.9`) in
DB-less mode against Redis 8.0, with two Kong nodes sharing one Redis server.

You also need a running Redis server. You can run one locally with
[Redis Open Source](/content/operate/oss_and_stack/install/archive/install-redis/_index.md),
use [Docker](https://hub.docker.com/_/redis), or connect to
[Redis Cloud](https://redis.io/cloud/).

## Limit requests with a Redis policy

The `rate-limiting` plugin's `policy` setting selects where Kong keeps the counters:

| Policy | Where the counters live |
|--------|-------------------------|
| `local` (default) | In the memory of each Kong node, so each node enforces its own limit. |
| `cluster` | In Kong's database. |
| `redis` | In Redis, shared by every node that uses the same Redis server. |

This declarative configuration allows 3 requests a minute on a route and keeps the counters in
Redis:

```yaml
_format_version: "3.0"
services:
  - name: demo
    url: http://<your-upstream>
    routes:
      - name: demo-route
        paths:
          - /api
        plugins:
          - name: rate-limiting
            config:
              minute: 3
              policy: redis
              redis:
                host: <your-redis-host>
                port: 6379
                database: 0
```

In a test with two Kong nodes behind the same Redis server, five requests that alternated
between the nodes returned `200`, `200`, `200`, `429`, and `429`. Each response carried
`X-RateLimit-Remaining-Minute` and `RateLimit-Remaining` headers, and the `429` responses
added `Retry-After: 60`.

### Redis connection options

The `redis` settings of the plugin, from the
[Kong plugin reference](https://developer.konghq.com/plugins/rate-limiting/reference/):

| Setting | Default | Notes |
|---------|---------|-------|
| `host`, `port` | none, `6379` | The Redis server. |
| `username`, `password` | none | For [ACL](/content/operate/oss_and_stack/management/security/acl.md) authentication (Redis 6.0 or later). If you don't set a password, Kong sends no `AUTH` command. |
| `database` | `0` | The [logical database](/content/commands/select.md). |
| `ssl`, `ssl_verify`, `server_name` | `false`, `true` | Transport Layer Security (TLS) settings. |
| `timeout` | `2000` | The connection timeout in milliseconds. |

## What Kong stores in Redis

Kong keeps one counter for each client and time window, as a string:

```
ratelimit:<route-id>:<service-id>:<client-ip>:<window-start-ms>:minute
```

The counter has a time to live (TTL) of 60 seconds for a `minute` limit. After the five
requests above it held `5`: Kong counts the requests that it rejects as well as the ones that it
allows.

## When Redis is unavailable

In the test, with the Redis server stopped, Kong let every request through (`200`), and each
one took about 2 seconds, which is the default `timeout`. The gateway fails open, but its
latency rises by the connection timeout, so lower `timeout` if that matters to you.

## Kong Gateway Enterprise

According to the Kong documentation, some Redis features are available only in Kong Gateway
Enterprise:

- **Rate Limiting Advanced** adds Redis Sentinel and Redis Cluster support.
- **Proxy Cache Advanced** caches responses in Redis. The open source `proxy-cache` plugin stores
  its cache in memory only.
- The `session` plugin stores sessions in the cookie or in Kong's database. It has no Redis
  storage option.

The examples on this page don't cover these Enterprise plugins.

## Kong AI Gateway

Kong's AI Gateway plugins can also use Redis. All three of the following plugins are part of the Kong AI Gateway Enterprise offering and need a license. The open source [`ai-proxy`](https://developer.konghq.com/plugins/ai-proxy/) plugin has no Redis integration.

| Plugin | What Redis does |
|--------|-----------------|
| [AI Semantic Cache](https://developer.konghq.com/plugins/ai-semantic-cache/) | Stores prompt embeddings and responses, so a similar prompt gets the cached response without a model call. Set `config.vectordb.strategy` to `redis`. |
| [AI Rate Limiting Advanced](https://developer.konghq.com/plugins/ai-rate-limiting-advanced/) | Keeps the token-cost counters in Redis when `config.strategy` is `redis`, so several Kong nodes share one limit. |
| [AI Proxy Advanced](https://developer.konghq.com/plugins/ai-proxy-advanced/) | Stores the vectors that its semantic load balancing algorithm uses to route a prompt to a model. |

The semantic features use [Redis Search](/content/develop/ai/search-and-query/_index.md) to search vectors and [JSON](/content/develop/data-types/json/_index.md) to store entries. Kong lists Redis Open Source 8.0 or later, which includes both, and Redis Cloud as supported. On a Redis version earlier than 8, you need Redis Stack or another distribution that adds both modules. Vector index creation fails without them.

The examples on this page don't cover these plugins, so check the plugin pages for the full settings. See the [semantic cache use case](/content/develop/use-cases/semantic-cache/_index.md) for
more information about when to use this pattern.

## More information

- [Rate Limiting plugin](https://developer.konghq.com/plugins/rate-limiting/)
- [Kong Gateway documentation](https://developer.konghq.com/gateway/)
