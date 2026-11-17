---
LinkTitle: Apache APISIX
Title: Redis with Apache APISIX
alwaysopen: false
categories:
- docs
- integrate
- oss
- rs
- rc
description: Share rate limits across Apache APISIX nodes with Redis.
group: platform
hideListLinks: false
stack: true
summary: Use the APISIX limit-count plugin with a Redis policy so that several gateway nodes share one counter, and choose how the gateway behaves when Redis is down.
type: integration
weight: 22
---

[Apache APISIX](https://apisix.apache.org/) is an API gateway. Its `limit-count` plugin can keep
its counters in Redis, so that several APISIX nodes enforce one shared limit. See the [rate limiter use case](/content/develop/use-cases/rate-limiter/_index.md) for when to choose
this pattern.

## Requirements

The examples on this page were run with Apache APISIX 3.13 in standalone mode against Redis 8.0,
with two APISIX nodes sharing one Redis server.

You also need a running Redis server. You can run one locally with
[Redis Open Source](/content/operate/oss_and_stack/install/archive/install-redis/_index.md),
use [Docker](https://hub.docker.com/_/redis), or connect to
[Redis Cloud](https://redis.io/cloud/).

## Limit requests with a Redis policy

The `policy` setting of `limit-count` selects where APISIX keeps the counters. `local` is the
default, which gives each node its own limit. The other documented values are `redis`,
`redis-cluster`, and `redis-sentinel`. This route allows 3 requests a minute for each client address
and keeps the counters in Redis. In standalone mode, which reads its routes from a file, set
`config_provider: yaml` in `config.yaml`:

```yaml
deployment:
  role: data_plane
  role_data_plane:
    config_provider: yaml
```

Then put the route in `apisix.yaml`:

```yaml
routes:
  - uri: /api/*
    plugins:
      limit-count:
        count: 3
        time_window: 60
        key_type: var
        key: remote_addr
        rejected_code: 429
        policy: redis
        redis_host: <your-redis-host>
        redis_port: 6379
        redis_database: 0
    upstream:
      type: roundrobin
      nodes:
        "<your-upstream>": 1
#END
```

In a test with two APISIX nodes behind the same Redis server, five requests that alternated
between the nodes returned `200`, `200`, `200`, `429`, and `429`. Each response carried
`X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers.

### Redis connection options

The plugin's Redis settings are `redis_host`, `redis_port` (default `6379`), `redis_username`,
`redis_password`, `redis_database` (default `0`), `redis_timeout` (default `1000` milliseconds),
and the TLS settings `redis_ssl`, `redis_ssl_verify`, and `redis_server_name`. The cluster policy
uses `redis_cluster_nodes` and `redis_cluster_name`. See the
[limit-count documentation](https://apisix.apache.org/docs/apisix/plugins/limit-count/) for the
full list. According to that page, Redis Sentinel support needs APISIX 3.18.0 or later, which the examples on this page don't cover.

## What APISIX stores in Redis

APISIX keeps one string for each route and client, with a TTL equal to the `time_window`:

```
plugin-limit-count<route-key>:<route-version>:<client-ip>
```

Unlike Kong and Envoy, APISIX stores the remaining quota, not a count of requests. After five
requests against a limit of 3, the value was `-2`.

## When Redis is unavailable

By default, APISIX rejects requests with a `500` error when it can't reach Redis. In the test, with
the Redis server stopped, each request returned `500` within about 0.1 seconds. Set
`allow_degradation: true` on the plugin to fail open instead. With that setting, the same
requests returned `200`.

## Other plugins

According to the APISIX documentation, `limit-req` and `limit-conn` also accept a Redis policy
(`redis` or `redis-cluster`), and the `openid-connect` plugin can store sessions in Redis with
`session.storage: redis`. The examples on this page don't cover these.

## More information

- [limit-count plugin](https://apisix.apache.org/docs/apisix/plugins/limit-count/)
- [openid-connect plugin](https://apisix.apache.org/docs/apisix/plugins/openid-connect/)
