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
description: Deprecated Agent Memory Server backend for Google ADK agents, kept for
  existing deployments.
group: ai
stack: true
summary: Reference for the deprecated opensource-agent-memory backend, and how to
  migrate to Redis Agent Memory.
type: integration
weight: 6
---

{{< warning >}}
Agent Memory Server (`opensource-agent-memory`) is deprecated and is not
maintained going forward. This page exists for teams with an existing
deployment. For anything new, use
[Redis Agent Memory]({{< relref "/integrate/google-adk/redis-agent-memory" >}})
with `backend="redis-agent-memory"`, on
[Redis Cloud]({{< relref "/operate/rc/context-engine/agent-memory" >}}) or
[self-managed]({{< relref "/develop/ai/context-engine/agent-memory/self-managed" >}})
on your own Kubernetes cluster.
{{< /warning >}}

[Agent Memory Server](https://github.com/redis/agent-memory-server) is the open
source memory server that adk-redis targets with
`backend="opensource-agent-memory"`. It is a different system from Redis Agent
Memory: it does not speak the
[Agent Memory Data Plane API]({{< relref "/develop/ai/context-engine/agent-memory/api-reference" >}}).

{{< note >}}
Running Agent Memory yourself does not require this backend. Self-managed Agent
Memory uses `backend="redis-agent-memory"` and the same Data Plane API as Redis
Cloud. Choose a deployment with `api_base_url`, not with `backend`.
{{< /note >}}

## Migrate to Redis Agent Memory

Moving an existing agent off this backend is mostly configuration:

1. Provision a Redis Agent Memory store, on
   [Redis Cloud]({{< relref "/operate/rc/context-engine/agent-memory/create-service" >}})
   or [self-managed]({{< relref "/develop/ai/context-engine/agent-memory/self-managed" >}}).
   Either gives you a Data Plane endpoint, an API key, and a store ID.
2. Change `backend` from `opensource-agent-memory` to `redis-agent-memory` on
   every service and tool config.
3. Point `api_base_url` at the Data Plane endpoint, and add `api_key` and
   `store_id`.
4. Remove the settings listed under [Configuration](#configuration) below, which
   apply only to this backend.
5. Replace any MCP memory wiring with the
   [REST memory tools]({{< relref "/integrate/google-adk/redis-agent-memory#rest-tools" >}}).

Existing memories are not copied by changing configuration. Plan for a
re-extraction window, or keep both backends running while long-term memory
repopulates.

## Setup

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
`--network=host` plus `REDIS_URL=redis://127.0.0.1:6379`, or point `REDIS_URL` at
the Docker bridge gateway (typically `redis://172.17.0.1:6379`).

The `memory` extra requires `agent-memory-client>=0.14.0` for this backend.

Set `backend="opensource-agent-memory"` on each service config. Otherwise the
services speak the Data Plane API and will not reach your container.

```python
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
        backend="opensource-agent-memory",
        api_base_url="http://localhost:8088",
        default_namespace="my_app",
        model_name="gemini-2.5-flash",
        context_window_max=8000,
    )
)

memory_service = RedisLongTermMemoryService(
    config=RedisLongTermMemoryServiceConfig(
        backend="opensource-agent-memory",
        api_base_url="http://localhost:8088",
        default_namespace="my_app",
        extraction_strategy="discrete",
        recency_boost=True,
        semantic_weight=0.8,
        recency_weight=0.2,
    )
)
```

`api_key` and `store_id` do not apply unless your server requires them.

## Configuration

These settings apply only to this backend. They have no effect with
`redis-agent-memory`.

| Parameter | Description | Default |
|-----------|-------------|---------|
| `model_name` | LLM used for summarization | `None` |
| `context_window_max` | Token limit that triggers summarization | `None` |
| `extraction_strategy` | `discrete`, `summary`, `preferences`, or `custom` | `discrete` |
| `extraction_strategy_config` | Extra options for the strategy | `{}` |
| `recency_boost` | Enable recency-weighted search | `True` |

## Backend-only features

The capabilities below exist only on this backend. They are not available with
`redis-agent-memory`, on Redis Cloud or self-managed, and are not being carried
forward. Treat them as a migration consideration rather than a reason to adopt a
deprecated backend.

### Auto-summarization

When the token count of stored messages crosses `context_window_max`, the server
uses the model in `model_name` to summarize older turns while preserving recent
messages in full. This avoids choosing between truncating context and sending
the whole conversation.

### Extraction strategies

- **`discrete`**: extracts individual facts as separate, independently
  searchable memories. This is the default.
- **`summary`**: creates a narrative summary of the conversation.
- **`preferences`**: focuses on user preferences and settings.
- **`custom`**: uses the prompt and options you supply in
  `extraction_strategy_config`.

### Recency boosting

Raw semantic similarity is often not enough. A user might have said "I love
Italian food" three years ago and "I've been getting into Japanese cuisine" last
week. Both are semantically relevant, but the recent one matters more. Recency
boosting combines semantic similarity with time-based signals so recent
preferences outweigh stale ones.

Tuned with `semantic_weight`, `recency_weight`, `freshness_weight`,
`novelty_weight`, `half_life_last_access_days`, and `half_life_created_days`.

### MCP tools

Agent Memory Server exposes an SSE MCP endpoint, which ADK's native
`McpToolset` can point at directly. The `redis-agent-memory` backend has no MCP
endpoint; use its
[REST memory tools]({{< relref "/integrate/google-adk/redis-agent-memory#rest-tools" >}})
instead.

```python
import os

from google.adk import Agent
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

Available MCP tools: `search_long_term_memory`, `create_long_term_memories`,
`get_long_term_memory`, `edit_long_term_memory`, `delete_long_term_memories`,
`memory_prompt`, and `set_working_memory`.

## Examples

These examples in the adk-redis repository run against this backend.

| Example | Notes |
|---------|-------|
| [simple_redis_memory](https://github.com/redis-developer/adk-redis/tree/main/examples/simple_redis_memory) | Framework services, with auto-summarization and extraction. The `redis-agent-memory` counterpart is [managed_memory_quickstart]({{< relref "/integrate/google-adk/examples#managed_memory_quickstart" >}}). |
| [travel_agent_memory_hybrid](https://github.com/redis-developer/adk-redis/tree/main/examples/travel_agent_memory_hybrid) | Framework services combined with REST tools. |
| [fitness_coach_mcp](https://github.com/redis-developer/adk-redis/tree/main/examples/fitness_coach_mcp) | MCP memory tools, which this backend alone provides. |

[travel_agent_memory_tools](https://github.com/redis-developer/adk-redis/tree/main/examples/travel_agent_memory_tools)
defaults to this backend but switches with `REDIS_MEMORY_BACKEND`, so it also
runs on `redis-agent-memory`.

## More info

- [Redis Agent Memory]({{< relref "/integrate/google-adk/redis-agent-memory" >}}): the supported backend
- [Self-managed Agent Memory]({{< relref "/develop/ai/context-engine/agent-memory/self-managed" >}}): run Agent Memory on your own Kubernetes cluster
- [Agent Memory Server on GitHub](https://github.com/redis/agent-memory-server)
