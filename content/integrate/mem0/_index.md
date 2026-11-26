---
LinkTitle: Mem0
Title: Redis with Mem0
alwaysopen: false
categories:
- docs
- integrate
- oss
- rs
- rc
description: Use Redis as the vector store for Mem0 agent memory.
group: ai
stack: true
summary: Configure the open source Mem0 library to keep its extracted memories in Redis and search them by meaning.
type: integration
weight: 30
---

[Mem0](https://docs.mem0.ai/) is a memory layer for AI applications. When you give it a conversation, it uses a large language model (LLM) to extract the facts worth remembering, such as "likes sci-fi movies and dislikes thrillers", and stores them for a user, an agent, or a run. Later, you search those memories by meaning and add the results to a prompt.

The open source Mem0 library can use Redis as its vector store. Redis holds each memory, its embedding, and the fields that Mem0 filters on. This page covers the Python library. It doesn't cover the hosted Mem0 Platform.

See the [memory layer](/content/develop/use-cases/memory-layer/_index.md) use case for more information
about when to use this pattern.

## Requirements

- Python 3.10 or later
- Redis with [Redis Search](/content/develop/ai/search-and-query/_index.md) (Redis 8 and later versions include it but earlier versions need Redis Stack).
- An LLM and an embedding model. By default, Mem0 uses OpenAI, so set `OPENAI_API_KEY`, or configure other providers as explained in the [Mem0 documentation](https://docs.mem0.ai/).

Install Mem0 with its `vector-stores` extra:

```bash
pip install 'mem0ai[vector-stores]'
```

The examples on this page were run with Mem0 2.2.1 and Redis 8.10. A small test server stood in for the LLM and embedding provider.

## Store memories in Redis

Set `vector_store.provider` to `redis`:

```python
import os
from mem0 import Memory

os.environ["OPENAI_API_KEY"] = "<your-openai-api-key>"

config = {
    "vector_store": {
        "provider": "redis",
        "config": {
            "collection_name": "mem0",
            "embedding_model_dims": 1536,
            "redis_url": "redis://localhost:6379",
        },
    },
}

memory = Memory.from_config(config)
```

| Setting | Default | Notes |
|---------|---------|-------|
| `collection_name` | `mem0` | The name of the Redis index. It is also part of each key. |
| `embedding_model_dims` | `1536` | The vector size of your embedding model. |
| `redis_url` | none | The Redis connection URL. It is the only connection setting, so put the username, password, and TLS in the URL, for example `rediss://<user>:<password>@<host>:6379`. |

`embedding_model_dims` must match your embedding model. The default of 1536 fits OpenAI `text-embedding-3-small` and `text-embedding-ada-002`. If the sizes differ, `memory.add()` still succeeds, but Redis can't index the memory. The index reports `hash_indexing_failures` and the memory never appears in a search.

## Add and search memories

Pass a conversation to `add()` with an identifier for the user. Mem0 asks the LLM for the facts to keep, embeds them, and writes them to Redis:

```python
messages = [
    {"role": "user", "content": "I'm planning a movie night. I'm not a fan of thrillers but I love sci-fi."},
    {"role": "assistant", "content": "Got it. I'll suggest sci-fi movies."},
]

memory.add(messages, user_id="alice", metadata={"category": "movies"})

results = memory.search("What movies does Alice like?", filters={"user_id": "alice"}, limit=3)
for result in results["results"]:
    print(result["memory"], result["score"])
```

Mem0 skips a fact that it has already stored for the user. Adding the same messages twice creates one memory. A search returns the memories most similar to the query, with a `score` of 1 minus the cosine distance, so a higher score is a closer match. The `user_id`, `agent_id`, and `run_id` filters are Redis tag fields, so a search for one user never returns another user's memories.

To store text as it is, without asking the LLM to extract facts, pass `infer=False` to `add()`. Mem0 also has `get_all()`, `update()`, and `delete()`. The memories survive a restart of your application: a new `Memory` object with the same `collection_name` reads the existing ones.

## What Mem0 stores in Redis

Mem0 writes one Redis hash for each memory, with a key of the form `mem0:<collection_name>:<memory id>`. The hash has these fields:

| Field | Index type | Holds |
|-------|------------|-------|
| `memory` | text | The memory text. |
| `embedding` | vector | The embedding. The index is a `FLAT` index with cosine distance. |
| `user_id`, `agent_id`, `run_id`, `memory_id`, `hash` | tag | The owner, the memory identifier, and an MD5 hash that is used to skip duplicates. |
| `metadata` | text | The metadata that you passed to `add()`, as JSON. |
| `created_at`, `updated_at` | numeric | Timestamps in seconds. |

Mem0 also creates a second, empty index named `mem0migrations` in the same database, and it re-creates the index definition each time you create a `Memory` object. The hashes themselves are not touched.

Mem0 doesn't keep the change history in Redis. It writes a SQLite file, `history.db` in `~/.mem0` by default, which holds the data behind `memory.history()`. Set `MEM0_DIR` or `history_db_path` to change the location. Each application instance has its own history file, so the history isn't shared between instances even when they share the Redis memories.

## More information

- [Mem0 Redis vector store](https://docs.mem0.ai/components/vectordbs/dbs/redis)
- [Mem0 open source overview](https://docs.mem0.ai/)
- [RedisVL](/content/develop/ai/redisvl/_index.md), the Redis library that Mem0 uses to create and query the index
- [Redis Agent Memory](/content/develop/ai/context-engine/agent-memory/_index.md), a managed agent memory service from Redis
