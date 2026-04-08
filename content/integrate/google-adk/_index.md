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

adk-redis connects three backend systems to the ADK framework:

- **[Redis Agent Memory Server](https://github.com/redis/agent-memory-server)** handles working memory (sessions), long-term memory (extracted facts), auto-summarization, and memory search.
- **[RedisVL](https://docs.redisvl.com)** (Redis Vector Library) powers the search tools and local semantic cache provider.
- **[LangCache](https://redis.io/langcache/)** provides managed semantic caching with server-side embeddings.

## Prerequisites

- **Redis 8.4+** with vector search support
- **Agent Memory Server** for memory and session services

```bash
# Start Redis
docker run -d --name redis -p 6379:6379 redis:8.4-alpine

# Start Agent Memory Server
docker run -d --name agent-memory-server -p 8088:8088 \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  -e GEMINI_API_KEY=your-key \
  -e GENERATION_MODEL=gemini/gemini-2.0-flash \
  -e EMBEDDING_MODEL=gemini/text-embedding-004 \
  redislabs/agent-memory-server:latest \
  agent-memory api --host 0.0.0.0 --port 8088 --task-backend=asyncio
```

## Installation

```bash
# Memory and session services (requires Agent Memory Server)
pip install adk-redis[memory]

# Search tools via RedisVL
pip install adk-redis[search]

# Managed semantic caching via LangCache
pip install adk-redis[langcache]

# Everything
pip install adk-redis[all]
```

## Quick start

Wire up Redis Agent Memory in a few lines:

```python
from google.adk import Agent
from google.adk.agents.callback_context import CallbackContext
from google.adk.runners import Runner
from adk_redis.sessions import (
    RedisWorkingMemorySessionService,
    RedisWorkingMemorySessionServiceConfig,
)
from adk_redis.memory import (
    RedisLongTermMemoryService,
    RedisLongTermMemoryServiceConfig,
)

session_service = RedisWorkingMemorySessionService(
    config=RedisWorkingMemorySessionServiceConfig(
        api_base_url="http://localhost:8088",
        default_namespace="my_app",
    )
)
memory_service = RedisLongTermMemoryService(
    config=RedisLongTermMemoryServiceConfig(
        api_base_url="http://localhost:8088",
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

## Capabilities

| Capability | Description | Page |
|------------|-------------|------|
| **Redis Agent Memory** | Working and long-term memory via framework services, REST tools, or MCP | [Redis Agent Memory]({{< relref "/integrate/google-adk/redis-agent-memory" >}}) |
| **Integration patterns** | Framework-managed, LLM-controlled REST, and MCP tools | [Integration patterns]({{< relref "/integrate/google-adk/integration-patterns" >}}) |
| **Search tools** | Vector, hybrid, text, and range search via RedisVL | [Search tools]({{< relref "/integrate/google-adk/search-tools" >}}) |
| **Semantic caching** | LLM response and tool result caching | [Semantic caching]({{< relref "/integrate/google-adk/semantic-caching" >}}) |
| **Examples** | Seven complete examples covering all capabilities | [Examples]({{< relref "/integrate/google-adk/examples" >}}) |

## More info

- [adk-redis on GitHub](https://github.com/redis-developer/adk-redis)
- [adk-redis on PyPI](https://pypi.org/project/adk-redis/)
- [Car dealership tutorial](https://redis.io/tutorials/build-a-car-dealership-agent-with-google-adk-and-redis-agent-memory/)
- [Redis Agent Memory Server](https://github.com/redis/agent-memory-server)
- [RedisVL documentation](https://docs.redisvl.com)
- [Google ADK documentation](https://google.github.io/adk-docs/)
