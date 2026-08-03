---
LinkTitle: Examples
Title: adk-redis examples
alwaysopen: false
categories:
- docs
- integrate
- oss
- rs
- rc
description: Complete examples for every adk-redis capability.
group: ai
stack: true
summary: Ten runnable examples covering Redis Agent Memory, search tools, semantic
  caching, and MCP integration.
type: integration
weight: 5
---

The [adk-redis repository](https://github.com/redis-developer/adk-redis/tree/main/examples) includes ten complete examples. Each focuses on a specific capability.

## Prerequisites

All examples require:

- **Python 3.10+**
- **Redis 8.4+**: `docker run -d --name redis -p 6379:6379 redis:8.4-alpine`
- **A memory backend** (for memory examples): a [Redis Agent Memory]({{< relref "/integrate/google-adk/redis-agent-memory" >}}) store on Redis Cloud or self-managed, or a deprecated [Agent Memory Server](https://github.com/redis/agent-memory-server)
- **API keys**: Most examples need a `GOOGLE_API_KEY` for Gemini

Each memory example is written against a specific backend, noted below. The
examples that use auto-summarization, extraction strategies, recency-boosted
search, or MCP require the Agent Memory Server backend.

## `managed_memory_quickstart`

**Backend:** `redis-agent-memory` &middot; **Run:** `python main.py`

The smallest memory example, and the counterpart to `simple_redis_memory`. Uses `redis-agent-memory`, so there is no Agent Memory Server and no Docker to set up. Wires `RedisSessionMemoryService` and `RedisLongTermMemoryService` to an agent with ADK's built-in `preload_memory` and `load_memory` tools. Intentionally avoids Agent Memory Server only features.

[View on GitHub](https://github.com/redis-developer/adk-redis/tree/main/examples/managed_memory_quickstart)

## `simple_redis_memory`

**Backend:** `opensource-agent-memory` (Agent Memory Server) &middot; **Run:** `python main.py`

Minimal starting point for the Agent Memory Server backend. Wires up `RedisSessionMemoryService` and `RedisLongTermMemoryService` with a basic conversational agent, including auto-summarization and extraction. No search tools, no caching: just memory.

[View on GitHub](https://github.com/redis-developer/adk-redis/tree/main/examples/simple_redis_memory)

## `travel_agent_memory_hybrid`

**Backend:** `opensource-agent-memory` (Agent Memory Server) &middot; **Run:** `python main.py`

The most complete example. Combines framework-managed memory services with LLM-controlled memory tools, web search, itinerary planning, and calendar export. Demonstrates the [hybrid integration pattern]({{< relref "/integrate/google-adk/integration-patterns#hybrid-approach" >}}).

[View on GitHub](https://github.com/redis-developer/adk-redis/tree/main/examples/travel_agent_memory_hybrid)

## `travel_agent_memory_tools`

**Backend:** `opensource-agent-memory` (Agent Memory Server), switchable &middot; **Run:** `adk web .`

Uses REST-based memory tools exclusively, without framework-managed services. The LLM has full control over when to search, create, update, and delete memories. Set `REDIS_MEMORY_BACKEND` to switch this example to `redis-agent-memory`.

[View on GitHub](https://github.com/redis-developer/adk-redis/tree/main/examples/travel_agent_memory_tools)

## `fitness_coach_mcp`

**Backend:** `opensource-agent-memory` (Agent Memory Server) only &middot; **Run:** `adk web .`

Demonstrates MCP-based memory integration. The agent connects to the Agent Memory Server's SSE endpoint with ADK's native `McpToolset` and manages semantic and episodic memories for workout tracking. `redis-agent-memory` has no MCP endpoint, so this example runs on Agent Memory Server only.

[View on GitHub](https://github.com/redis-developer/adk-redis/tree/main/examples/fitness_coach_mcp)

## `redis_search_tools`

**Capability:** Vector, text, and range search &middot; **Run:** `adk web .`

Three in-process RedisVL [search tools]({{< relref "/integrate/google-adk/search-tools" >}}) plugged into a single agent with a product catalog dataset.

[View on GitHub](https://github.com/redis-developer/adk-redis/tree/main/examples/redis_search_tools)

## `redis_sql_search`

**Capability:** SQL `SELECT` search &middot; **Run:** `adk web .`

A 10-product catalog with the `RedisSQLSearchTool`. The agent emits parameterized SQL (`WHERE category = 'electronics' AND price < :max_price`) to answer structured catalog questions. Requires `pip install 'adk-redis[sql]'`.

[View on GitHub](https://github.com/redis-developer/adk-redis/tree/main/examples/redis_sql_search)

## `redisvl_mcp_search`

**Capability:** RedisVL MCP server via ADK's `McpToolset` &middot; **Run:** `adk web .`

The MCP counterpart of `redis_search_tools`. A `rvl mcp` server hosts a knowledge-base index in hybrid (vector + BM25) mode and the agent connects via ADK's native `McpToolset`. No adk-redis wrapper involved; the standard `McpToolset` + `StdioConnectionParams` pattern is used.

[View on GitHub](https://github.com/redis-developer/adk-redis/tree/main/examples/redisvl_mcp_search)

## `semantic_cache`

**Capability:** Local semantic caching (RedisVL) &middot; **Run:** `python main.py`

Demonstrates LLM response caching and tool result caching using the `RedisVLCacheProvider` with local embeddings and ADK callbacks.

[View on GitHub](https://github.com/redis-developer/adk-redis/tree/main/examples/semantic_cache)

## `langcache_cache`

**Capability:** Managed semantic caching (LangCache) &middot; **Run:** `python main.py`

Uses the managed [LangCache]({{< relref "/integrate/google-adk/semantic-caching" >}}) service for semantic caching with server-side embeddings. No local vectorizer required.

[View on GitHub](https://github.com/redis-developer/adk-redis/tree/main/examples/langcache_cache)

## Running an example

Examples marked `python main.py` run as scripts. Examples marked `adk web .`
run in the ADK developer UI from inside the example directory.

```bash
pip install adk-redis[all]
cd examples/managed_memory_quickstart
export GOOGLE_API_KEY=your-key
python main.py
```

## More info

- [Car dealership tutorial](https://redis.io/tutorials/build-a-car-dealership-agent-with-google-adk-and-redis-agent-memory/): Full walkthrough building an agent from scratch
- [adk-redis README](https://github.com/redis-developer/adk-redis): Installation and overview
