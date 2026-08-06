---
LinkTitle: Integration patterns
Title: Memory integration patterns
alwaysopen: false
categories:
- docs
- integrate
- oss
- rs
- rc
description: Approaches for connecting Google ADK agents to Redis memory.
group: ai
stack: true
summary: Choose between framework-managed services and LLM-controlled REST tools for
  memory integration.
type: integration
weight: 2
---

adk-redis offers two approaches for connecting agents to memory. Each has different tradeoffs around control and complexity.

## Comparison

| Approach | Control | Complexity | Protocol | Best for |
|----------|---------|-----------|----------|----------|
| **ADK services** | Framework | Low | HTTP | Invisible infrastructure |
| **REST tools** | LLM | Medium | HTTP | Explicit memory management |

Both use `backend="redis-agent-memory"`, the default, on Redis Cloud or
self-managed. See
[Redis Agent Memory]({{< relref "/integrate/google-adk/redis-agent-memory#choose-a-deployment" >}})
for the deployment options.

{{< note >}}
A third approach, MCP memory tools, is only available on the deprecated
[Agent Memory Server]({{< relref "/integrate/google-adk/agent-memory-server" >}})
backend.
{{< /note >}}

## 1. ADK services (framework-managed)

Configure `RedisSessionMemoryService` and `RedisLongTermMemoryService`, pass them to the `Runner`, and the framework handles everything automatically. Memory extraction happens in the background. Search happens before each agent turn. The agent code never directly interacts with memory.

```python
from google.adk.runners import Runner
from adk_redis.sessions import (
    RedisSessionMemoryService,
    RedisSessionMemoryServiceConfig,
)
from adk_redis.memory import (
    RedisLongTermMemoryService,
    RedisLongTermMemoryServiceConfig,
)

runner = Runner(
    agent=agent,
    app_name="my_app",
    session_service=RedisSessionMemoryService(
        config=RedisSessionMemoryServiceConfig(
            backend="redis-agent-memory",
            api_base_url="https://your-endpoint.redis.io",
            api_key="your-api-key",
            store_id="your-store-id",
            default_namespace="my_app",
        )
    ),
    memory_service=RedisLongTermMemoryService(
        config=RedisLongTermMemoryServiceConfig(
            backend="redis-agent-memory",
            api_base_url="https://your-endpoint.redis.io",
            api_key="your-api-key",
            store_id="your-store-id",
            default_namespace="my_app",
        )
    ),
)
```

**Tradeoffs:** Simplest to implement, hardest to customize. The agent has no explicit control over what gets stored or when it searches.

## 2. REST tools (LLM-controlled)

Give the agent explicit memory tools that the LLM calls like any other function. The LLM decides when to search memory, what to store, and what to update.

```python
from adk_redis.tools.memory import (
    SearchMemoryTool,
    CreateMemoryTool,
    UpdateMemoryTool,
    DeleteMemoryTool,
    MemoryToolConfig,
)

config = MemoryToolConfig(
    backend="redis-agent-memory",
    api_base_url="https://your-endpoint.redis.io",
    api_key="your-api-key",
    store_id="your-store-id",
    default_namespace="my_app",
)

agent = Agent(
    model="gemini-2.5-flash",
    name="memory_agent",
    tools=[
        SearchMemoryTool(config=config),
        CreateMemoryTool(config=config),
        UpdateMemoryTool(config=config),
        DeleteMemoryTool(config=config),
    ],
)
```

**Tradeoffs:** Requires prompt engineering to teach the LLM memory management strategy, but gives the agent genuine autonomy over its own memory.

## Hybrid approach

The most powerful configuration combines framework services with REST tools. Framework services handle session persistence and automatic background extraction. REST tools give the LLM explicit CRUD control on top.

```python
# LLM-controlled tools on the Agent
agent = Agent(
    model="gemini-2.5-flash",
    name="hybrid_agent",
    tools=[
        SearchMemoryTool(config=config),
        CreateMemoryTool(config=config),
        UpdateMemoryTool(config=config),
        DeleteMemoryTool(config=config),
    ],
)

# Framework-managed services on the Runner
runner = Runner(
    agent=agent,
    app_name="my_app",
    session_service=session_service,   # Auto session management
    memory_service=memory_service,     # Auto memory search
)
```

The pattern works on `redis-agent-memory`. The
example that demonstrates it,
[travel_agent_memory_hybrid](https://github.com/redis-developer/adk-redis/tree/main/examples/travel_agent_memory_hybrid),
is currently written against the deprecated backend; see
[Agent Memory Server (deprecated)]({{< relref "/integrate/google-adk/agent-memory-server#examples-still-on-this-backend" >}}).

## More info

- [managed_memory_quickstart](https://github.com/redis-developer/adk-redis/tree/main/examples/managed_memory_quickstart): Framework services on Redis Agent Memory
- [travel_agent_memory_tools](https://github.com/redis-developer/adk-redis/tree/main/examples/travel_agent_memory_tools): REST tools only
- [Agent Memory Server (deprecated)]({{< relref "/integrate/google-adk/agent-memory-server" >}}): MCP tools and other deprecated-backend patterns
- [Car dealership tutorial](https://redis.io/tutorials/build-a-car-dealership-agent-with-google-adk-and-redis-agent-memory/)
