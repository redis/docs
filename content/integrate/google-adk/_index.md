---
LinkTitle: Google ADK
Title: Redis with Google Agent Development Kit (ADK)
alwaysopen: false
categories:
- docs
- integrate
- oss
- rs
- rc
description: Build AI agents with persistent memory, semantic search, and caching
  using Redis and Google ADK.
group: ai
hideListLinks: false
stack: true
summary: Use Redis as the memory, search, and caching layer for Google ADK agents
  via the adk-redis package.
type: integration
weight: 30
---

[Google Agent Development Kit (ADK)](https://google.github.io/adk-docs/) provides clean abstractions for building AI agents: interfaces for memory, sessions, tools, and callbacks. [adk-redis](https://github.com/redis-developer/adk-redis) implements these interfaces using Redis, giving agents persistent two-tier memory, semantic search for RAG, and response caching without requiring changes to agent logic.

## Architecture

adk-redis connects several backend systems to the ADK framework:

- **Memory backends** power the session and long-term memory services. Pick one per service with a `backend` field:
  - **[Redis Agent Memory](https://redis.io/agent-memory/)** (`redis-agent-memory`, the default) is the Agent Memory service. Use this for new work. It runs either on [Redis Cloud]({{< relref "/operate/rc/context-engine/agent-memory" >}}) or [self-managed]({{< relref "/develop/ai/context-engine/agent-memory/self-managed" >}}) on your own Kubernetes cluster; both share one Data Plane API, so you pick a deployment by pointing `api_base_url` at the right endpoint.
  - **[Agent Memory Server](https://github.com/redis/agent-memory-server)** (`opensource-agent-memory`) is the open source memory server, now deprecated. It is documented for existing deployments and currently remains the only backend offering auto-summarization, extraction strategies, recency-boosted search, and an MCP endpoint.
- **[RedisVL]({{< relref "/develop/ai/redisvl" >}})** (Redis Vector Library) powers the search tools and local semantic cache provider.
- **[LangCache](https://redis.io/langcache/)** provides managed semantic caching with server-side embeddings.


## Prerequisites

- **Redis 8.4+** with vector search support, for the search tools and the local semantic cache
- **A memory backend**, for the session and memory services:
  - A **[Redis Agent Memory](https://redis.io/agent-memory/)** store, on Redis Cloud or self-managed, which gives you a Data Plane endpoint, an API key, and a store ID, or
  - An **Agent Memory Server** (deprecated)

### Redis Agent Memory

This is the default backend and the recommended one. Provision a store, then pass its Data Plane endpoint, API key, and store ID to the services.

- On **Redis Cloud**, there is nothing to run. See [Create an Agent Memory service]({{< relref "/operate/rc/context-engine/agent-memory/create-service" >}}).
- To run it **yourself**, see [Self-managed Agent Memory]({{< relref "/develop/ai/context-engine/agent-memory/self-managed" >}}) for deployment, configuration, and operations on your own Kubernetes cluster.

Both use `backend="redis-agent-memory"`. Only `api_base_url` differs.

### Agent Memory Server (deprecated)

```bash
# Start Redis
docker run -d --name redis -p 6379:6379 redis:8.4-alpine

# Start Agent Memory Server
docker run -d --name agent-memory-server -p 8088:8088 \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  -e GEMINI_API_KEY=your-key \
  -e GENERATION_MODEL=gemini/gemini-2.5-flash \
  -e EMBEDDING_MODEL=gemini/text-embedding-004 \
  redislabs/agent-memory-server:latest \
  agent-memory api --host 0.0.0.0 --port 8088 --task-backend=asyncio
```

On Linux, `host.docker.internal` does not resolve by default. Use
`--network=host` plus `REDIS_URL=redis://127.0.0.1:6379`, or point
`REDIS_URL` at the Docker bridge gateway (typically
`redis://172.17.0.1:6379`).

Remember to set `backend="opensource-agent-memory"` on each service config when
you use Agent Memory Server. Otherwise the services speak the Data Plane API
and will not reach your local container.

## Installation

```bash
# Memory and session services (both backends)
pip install adk-redis[memory]

# Search tools via RedisVL
pip install adk-redis[search]

# SQL-style search tool (sql-redis)
pip install adk-redis[sql]

# Managed semantic caching via LangCache
pip install adk-redis[langcache]

# Everything
pip install adk-redis[all]

# For the RedisVL MCP server (used with ADK's native McpToolset)
pip install 'redisvl[mcp]>=0.18.2'
```

The `memory` extra requires `redis-agent-memory>=0.2.0` for the
`redis-agent-memory` backend and `agent-memory-client>=0.14.0` for the
deprecated `opensource-agent-memory` backend.

## Quick start

Wire up Redis Agent Memory in a few lines:

```python
from google.adk import Agent
from google.adk.agents.callback_context import CallbackContext
from google.adk.runners import Runner
from adk_redis.sessions import (
    RedisSessionMemoryService,
    RedisSessionMemoryServiceConfig,
)
from adk_redis.memory import (
    RedisLongTermMemoryService,
    RedisLongTermMemoryServiceConfig,
)

session_service = RedisSessionMemoryService(
    config=RedisSessionMemoryServiceConfig(
        backend="redis-agent-memory",
        api_base_url="https://your-endpoint.redis.io",
        api_key="your-api-key",
        store_id="your-store-id",
        default_namespace="my_app",
    )
)
memory_service = RedisLongTermMemoryService(
    config=RedisLongTermMemoryServiceConfig(
        backend="redis-agent-memory",
        api_base_url="https://your-endpoint.redis.io",
        api_key="your-api-key",
        store_id="your-store-id",
        default_namespace="my_app",
    )
)

async def after_agent(callback_context: CallbackContext):
    await callback_context.add_session_to_memory()

agent = Agent(
    name="my_agent",
    model="gemini-2.5-flash",
    instruction="You are a helpful assistant with long-term memory.",
    after_agent_callback=after_agent,
)

runner = Runner(
    agent=agent,
    app_name="my_app",
    session_service=session_service,
    memory_service=memory_service,
)
```

To run against the deprecated Agent Memory Server instead, set
`backend="opensource-agent-memory"`, point `api_base_url` at the server (for
example `http://localhost:8088`), and drop `api_key` and `store_id` unless your
server requires them.

## Capabilities

| Capability | Description | Page |
|------------|-------------|------|
| **Redis Agent Memory** | Session and long-term memory on Redis Cloud, self-managed, or the deprecated Agent Memory Server, via framework services, REST tools, or MCP | [Redis Agent Memory]({{< relref "/integrate/google-adk/redis-agent-memory" >}}) |
| **Integration patterns** | Framework-managed, LLM-controlled REST, and MCP tools | [Integration patterns]({{< relref "/integrate/google-adk/integration-patterns" >}}) |
| **Search tools** | Vector, hybrid, text, range, and SQL search via RedisVL, plus the `rvl mcp` server over `McpToolset` | [Search tools]({{< relref "/integrate/google-adk/search-tools" >}}) |
| **Semantic caching** | LLM response and tool result caching, with stable entry IDs and targeted invalidation | [Semantic caching]({{< relref "/integrate/google-adk/semantic-caching" >}}) |
| **Examples** | Ten complete examples covering all capabilities | [Examples]({{< relref "/integrate/google-adk/examples" >}}) |

## More info

- [adk-redis on GitHub](https://github.com/redis-developer/adk-redis)
- [adk-redis on PyPI](https://pypi.org/project/adk-redis/)
- [Car dealership tutorial](https://redis.io/tutorials/build-a-car-dealership-agent-with-google-adk-and-redis-agent-memory/)
- [Redis Agent Memory Server](https://github.com/redis/agent-memory-server)
- [RedisVL documentation]({{< relref "/develop/ai/redisvl" >}})
- [Google ADK documentation](https://google.github.io/adk-docs/)
