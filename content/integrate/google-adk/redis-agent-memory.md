---
LinkTitle: Redis Agent Memory
Title: Redis Agent Memory
alwaysopen: false
categories:
- docs
- integrate
- oss
- rs
- rc
description: Session and long-term memory for Google ADK agents using managed Redis Agent Memory or the self-hosted Agent Memory Server.
group: ai
stack: true
summary: Add persistent session and long-term memory to ADK agents via framework services, REST tools, or MCP.
type: integration
weight: 1
---

Redis Agent Memory gives ADK agents two tiers of persistent memory:

- **Session memory**: session-scoped storage for the current conversation.
- **Long-term memory**: facts extracted from past conversations, stored as vectors in Redis and searchable by semantic similarity with recency boosting.

## Choose a memory backend

Both tiers run on either of two backends, selected per service with a `backend` field:

| Backend | `backend` value | What it is |
|---------|-----------------|------------|
| **[Redis Agent Memory](https://redis.io/agent-memory/)** | `redis-agent-memory` (default) | Managed service. Provision a store and pass its endpoint, API key, and store ID. Nothing to run. |
| **Agent Memory Server** (deprecated) | `opensource-agent-memory` | [Self-hosted](https://github.com/redis/agent-memory-server). You run the server. Deprecated: use [Redis Agent Memory](https://redis.io/agent-memory/) for new work. |

Use [Redis Agent Memory](https://redis.io/agent-memory/) for new work. The
self-hosted Agent Memory Server backend is deprecated and documented here for
existing deployments.

Feature availability differs today:

| Feature | Managed | Self-hosted (deprecated) |
|---------|---------|--------------------------|
| Session persistence | Yes | Yes |
| Long-term memory search | Yes | Yes |
| Memory tools (REST) | Yes | Yes |
| Recency-boosted search | No | Yes |
| Auto-summarization | No | Yes |
| Extraction strategies | No | Yes |
| MCP endpoint | No | Yes |

Some capabilities are currently self-hosted only. If your agent depends on one
of them, factor that into your migration timing rather than treating the
self-hosted backend as a long-term target.

The managed backend is the default. If you point a service at a local Agent
Memory Server without setting `backend="opensource-agent-memory"`, the service
still targets the managed backend and will not reach your server.

You can wire either backend into an ADK agent three ways:

| Approach | Control | Best for |
|----------|---------|----------|
| **Framework services** | ADK Runner (automatic) | Invisible infrastructure |
| **REST tools** | LLM (explicit) | Agent autonomy over memory |
| **MCP tools** | LLM via MCP protocol | Portable, standardized (self-hosted only) |

See [Integration patterns]({{< relref "/integrate/google-adk/integration-patterns" >}}) for detailed tradeoff comparison.

## Session memory

`RedisSessionMemoryService` implements ADK's `BaseSessionService`. It stores the current conversation in the configured memory backend.

```python
from adk_redis.sessions import (
    RedisSessionMemoryService,
    RedisSessionMemoryServiceConfig,
)

# Managed backend (default)
session_service = RedisSessionMemoryService(
    config=RedisSessionMemoryServiceConfig(
        backend="redis-agent-memory",
        api_base_url="https://your-endpoint.redis.io",
        api_key="your-api-key",
        store_id="your-store-id",
        default_namespace="my_app",
    )
)

# Self-hosted backend, with auto-summarization
session_service = RedisSessionMemoryService(
    config=RedisSessionMemoryServiceConfig(
        backend="opensource-agent-memory",
        api_base_url="http://localhost:8088",
        default_namespace="my_app",
        model_name="gemini-2.5-flash",
        context_window_max=8000,
    )
)
```

{{< note >}}
`RedisWorkingMemorySessionService` and `RedisWorkingMemorySessionServiceConfig`
were renamed to `RedisSessionMemoryService` and
`RedisSessionMemoryServiceConfig` in adk-redis 0.0.8. The old names remain as
deprecated aliases that emit a `DeprecationWarning` and will be removed in
0.1.0. The module `adk_redis.sessions.working_memory` also moved to
`adk_redis.sessions.session_memory`.
{{< /note >}}

### Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `backend` | `redis-agent-memory` or `opensource-agent-memory` | `redis-agent-memory` |
| `api_base_url` | Memory backend URL | `http://localhost:8000` |
| `api_key` | API key. Managed backend. | `None` |
| `store_id` | Store ID. Managed backend. | `None` |
| `default_namespace` | Isolates data between applications | `None` |
| `timeout` | Request timeout in seconds | `30.0` |
| `timeout_ms` | Request timeout in milliseconds. Overrides `timeout`. | `None` |
| `session_ttl_seconds` | Expiry for stored sessions | `None` |
| `model_name` | LLM used for summarization. Self-hosted backend. | `None` |
| `context_window_max` | Token limit that triggers summarization. Self-hosted backend. | `None` |
| `extraction_strategy` | `discrete`, `summary`, `preferences`, or `custom`. Self-hosted backend. | `discrete` |
| `extraction_strategy_config` | Extra options for the strategy | `{}` |

### Auto-summarization

Auto-summarization is a self-hosted Agent Memory Server feature. When the token count of stored messages crosses `context_window_max`, the server uses the model specified in `model_name` to summarize older turns. Recent messages are preserved in full. This avoids the hard tradeoff between truncating context (losing information) and sending the full conversation (hitting token limits and costs).

### Incremental appends

The session service uses an incremental append API: it sends only new messages rather than re-sending the entire conversation on every turn. Network overhead stays proportional to message size, not conversation length.

### Supported operations

The service implements all of ADK's session methods:
- `create_session`: Create a new session
- `get_session`: Retrieve an existing session
- `list_sessions`: List sessions for an app/user
- `delete_session`: Remove a session
- `append_event`: Add a new message (incremental)

## Long-term memory

`RedisLongTermMemoryService` implements ADK's `BaseMemoryService`. After each conversation, the memory backend extracts structured information (facts, preferences, episodic events), embeds them as vectors, and stores them in Redis for semantic search across all past sessions.

```python
from adk_redis.memory import (
    RedisLongTermMemoryService,
    RedisLongTermMemoryServiceConfig,
)

# Managed backend (default)
memory_service = RedisLongTermMemoryService(
    config=RedisLongTermMemoryServiceConfig(
        backend="redis-agent-memory",
        api_base_url="https://your-endpoint.redis.io",
        api_key="your-api-key",
        store_id="your-store-id",
        default_namespace="my_app",
    )
)

# Self-hosted backend, with extraction and recency boosting
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

### Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `backend` | `redis-agent-memory` or `opensource-agent-memory` | `redis-agent-memory` |
| `api_base_url` | Memory backend URL | `http://localhost:8000` |
| `api_key` | API key. Managed backend. | `None` |
| `store_id` | Store ID. Managed backend. | `None` |
| `default_namespace` | Namespace for data isolation | `None` |
| `timeout` | Request timeout in seconds | `30.0` |
| `search_top_k` | Maximum memories returned per search | `10` |
| `similarity_threshold` | Minimum similarity for a match (0-1) | `None` |
| `distance_threshold` | Maximum vector distance for a match (0-1) | `None` |
| `store_events_as_messages` | Store session events as chat messages | `True` |
| `default_memory_type` | Memory type applied to new memories | `semantic` |
| `default_topics` | Topics applied to new memories | `[]` |
| `extraction_strategy` | `discrete`, `summary`, `preferences`, or `custom`. Self-hosted backend. | `discrete` |
| `extraction_strategy_config` | Extra options for the strategy | `{}` |
| `recency_boost` | Enable recency-weighted search. Self-hosted backend. | `True` |
| `semantic_weight` | Weight for vector similarity (0-1) | `0.8` |
| `recency_weight` | Weight for recency signal (0-1) | `0.2` |
| `freshness_weight` | Weight for the freshness component of the recency signal | `0.6` |
| `novelty_weight` | Weight for the novelty component of the recency signal | `0.4` |
| `half_life_last_access_days` | Half-life for last-access decay, in days | `7.0` |
| `half_life_created_days` | Half-life for creation-time decay, in days | `30.0` |

### Extraction strategies

Extraction strategies apply to the self-hosted backend.

- **`discrete`**: Extracts individual facts as separate memories, making them independently searchable. This is the default.
- **`summary`**: Creates a narrative summary of the conversation.
- **`preferences`**: Focuses on user preferences and settings.
- **`custom`**: Uses the prompt and options you supply in `extraction_strategy_config`.

### Recency boosting

Raw semantic similarity often isn't enough. A user might have said "I love Italian food" three years ago and "I've been getting into Japanese cuisine" last week. Both are semantically relevant, but the recent one matters more.

Recency boosting combines semantic similarity with time-based signals so that recent preferences outweigh stale ones. It is enabled by default and takes effect on the self-hosted backend.

## Framework services

Pass both services to an ADK `Runner`. The framework handles memory automatically: sessions are persisted via session memory, long-term memory is searched before each agent turn, and an `after_agent_callback` triggers extraction in the background.

```python
from google.adk import Agent
from google.adk.agents.callback_context import CallbackContext
from google.adk.runners import Runner

async def after_agent(callback_context: CallbackContext):
    await callback_context.add_session_to_memory()

agent = Agent(
    name="memory_agent",
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

### Runtime flow

1. ADK creates or retrieves a session via `RedisSessionMemoryService`.
2. Long-term memory is searched for context relevant to the current conversation.
3. User messages are appended to session memory incrementally.
4. The LLM generates a response using session context plus retrieved memories.
5. `after_agent_callback` triggers `add_session_to_memory()` for background extraction.
6. On the self-hosted backend, if the conversation grows long, session memory auto-summarizes older turns.

## REST tools

Give the agent explicit memory tools that the LLM calls like any other function. The LLM decides when to search memory, what to store, and what to update. No framework services required. The tools work against either backend and share a single `MemoryToolConfig`.

adk-redis ships six memory tools:

| Tool | Description |
|------|-------------|
| `SearchMemoryTool` | Search long-term memories by query |
| `CreateMemoryTool` | Store new long-term memories |
| `GetMemoryTool` | Fetch a single memory by ID |
| `UpdateMemoryTool` | Update an existing memory by ID |
| `DeleteMemoryTool` | Delete memories by ID |
| `MemoryPromptTool` | Enrich the agent prompt with relevant memories |

```python
from adk_redis.tools.memory import (
    SearchMemoryTool,
    CreateMemoryTool,
    GetMemoryTool,
    UpdateMemoryTool,
    DeleteMemoryTool,
    MemoryPromptTool,
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
        GetMemoryTool(config=config),
        UpdateMemoryTool(config=config),
        DeleteMemoryTool(config=config),
        MemoryPromptTool(config=config),
    ],
)
```

Requires prompt engineering to teach the LLM memory management strategy, but gives the agent genuine autonomy over its own memory.

### Invocation-scoped users

The memory tools resolve the acting user from the ADK `tool_context` before falling back to the user configured on `MemoryToolConfig`. A single shared `Runner` therefore stays scoped to the user of each invocation, with no per-user tool instances.

`CreateMemoryTool.run_async()` also accepts an application-supplied `id` for idempotent writes against the managed backend. IDs are derived with namespace and user scope to prevent cross-tenant collisions, and are never exposed to the LLM.

## MCP tools

Point ADK's native `McpToolset` at the Agent Memory Server's SSE endpoint. Tool discovery happens automatically, so no manual tool wiring is required.

{{< note >}}
The MCP endpoint is a self-hosted Agent Memory Server feature. The managed
`redis-agent-memory` backend does not expose one. Use the REST memory tools
above with the managed backend.
{{< /note >}}

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

Available MCP tools: `search_long_term_memory`, `create_long_term_memories`, `get_long_term_memory`, `edit_long_term_memory`, `delete_long_term_memories`, `memory_prompt`, and `set_working_memory`.

This is the most portable approach: swap memory backends without changing agent code. It requires the Agent Memory Server running with MCP support on a separate port.

## More info

- [Integration patterns]({{< relref "/integrate/google-adk/integration-patterns" >}}): Detailed tradeoff comparison of all three approaches
- [managed_memory_quickstart](https://github.com/redis-developer/adk-redis/tree/main/examples/managed_memory_quickstart): Managed backend, no Docker
- [simple_redis_memory](https://github.com/redis-developer/adk-redis/tree/main/examples/simple_redis_memory): Self-hosted backend with framework services
- [travel_agent_memory_tools](https://github.com/redis-developer/adk-redis/tree/main/examples/travel_agent_memory_tools): REST tools only
- [fitness_coach_mcp](https://github.com/redis-developer/adk-redis/tree/main/examples/fitness_coach_mcp): MCP tools
- [travel_agent_memory_hybrid](https://github.com/redis-developer/adk-redis/tree/main/examples/travel_agent_memory_hybrid): Framework services + REST tools combined
- [Agent Memory Server documentation](https://github.com/redis/agent-memory-server)

