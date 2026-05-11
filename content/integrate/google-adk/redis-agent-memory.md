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
description: Working and long-term memory for Google ADK agents using the Redis Agent Memory Server.
group: ai
stack: true
summary: Add persistent working and long-term memory to ADK agents via framework services, REST tools, or MCP.
type: integration
weight: 1
---

Redis Agent Memory gives ADK agents two tiers of persistent memory, backed by the [Redis Agent Memory Server](https://github.com/redis/agent-memory-server):

- **Working memory** — session-scoped storage for the current conversation, with automatic summarization when context grows long.
- **Long-term memory** — facts extracted from past conversations, stored as vectors in Redis and searchable by semantic similarity with optional recency boosting.

You can wire these tiers into an ADK agent three ways:

| Approach | Control | Best for |
|----------|---------|----------|
| **Framework services** | ADK Runner (automatic) | Invisible infrastructure |
| **REST tools** | LLM (explicit) | Agent autonomy over memory |
| **MCP tools** | LLM via MCP protocol | Portable, standardized |

See [Integration patterns]({{< relref "/integrate/google-adk/integration-patterns" >}}) for detailed tradeoff comparison.

## Working memory

`RedisWorkingMemorySessionService` implements ADK's `BaseSessionService`. It stores the current conversation in the Redis Agent Memory Server and automatically summarizes older messages when the context window limit is approached.

```python
from adk_redis.sessions import (
    RedisWorkingMemorySessionService,
    RedisWorkingMemorySessionServiceConfig,
)

session_service = RedisWorkingMemorySessionService(
    config=RedisWorkingMemorySessionServiceConfig(
        api_base_url="http://localhost:8088",
        default_namespace="my_app",
        model_name="gemini-2.0-flash",
        context_window_max=8000,
    )
)
```

### Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `api_base_url` | Agent Memory Server URL | Required |
| `default_namespace` | Isolates data between applications | Required |
| `model_name` | LLM used for summarization | `None` |
| `context_window_max` | Token limit that triggers summarization | `None` |

### Auto-summarization

When the token count of stored messages crosses `context_window_max`, the Agent Memory Server uses the model specified in `model_name` to summarize older turns. Recent messages are preserved in full. This avoids the hard tradeoff between truncating context (losing information) and sending the full conversation (hitting token limits and costs).

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

`RedisLongTermMemoryService` implements ADK's `BaseMemoryService`. After each conversation, the Agent Memory Server extracts structured information (facts, preferences, episodic events), embeds them as vectors, and stores them in Redis for semantic search across all past sessions.

```python
from adk_redis.memory import (
    RedisLongTermMemoryService,
    RedisLongTermMemoryServiceConfig,
)

memory_service = RedisLongTermMemoryService(
    config=RedisLongTermMemoryServiceConfig(
        api_base_url="http://localhost:8088",
        default_namespace="my_app",
        extraction_strategy="discrete",
        recency_boost=True,
        semantic_weight=0.7,
        recency_weight=0.3,
    )
)
```

### Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `api_base_url` | Agent Memory Server URL | Required |
| `default_namespace` | Namespace for data isolation | Required |
| `extraction_strategy` | How conversations are broken into memories: `discrete`, `summary`, or `preferences` | `None` |
| `recency_boost` | Enable recency-weighted search | `False` |
| `semantic_weight` | Weight for vector similarity (0-1) | `0.7` |
| `recency_weight` | Weight for recency signal (0-1) | `0.3` |

### Extraction strategies

- **`discrete`**: Extracts individual facts as separate memories, making them independently searchable.
- **`summary`**: Creates a narrative summary of the conversation.
- **`preferences`**: Focuses on user preferences and settings.

### Recency boosting

Raw semantic similarity often isn't enough. A user might have said "I love Italian food" three years ago and "I've been getting into Japanese cuisine" last week. Both are semantically relevant, but the recent one matters more.

Recency boosting combines semantic similarity with time-based signals so that recent preferences outweigh stale ones.

## Framework services

Pass both services to an ADK `Runner`. The framework handles memory automatically: sessions are persisted via working memory, long-term memory is searched before each agent turn, and an `after_agent_callback` triggers extraction in the background.

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

1. ADK creates or retrieves a session via `RedisWorkingMemorySessionService`.
2. Long-term memory is searched for context relevant to the current conversation.
3. User messages are appended to working memory incrementally.
4. The LLM generates a response using session context plus retrieved memories.
5. `after_agent_callback` triggers `add_session_to_memory()` for background extraction.
6. If the conversation grows long, working memory auto-summarizes older turns.

## REST tools

Give the agent explicit memory tools that the LLM calls like any other function. The LLM decides when to search memory, what to store, and what to update. No framework services required.

```python
from adk_redis.tools.memory import (
    SearchMemoryTool,
    CreateMemoryTool,
    UpdateMemoryTool,
    DeleteMemoryTool,
    MemoryToolConfig,
)

config = MemoryToolConfig(
    api_base_url="http://localhost:8088",
    default_namespace="my_app",
    recency_boost=True,
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

Requires prompt engineering to teach the LLM memory management strategy, but gives the agent genuine autonomy over its own memory.

## MCP tools

Point ADK's `McpToolset` at the Agent Memory Server's SSE endpoint. Tool discovery happens automatically — no manual tool wiring required.

```python
from adk_redis.tools.mcp_memory import create_memory_mcp_toolset

memory_tools = create_memory_mcp_toolset(
    server_url="http://localhost:9000",
    tool_filter=["search_long_term_memory", "create_long_term_memories"],
)

agent = Agent(
    model="gemini-2.5-flash",
    name="mcp_agent",
    tools=[memory_tools],
)
```

Available MCP tools: `search_long_term_memory`, `create_long_term_memories`, `get_long_term_memory`, `edit_long_term_memory`, `delete_long_term_memories`, `memory_prompt`, `set_working_memory`.

The most portable approach — swap memory backends without changing agent code. Requires the Agent Memory Server running with MCP support on a separate port.

## More info

- [Integration patterns]({{< relref "/integrate/google-adk/integration-patterns" >}}): Detailed tradeoff comparison of all three approaches
- [simple_redis_memory](https://github.com/redis-developer/adk-redis/tree/main/examples/simple_redis_memory): Minimal framework services setup
- [travel_agent_memory_tools](https://github.com/redis-developer/adk-redis/tree/main/examples/travel_agent_memory_tools): REST tools only
- [fitness_coach_mcp](https://github.com/redis-developer/adk-redis/tree/main/examples/fitness_coach_mcp): MCP tools
- [travel_agent_memory_hybrid](https://github.com/redis-developer/adk-redis/tree/main/examples/travel_agent_memory_hybrid): Framework services + REST tools combined
- [Agent Memory Server documentation](https://github.com/redis/agent-memory-server)

