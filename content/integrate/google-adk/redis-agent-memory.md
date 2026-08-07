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
description: Session and long-term memory for Google ADK agents using Redis Agent Memory.
group: ai
stack: true
summary: Add persistent session and long-term memory to ADK agents via framework services or REST tools.
type: integration
weight: 1
---

Redis Agent Memory gives ADK agents two tiers of persistent memory:

- **Session memory**: session-scoped storage for the current conversation.
- **Long-term memory**: facts extracted from past conversations, stored as vectors in Redis and searchable by semantic similarity with recency boosting.

## Choose a deployment

Set `backend="redis-agent-memory"`, the default, on every service and tool
config. Redis Cloud and self-managed Agent Memory share one
[Data Plane API]({{< relref "/develop/ai/context-engine/agent-memory/api-reference" >}}),
so you select a deployment by pointing `api_base_url` at the right Data Plane,
not by changing `backend`:

| Deployment | `api_base_url` | Setup |
|------------|----------------|-------|
| Redis Cloud | Your Redis Cloud Agent Memory endpoint | [Create an Agent Memory service]({{< relref "/operate/rc/context-engine/agent-memory/create-service" >}}) |
| Self-managed | Your own Data Plane URL | [Self-managed Agent Memory]({{< relref "/develop/ai/context-engine/agent-memory/self-managed" >}}) |

{{< note >}}
Running Agent Memory yourself does not mean using the deprecated
`opensource-agent-memory` backend. Self-managed Agent Memory is supported and
maintained, and uses `backend="redis-agent-memory"` like Redis Cloud. The
deprecated backend targets a different system, the open source Agent Memory
Server, which does not speak the Data Plane API. See
[Agent Memory Server (deprecated)]({{< relref "/integrate/google-adk/agent-memory-server" >}})
if you have an existing deployment to migrate.
{{< /note >}}

Wire memory into an ADK agent one of two ways:

| Approach | Control | Best for |
|----------|---------|----------|
| **Framework services** | ADK Runner (automatic) | Invisible infrastructure |
| **REST tools** | LLM (explicit) | Agent autonomy over memory |

See [Integration patterns]({{< relref "/integrate/google-adk/integration-patterns" >}}) for detailed tradeoff comparison.

## Session memory

`RedisSessionMemoryService` implements ADK's `BaseSessionService`. It stores the current conversation in the configured memory backend.

```python
from adk_redis.sessions import (
    RedisSessionMemoryService,
    RedisSessionMemoryServiceConfig,
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
| `backend` | Memory backend | `redis-agent-memory` |
| `api_base_url` | Data Plane endpoint | `http://localhost:8000` |
| `api_key` | API key | `None` |
| `store_id` | Store ID | `None` |
| `default_namespace` | Isolates data between applications | `None` |
| `timeout` | Request timeout in seconds | `30.0` |
| `timeout_ms` | Request timeout in milliseconds. Overrides `timeout`. | `None` |
| `session_ttl_seconds` | Expiry for stored sessions | `None` |

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

memory_service = RedisLongTermMemoryService(
    config=RedisLongTermMemoryServiceConfig(
        backend="redis-agent-memory",
        api_base_url="https://your-endpoint.redis.io",
        api_key="your-api-key",
        store_id="your-store-id",
        default_namespace="my_app",
    )
)
```

### Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `backend` | Memory backend | `redis-agent-memory` |
| `api_base_url` | Data Plane endpoint | `http://localhost:8000` |
| `api_key` | API key | `None` |
| `store_id` | Store ID | `None` |
| `default_namespace` | Namespace for data isolation | `None` |
| `timeout` | Request timeout in seconds | `30.0` |
| `search_top_k` | Maximum memories returned per search | `10` |
| `similarity_threshold` | Minimum similarity for a match (0-1) | `None` |
| `distance_threshold` | Maximum vector distance for a match (0-1) | `None` |
| `store_events_as_messages` | Store session events as chat messages | `True` |
| `default_memory_type` | Memory type applied to new memories | `semantic` |
| `default_topics` | Topics applied to new memories | `[]` |

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

## REST tools

Give the agent explicit memory tools that the LLM calls like any other function. The LLM decides when to search memory, what to store, and what to update. No framework services required. The tools share a single `MemoryToolConfig`.

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

`CreateMemoryTool.run_async()` also accepts an application-supplied `id` for idempotent writes against Redis Agent Memory. IDs are derived with namespace and user scope to prevent cross-tenant collisions, and are never exposed to the LLM.

## MCP tools

MCP memory tools are only available on the deprecated
[Agent Memory Server]({{< relref "/integrate/google-adk/agent-memory-server" >}})
backend. The `redis-agent-memory` backend does not expose an MCP endpoint, on
Redis Cloud or self-managed; use the REST tools above.

## More info

- [Integration patterns]({{< relref "/integrate/google-adk/integration-patterns" >}}): Detailed tradeoff comparison of the approaches
- [managed_memory_quickstart](https://github.com/redis-developer/adk-redis/tree/main/examples/managed_memory_quickstart): Framework services, no Docker
- [travel_agent_memory_tools](https://github.com/redis-developer/adk-redis/tree/main/examples/travel_agent_memory_tools): REST tools only
- [Self-managed Agent Memory]({{< relref "/develop/ai/context-engine/agent-memory/self-managed" >}}): run Agent Memory on your own Kubernetes cluster
- [Agent Memory Server (deprecated)]({{< relref "/integrate/google-adk/agent-memory-server" >}}): existing deployments and migration

