---
LinkTitle: Agent Memory Server (deprecated)
Title: Agent Memory Server (deprecated)
alwaysopen: false
categories:
- docs
- integrate
- oss
- rs
- rc
description: Deprecated. The opensource-agent-memory backend is no longer maintained.
  Migrate existing deployments to Redis Agent Memory.
group: ai
stack: true
summary: Deprecated backend. How to migrate an existing Agent Memory Server deployment
  to Redis Agent Memory.
type: integration
weight: 6
---

{{< warning >}}
**Deprecated. Do not use for new work.**

The `opensource-agent-memory` backend and the
[Agent Memory Server](https://github.com/redis/agent-memory-server) it targets
are deprecated and are not maintained going forward. Its capabilities are not
being carried forward, and support for it will be removed from adk-redis.

New agents should use
[Redis Agent Memory]({{< relref "/integrate/google-adk/redis-agent-memory" >}})
with `backend="redis-agent-memory"`, on
[Redis Cloud]({{< relref "/operate/rc/context-engine/agent-memory" >}}) or
[self-managed]({{< relref "/operate/iris/agent-memory/self-managed" >}})
on your own Kubernetes cluster.

This page exists only to help existing deployments migrate.
{{< /warning >}}

## What it was

Agent Memory Server is a separate open source memory server, documented in
[its own repository](https://github.com/redis/agent-memory-server). It is not
Redis Agent Memory and does not speak the
[Agent Memory Data Plane API]({{< relref "/develop/ai/context-engine/agent-memory/api-reference" >}}).
adk-redis reached it with `backend="opensource-agent-memory"`, an
`api_base_url` pointing at the server, and the `agent-memory-client>=0.14.0`
dependency.

A handful of capabilities existed only on this backend: auto-summarization,
extraction strategies, recency-boosted search, and an MCP endpoint. They are
configured through `model_name`, `context_window_max`, `extraction_strategy`,
`extraction_strategy_config`, and `recency_boost`, none of which have any effect
with `redis-agent-memory`. See the
[Agent Memory Server repository](https://github.com/redis/agent-memory-server)
for the server's own setup and reference material.

{{< note >}}
Running Agent Memory yourself never required this backend. Self-managed Agent
Memory is supported and maintained, and uses `backend="redis-agent-memory"` just
like Redis Cloud. You choose a deployment with `api_base_url`, not with
`backend`.
{{< /note >}}

## Migrate to Redis Agent Memory

1. Provision a Redis Agent Memory store, on
   [Redis Cloud]({{< relref "/operate/iris/agent-memory/create-service" >}})
   or [self-managed]({{< relref "/operate/iris/agent-memory/self-managed" >}}).
   Either gives you a Data Plane endpoint, an API key, and a store ID.
2. Change `backend` from `opensource-agent-memory` to `redis-agent-memory` on
   every service and tool config, or drop the field, since it is the default.
3. Point `api_base_url` at the Data Plane endpoint, and add `api_key` and
   `store_id`.
4. Remove the backend-only settings listed above. They are silently inert on
   `redis-agent-memory`.
5. Replace any MCP memory wiring with the
   [REST memory tools]({{< relref "/integrate/google-adk/redis-agent-memory#rest-tools" >}}),
   which work the same way on both backends.
6. Drop `agent-memory-client` from your dependencies. The `memory` extra
   requires `redis-agent-memory>=0.2.0`.

```python
# Before: deprecated backend
config = RedisSessionMemoryServiceConfig(
    backend="opensource-agent-memory",
    api_base_url="http://localhost:8088",
    default_namespace="my_app",
    model_name="gemini-2.5-flash",
    context_window_max=8000,
)

# After: Redis Agent Memory, on Redis Cloud or self-managed
config = RedisSessionMemoryServiceConfig(
    backend="redis-agent-memory",
    api_base_url="https://your-endpoint.redis.io",
    api_key="your-api-key",
    store_id="your-store-id",
    default_namespace="my_app",
)
```

Changing configuration does not copy existing memories. Plan for a
re-extraction window, or run both backends while long-term memory repopulates.

## Examples still on this backend

Three examples in the adk-redis repository have not yet moved:
[simple_redis_memory](https://github.com/redis-developer/adk-redis/tree/main/examples/simple_redis_memory),
[travel_agent_memory_hybrid](https://github.com/redis-developer/adk-redis/tree/main/examples/travel_agent_memory_hybrid),
and
[fitness_coach_mcp](https://github.com/redis-developer/adk-redis/tree/main/examples/fitness_coach_mcp)
(which uses the MCP endpoint this backend alone provides).

For a supported starting point, use
[managed_memory_quickstart]({{< relref "/integrate/google-adk/examples#managed_memory_quickstart" >}}).
[travel_agent_memory_tools](https://github.com/redis-developer/adk-redis/tree/main/examples/travel_agent_memory_tools)
switches backends with `REDIS_MEMORY_BACKEND`, so it already runs on
`redis-agent-memory`.

## More info

- [Redis Agent Memory]({{< relref "/integrate/google-adk/redis-agent-memory" >}}): the supported backend
- [Self-managed Agent Memory]({{< relref "/operate/iris/agent-memory/self-managed" >}}): run Agent Memory on your own Kubernetes cluster
- [Agent Memory Server on GitHub](https://github.com/redis/agent-memory-server): the deprecated server's own documentation
