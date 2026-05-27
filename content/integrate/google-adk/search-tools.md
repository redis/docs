---
LinkTitle: Search tools
Title: Redis search tools
alwaysopen: false
categories:
- docs
- integrate
- oss
- rs
- rc
description: Vector, hybrid, text, range, and SQL search tools for Google ADK agents, plus the RedisVL MCP server.
group: ai
stack: true
summary: Add retrieval-augmented generation (RAG) to ADK agents using RedisVL-powered
  search tools.
type: integration
weight: 3
---

adk-redis provides five in-process search tools that wrap [RedisVL]({{< relref "/develop/ai/redisvl" >}}) query types into ADK-compatible tools. The LLM sees each tool as a callable function and gets back structured results. For multi-agent or polyglot deployments, the same RedisVL index can also be served over MCP via the `rvl mcp` server and consumed with ADK's native `McpToolset` (see the [RedisVL MCP server](#redisvl-mcp-server) section below).

## Overview

| Tool | Query type | Use case |
|------|-----------|----------|
| `RedisVectorSearchTool` | KNN vector similarity | Conceptual/semantic queries |
| `RedisHybridSearchTool` | Vector + BM25 | Queries with specific terms + concepts |
| `RedisTextSearchTool` | BM25 keyword | Exact terms, error messages, IDs |
| `RedisRangeSearchTool` | Distance threshold | Exhaustive retrieval within a radius |
| `RedisSQLSearchTool` | SQL `SELECT` | Structured filters (`WHERE`, `BETWEEN`, parameterized) |

## Vector search

Embeds the query using a vectorizer and performs K-nearest-neighbor search.

```python
from redisvl.index import SearchIndex
from redisvl.utils.vectorize import HFTextVectorizer
from adk_redis import RedisVectorSearchTool, RedisVectorQueryConfig

vectorizer = HFTextVectorizer(model="redis/langcache-embed-v2")
index = SearchIndex.from_existing("products", redis_url="redis://localhost:6379")

vector_tool = RedisVectorSearchTool(
    index=index,
    vectorizer=vectorizer,
    config=RedisVectorQueryConfig(num_results=5),
    return_fields=["name", "description", "price"],
    name="search_products",
    description="Find products by semantic similarity.",
)
```

## Hybrid search

Combines vector similarity with BM25 keyword matching. Auto-detects whether your Redis server supports native hybrid search (Redis 8.4+ with RedisVL 0.13+). Falls back to client-side aggregation if not.

```python
from adk_redis import RedisHybridSearchTool, RedisHybridQueryConfig

hybrid_tool = RedisHybridSearchTool(
    index=index,
    vectorizer=vectorizer,
    config=RedisHybridQueryConfig(
        text_field_name="content",
        combination_method="LINEAR",
        linear_alpha=0.7,
    ),
    name="search_docs",
    description="Search documents using semantic and keyword matching.",
)
```

## Text search

Pure BM25 keyword search. No embeddings or vectorizer needed.

```python
from adk_redis import RedisTextSearchTool, RedisTextQueryConfig

text_tool = RedisTextSearchTool(
    index=index,
    config=RedisTextQueryConfig(
        text_field_name="content",
        text_scorer="BM25STD",
    ),
    return_fields=["title", "content"],
    name="keyword_search",
    description="Search for exact terms and phrases.",
)
```

## Range search

Returns all documents within a distance threshold instead of top-K. Useful for exhaustive retrieval.

```python
from adk_redis import RedisRangeSearchTool, RedisRangeQueryConfig

range_tool = RedisRangeSearchTool(
    index=index,
    vectorizer=vectorizer,
    config=RedisRangeQueryConfig(distance_threshold=0.5),
    return_fields=["title", "content"],
    name="range_search",
    description="Find all documents within a semantic distance threshold.",
)
```

## SQL search

