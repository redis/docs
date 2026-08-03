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
description: Three approaches for connecting Google ADK agents to Redis memory.
group: ai
stack: true
summary: Choose between framework-managed services, LLM-controlled REST tools, and
  MCP protocol tools for memory integration.
type: integration
weight: 2
---

adk-redis offers three distinct approaches for connecting agents to memory. Each has different tradeoffs around control, complexity, and standardization.

## Comparison

| Approach | Control | Complexity | Protocol | Backends | Best for |
|----------|---------|-----------|----------|----------|----------|
| **ADK services** | Framework | Low | HTTP | Managed and self-hosted | Invisible infrastructure |
| **REST tools** | LLM | Medium | HTTP | Managed and self-hosted | Explicit memory management |
| **MCP tools** | LLM | Medium | SSE | Self-hosted only | Standardized, portable |

All three approaches select a memory backend with a `backend` field:
`"redis-agent-memory"` (managed, the default) or `"opensource-agent-memory"`
(self-hosted). See [Redis Agent Memory]({{< relref "/integrate/google-adk/redis-agent-memory#choose-a-memory-backend" >}})
for the feature comparison.

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

## 3. MCP tools (Model Context Protocol)

Point ADK's native `McpToolset` at the Agent Memory Server's SSE endpoint. Tool discovery happens automatically.

{{< note >}}
The MCP endpoint is a self-hosted Agent Memory Server feature. The managed
`redis-agent-memory` backend does not expose one.
{{< /note >}}

```python
import os

from google.adk.tools.mcp_tool import McpToolset
from google.adk.tools.mcp_tool.mcp_session_manager import SseConnectionParams

# The MCP server runs on a separate port from the REST API
memory_mcp_url = os.getenv("MEMORY_MCP_URL", "http://localhost:9000")

memory_tools = McpToolset(
    connection_params=SseConnectionParams(
        url=f"{memory_mcp_url.rstrip('/')}/sse",
    ),
    tool_filter=[
        "search_long_term_memory",
        "create_long_term_memories",
        "memory_prompt",
    ],
)

agent = Agent(
    model="gemini-2.5-flash",
    name="mcp_agent",
    tools=[memory_tools],
)
```

Available MCP tools: `search_long_term_memory`, `create_long_term_memories`, `get_long_term_memory`, `edit_long_term_memory`, `delete_long_term_memories`, `memory_prompt`, and `set_working_memory`.

**Tradeoffs:** Most standardized and portable approach. Swap memory backends without changing agent code. Requires Agent Memory Server with MCP support on a separate port.

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

The [travel_agent_memory_hybrid](https://github.com/redis-developer/adk-redis/tree/main/examples/travel_agent_memory_hybrid) example demonstrates this pattern.

## More info

- [managed_memory_quickstart](https://github.com/redis-developer/adk-redis/tree/main/examples/managed_memory_quickstart): Framework services on the managed backend
- [simple_redis_memory](https://github.com/redis-developer/adk-redis/tree/main/examples/simple_redis_memory): Framework services on the self-hosted backend
- [travel_agent_memory_tools](https://github.com/redis-developer/adk-redis/tree/main/examples/travel_agent_memory_tools): REST tools only
- [fitness_coach_mcp](https://github.com/redis-developer/adk-redis/tree/main/examples/fitness_coach_mcp): MCP tools
- [Car dealership tutorial](https://redis.io/tutorials/build-a-car-dealership-agent-with-google-adk-and-redis-agent-memory/)
