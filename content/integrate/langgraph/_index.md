---
LinkTitle: LangGraph
Title: Redis with LangGraph
alwaysopen: false
categories:
- docs
- integrate
- oss
- rs
- rc
description: Persist LangGraph agent state, long-term memory, and cached model calls in Redis.
group: ai
stack: true
summary: Use the langgraph-checkpoint-redis package to store LangGraph checkpoints and memories in Redis, and to cache LLM responses.
type: integration
weight: 30
---

[LangGraph](https://docs.langchain.com/oss/python/langgraph/overview) is a Python framework for building stateful AI agents as graphs. The [`langgraph-checkpoint-redis`](https://github.com/redis-developer/langgraph-redis) package stores that state in Redis. It has three parts:

| Part | Use it to |
|------|-----------|
| **Checkpointers** | Save graph state after every step, so a thread can resume, replay, or recover from a failure. |
| **Stores** | Keep long-term memories that are shared across threads, with optional vector search. |
| **Middleware** | Cache model responses by semantic similarity, cache tool results, and recall past messages for a LangChain agent. |

The package runs on your own Redis database. To use a managed memory service instead, see [Redis Agent Memory](/content/develop/ai/context-engine/agent-memory/_index.md), which has its own [LangGraph integration](/content/develop/ai/context-engine/agent-memory/developer-guide.md).

## Requirements

- Python 3.10 to 3.14
- Redis with [JSON](/content/develop/data-types/json/_index.md) and the [Redis Query Engine](/content/develop/ai/search-and-query/_index.md). Redis 8 and later includes both. Earlier versions need Redis Stack.

Install the package:

```bash
pip install langgraph-checkpoint-redis
```

## Save graph state with a checkpointer

Create a `RedisSaver`, call `setup()` once to create its indexes, and pass it to `compile()`:

```python
from typing import TypedDict

from langgraph.graph import END, START, StateGraph
from langgraph.checkpoint.redis import RedisSaver


class State(TypedDict):
    count: int


def increment(state: State):
    return {"count": state["count"] + 1}


builder = StateGraph(State)
builder.add_node("increment", increment)
builder.add_edge(START, "increment")
builder.add_edge("increment", END)

with RedisSaver.from_conn_string("redis://localhost:6379") as checkpointer:
    checkpointer.setup()
    graph = builder.compile(checkpointer=checkpointer)

    config = {"configurable": {"thread_id": "thread-1"}}
    graph.invoke({"count": 0}, config)
    print(graph.get_state(config).values)
```

Each `thread_id` has its own saved state. A new `RedisSaver` that connects to the same database reads it back, so a thread survives a restart of your application.

For async applications, use `AsyncRedisSaver` and `await checkpointer.asetup()`:

```python
from langgraph.checkpoint.redis.aio import AsyncRedisSaver

async with AsyncRedisSaver.from_conn_string("redis://localhost:6379") as checkpointer:
    await checkpointer.asetup()
    graph = builder.compile(checkpointer=checkpointer)
    await graph.ainvoke({"count": 0}, config)
```

`ShallowRedisSaver` and its async counterpart keep only the latest checkpoint for each thread. Use them when you don't need history or replay. They are in `langgraph.checkpoint.redis.shallow` and `langgraph.checkpoint.redis.ashallow`.

### Expire old checkpoints

Pass `ttl` to remove checkpoints automatically:

```python
ttl = {"default_ttl": 60, "refresh_on_read": True}

with RedisSaver.from_conn_string("redis://localhost:6379", ttl=ttl) as checkpointer:
    checkpointer.setup()
```

`default_ttl` is the time to live (TTL) in **minutes**, not seconds. With `refresh_on_read`, reading a checkpoint resets its TTL. Without `ttl`, checkpoints stay until you delete them.

## Keep long-term memories in a store

A checkpointer is scoped to one thread. A store holds data that any thread can read, such as a user's preferences. Namespaces organize the data:

```python
from langgraph.store.redis import RedisStore

with RedisStore.from_conn_string("redis://localhost:6379") as store:
    store.setup()
    store.put(("users", "user-1", "memories"), "m1", {"text": "likes green tea"})

    item = store.get(("users", "user-1", "memories"), "m1")
    print(item.value)
```

`AsyncRedisStore` in `langgraph.store.redis.aio` has the same methods with an `a` prefix, such as `aput` and `aget`.

To search memories by meaning, pass an `index` configuration with an embeddings model. This example uses OpenAI embeddings. Any LangChain `Embeddings` object works if `dims` matches the model's output size:

```python
from langchain_openai import OpenAIEmbeddings

index = {
    "dims": 1536,
    "distance_type": "cosine",
    "fields": ["text"],
    "embed": OpenAIEmbeddings(model="text-embedding-3-small"),
}

with RedisStore.from_conn_string("redis://localhost:6379", index=index) as store:
    store.setup()
    store.put(("users", "user-1", "memories"), "m1", {"text": "likes green tea"})

    results = store.search(("users", "user-1", "memories"), query="favorite drink", limit=3)
```

Stores accept the same `ttl` setting as checkpointers.

## Cache model calls with middleware

The middleware plugs into LangChain's `create_agent()`. It needs the `langchain` package, which `langgraph-checkpoint-redis` doesn't install for you:

```bash
pip install langchain
```

`SemanticCacheMiddleware` returns a stored response when a new prompt is close enough in meaning to an earlier one. A lower `distance_threshold` makes matches stricter. Pass a `vectorizer` that wraps your embeddings model:

```python
from langchain.agents import create_agent
from langchain_core.messages import HumanMessage
from langchain_openai import OpenAIEmbeddings
from langgraph.middleware.redis import (
    LangChainVectorizer,
    SemanticCacheConfig,
    SemanticCacheMiddleware,
)

vectorizer = LangChainVectorizer(
    embeddings=OpenAIEmbeddings(model="text-embedding-3-small"),
    dims=1536,
)

semantic_cache = SemanticCacheMiddleware(
    SemanticCacheConfig(
        redis_url="redis://localhost:6379",
        name="llm_cache",
        distance_threshold=0.15,
        ttl_seconds=3600,
        vectorizer=vectorizer,
    )
)

agent = create_agent(
    model="openai:gpt-4o-mini",
    tools=[],
    middleware=[semantic_cache],
)

result = await agent.ainvoke({"messages": [HumanMessage(content="What is Redis?")]})
```

The middleware is async-first, so call `ainvoke()`. By default it caches only final responses, not responses that request a tool call, and it skips the cache when a prompt includes results from tools you haven't listed in `deterministic_tools`.

The package also provides `ToolResultCacheMiddleware` for caching tool results, `ConversationMemoryMiddleware` for recalling relevant earlier messages, and `SemanticRouterMiddleware`. For their options, see the [package README](https://github.com/redis-developer/langgraph-redis#redis-middleware) and the [middleware example notebooks](https://github.com/redis-developer/langgraph-redis/tree/main/examples/middleware).

## Upgrade between versions

Checkpoints written by 0.1.x can't be read by 0.2.0 and later. `get_state()` returns nothing for them. To move to a newer version, start fresh, run the old and new versions side by side until old threads finish, or write a migration script. See the [0.2.0 migration guide](https://github.com/redis-developer/langgraph-redis/blob/main/MIGRATION_0.2.0.md).

## More info

- [langgraph-redis on GitHub](https://github.com/redis-developer/langgraph-redis), including [example notebooks](https://github.com/redis-developer/langgraph-redis/tree/main/examples)
- [langgraph-checkpoint-redis on PyPI](https://pypi.org/project/langgraph-checkpoint-redis/)
- [LangGraph Redis checkpoint 0.1.0 announcement](https://redis.io/blog/langgraph-redis-checkpoint-010/), which covers the storage redesign and benchmarks
- [Redis with LangChain](/content/integrate/langchain-redis/_index.md)
- [Redis Agent Memory](/content/develop/ai/context-engine/agent-memory/_index.md)
