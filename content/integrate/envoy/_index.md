---
LinkTitle: Envoy
Title: Redis with Envoy
alwaysopen: false
categories:
- docs
- integrate
- oss
- rs
- rc
description: Use Redis for global rate limiting in Envoy through the rate limit service.
group: platform
hideListLinks: false
stack: true
summary: Envoy enforces a global rate limit by calling the envoyproxy/ratelimit service, which keeps its counters in Redis, and Envoy can also proxy the Redis protocol.
type: integration
weight: 21
---

[Envoy](https://www.envoyproxy.io/) is a proxy that is often used as an API gateway and service
proxy. Envoy itself doesn't store rate limit counters in Redis. Instead, it calls a *rate limit
service* over gRPC, and the reference implementation,
[`envoyproxy/ratelimit`](https://github.com/envoyproxy/ratelimit), keeps its counters in Redis.
See the [rate limiter use case](/content/develop/use-cases/rate-limiter/_index.md) for when to choose
this pattern.

## Requirements

The examples on this page were run with Envoy 1.34 and the `envoyproxy/ratelimit` image against
Redis 8.0, with two Envoy instances sharing one rate limit service and one Redis server.

You also need a running Redis server. You can run one locally with
[Redis Open Source](/content/operate/oss_and_stack/install/archive/install-redis/_index.md),
use [Docker](https://hub.docker.com/_/redis), or connect to
[Redis Cloud](https://redis.io/cloud/).

## Configure the rate limit service

The service reads its rules from YAML files. This file allows 3 requests a minute for the
descriptor `generic_key: api` in the `demo` domain:

```yaml
# <runtime-root>/ratelimit/config/config.yaml
domain: demo
descriptors:
  - key: generic_key
    value: api
    rate_limit:
      unit: minute
      requests_per_unit: 3
```

Start the service with environment variables that point at Redis and at the configuration
directory:

```bash
USE_STATSD=false \
REDIS_SOCKET_TYPE=tcp \
REDIS_URL=<your-redis-host>:6379 \
RUNTIME_ROOT=<runtime-root> \
RUNTIME_SUBDIRECTORY=ratelimit \
ratelimit
```

The service reads configuration files from
`RUNTIME_ROOT/RUNTIME_SUBDIRECTORY/config/`. The service's
[README](https://github.com/envoyproxy/ratelimit) lists the other Redis settings, including
`REDIS_AUTH`, `REDIS_TLS`, and Sentinel and Cluster modes.

## Configure Envoy

In the Envoy configuration, a route action produces the descriptor, the `ratelimit` HTTP filter
calls the service for it, and a cluster with HTTP/2 enabled points at the service:

```yaml
# In the route
rate_limits:
- actions:
  - generic_key: { descriptor_value: api }

# In http_filters, before the router filter
- name: envoy.filters.http.ratelimit
  typed_config:
    "@type": type.googleapis.com/envoy.extensions.filters.http.ratelimit.v3.RateLimit
    domain: demo
    failure_mode_deny: false
    rate_limit_service:
      transport_api_version: V3
      grpc_service:
        envoy_grpc: { cluster_name: ratelimit }

# In clusters
- name: ratelimit
  type: STRICT_DNS
  typed_extension_protocol_options:
    envoy.extensions.upstreams.http.v3.HttpProtocolOptions:
      "@type": type.googleapis.com/envoy.extensions.upstreams.http.v3.HttpProtocolOptions
      explicit_http_config:
        http2_protocol_options: {}
  load_assignment:
    cluster_name: ratelimit
    endpoints:
    - lb_endpoints:
      - endpoint: { address: { socket_address: { address: <ratelimit-host>, port_value: 8081 } } }
```

In a test with two Envoy instances, five requests that alternated between them returned `200`,
`200`, `200`, `429`, and `429`.

## What the rate limit service stores in Redis

The service keeps one counter for each descriptor and time window, as a string:

```
<domain>_<key>_<value>_<window-start-seconds>
```

In the test the key was `demo_generic_key_api_<window-start>`. It held `5` after the five
requests, and its TTL was 91 seconds for a 60-second window, so the TTL is longer than the
window.

## When Redis or the service is unavailable

With `failure_mode_deny: false`, Envoy lets requests through when the rate limit check fails. In
the test, every request returned `200` with no added latency when the rate limit service was
stopped, and again when the service was running but Redis was stopped. Set `failure_mode_deny:
true` if you want Envoy to reject requests when it can't check the limit. The examples on this page don't cover that setting.

## Envoy as a Redis proxy

Envoy also has a Redis proxy filter, which lets Envoy act as a proxy for the Redis protocol and
partition commands among the instances of a Redis cluster. See the
[Envoy documentation](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/other_protocols/redis).
The examples on this page don't cover it, and it isn't part of rate limiting.

## More information

- [Global rate limiting in Envoy](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/other_features/global_rate_limiting)
- [envoyproxy/ratelimit](https://github.com/envoyproxy/ratelimit)