`RedisSQLSearchTool` wraps `redisvl.query.SQLQuery`. The LLM emits a SQL `SELECT` statement (with optional `:name` parameter placeholders) and the tool translates it into the right `FT.SEARCH` or `FT.AGGREGATE` call. Best for structured filters: tag equality, numeric ranges, multi-predicate `WHERE` clauses. Requires `pip install 'adk-redis[sql]'`.

```python
from adk_redis import RedisSQLSearchTool

sql_tool = RedisSQLSearchTool(
    index=index,
    name="catalog_sql_search",
    description=(
        "Run a SQL SELECT against the product catalog. "
        "Use :name placeholders for values."
    ),
)
```

The LLM might emit a call like:

```sql
SELECT title, brand, price
FROM products
WHERE category = 'electronics' AND price < :max_price
```

with `params={"max_price": 100}`. See the [redis_sql_search example](https://github.com/redis-developer/adk-redis/tree/main/examples/redis_sql_search) for a runnable demo.

## RedisVL MCP server

The five tools above run in-process against a Python `SearchIndex`. To serve one Redis index to multiple agents (Python, JS, Claude Desktop), or to put server-side guardrails like `--read-only` and bearer auth between the agent and the index, run RedisVL's MCP server (`rvl mcp`) and connect ADK's native `McpToolset` to it.

```python
from google.adk import Agent
from google.adk.tools.mcp_tool import McpToolset
from google.adk.tools.mcp_tool.mcp_session_manager import StdioConnectionParams
from mcp import StdioServerParameters

agent = Agent(
    model="gemini-2.5-flash",
    name="redis_mcp_agent",
    instruction="Use the search-records tool to answer questions.",
    tools=[
        McpToolset(
            connection_params=StdioConnectionParams(
                server_params=StdioServerParameters(
                    command="rvl",
                    args=[
                        "mcp",
                        "--config",
                        "/path/to/mcp_config.yaml",
                        "--read-only",
                    ],
                ),
                timeout=30,
            ),
            tool_filter=["search-records"],
        ),
    ],
)
```

The server is configured per index via a YAML file and exposes two tools: `search-records` (vector / fulltext / hybrid, chosen at server start, with schema-aware filter and return-field hints) and `upsert-records` (suppress with `--read-only`). Supports `stdio`, `sse`, and `streamable-http` transports; bearer auth on HTTP.

Install the CLI with `pip install 'redisvl[mcp]>=0.18.2'`. For a runnable demo, see the [redisvl_mcp_search example](https://github.com/redis-developer/adk-redis/tree/main/examples/redisvl_mcp_search).

### When to choose in-process vs MCP

| Path | Use when |
|------|----------|
| In-process tools (above) | Single Python agent, fast onboarding, complex Python-side `FilterExpression` composition. |
| MCP server | Multi-agent or polyglot deployments, server-side ops gates, schema-aware tool descriptions. |

Range and SQL search have no MCP equivalent today; use the in-process tools for either.

## Multi-tool agent

Wire multiple search tools into a single agent and let the LLM choose the right one:

```python
from google.adk import Agent

agent = Agent(
    model="gemini-2.5-flash",
    name="search_agent",
    instruction=(
        "You have three search tools. Use search_products for conceptual "
        "queries, keyword_search for exact terms, range_search for "
        "exhaustive retrieval."
    ),
    tools=[vector_tool, text_tool, range_tool],
)
```

The `name` and `description` on each tool matter: the LLM reads them to decide which tool to call and when. Specific descriptions like "Find products by semantic similarity" work better than generic ones like "search documents".

## More info

- [redis_search_tools example](https://github.com/redis-developer/adk-redis/tree/main/examples/redis_search_tools): vector, text, and range tools with a product catalog
- [redis_sql_search example](https://github.com/redis-developer/adk-redis/tree/main/examples/redis_sql_search): SQL `SELECT` against a bound index
- [redisvl_mcp_search example](https://github.com/redis-developer/adk-redis/tree/main/examples/redisvl_mcp_search): same corpus served via `rvl mcp` + ADK `McpToolset`
- [RedisVL documentation]({{< relref "/develop/ai/redisvl" >}})
