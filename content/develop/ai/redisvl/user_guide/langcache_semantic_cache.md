---
linkTitle: Use langcache as the llm cache backend
title: Use LangCache as the LLM Cache Backend
aliases:
- /integrate/redisvl/user_guide/13_langcache_semantic_cache
weight: 13
---


This guide shows how to use RedisVL's `LangCacheSemanticCache`, a thin wrapper around the [LangCache](https://redis.io/langcache/) managed semantic cache service. You get the same high-level `check` / `store` workflow as `SemanticCache`, backed by LangCache's HTTP API instead of a Redis index you manage yourself.

For more on semantic caching, see [Extensions](../concepts/extensions.md), and to use RedisVL's semantic caching class see our [llm cache notebook](03_llmcache.ipynb). API entries for both classes live in the [LLM cache API](../api/cache.rst).

## Prerequisites

Before you begin, ensure you have:
- Installed RedisVL with the LangCache extra: `pip install redisvl[langcache]`
- Python 3.10+ (same as RedisVL)
- A LangCache service with a **cache ID** and **API key**. You can set up a LangCache service in Redis Cloud [here](https://cloud.redis.io/#/)
- Optionally: **attributes** configured on your LangCache cache if you plan to pass `metadata` / `attributes` from RedisVL

## What You'll Learn

By the end of this guide, you will be able to:
- Choose between `SemanticCache` and `LangCacheSemanticCache` for your deployment
- Initialize `LangCacheSemanticCache` with credentials and TTL defaults
- Implement read-through caching (`check` → LLM → `store`)
- Use LangCache attributes for scoping and deletion
- Override TTL per store, use async APIs, and run delete operations
- Understand current limitations compared to `SemanticCache`


### Choose `SemanticCache` or `LangCacheSemanticCache`

| | `SemanticCache` | `LangCacheSemanticCache` |
|---|------------------|--------------------------|
| **Where data lives** | Your Redis deployment; RedisVL creates and queries a search index | LangCache managed service (hosted API) |
| **Best when** | You control Redis, need full RedisVL query/filter features, or co-locate cache with app data | You want a managed semantic cache without operating Redis or the index |
| **Vector search by raw embedding** | Supported (`vector=` on `check`) | **Not supported** — search is prompt-based via the LangCache API |
| **Filter expressions** | `FilterExpression` on `check` | **Not supported** — use LangCache **attributes** (pre-configured on the cache) |
| **Partial entry updates** | Supported where the backend allows | **`update` / `aupdate` raise** — delete and re-store instead |

**Note:** `SemanticCache` is covered in depth in the [llmcache notebook](03_llmcache.ipynb) guide.


### Install the LangCache extra

The `redisvl[langcache]` extra installs compatible `langcache` dependencies:

```bash
pip install redisvl[langcache]
```



```python
# NBVAL_SKIP
%pip install redisvl[langcache]
```

### Initialize `LangCacheSemanticCache`

Create `LangCacheSemanticCache` with your LangCache credentials. The default `server_url` points at the managed LangCache API; override it if your provider gives a different endpoint.

The following example reads credentials from environment variables (recommended for applications). Replace placeholder values when experimenting locally.



```python
# NBVAL_SKIP
import os

from redisvl.extensions.cache.llm import LangCacheSemanticCache

CACHE_ID = os.environ.get("LANGCACHE_CACHE_ID", "YOUR_CACHE_ID")
API_KEY = os.environ.get("LANGCACHE_API_KEY", "YOUR_API_KEY")

cache = LangCacheSemanticCache(
    name="my_app_cache",
    server_url="https://aws-us-east-1.langcache.redis.io",
    cache_id=CACHE_ID,
    api_key=API_KEY,
    ttl=3600,  # default TTL for entries, in seconds (optional)
)

```

| Parameter | Purpose |
|-----------|---------|
| `cache_id`, `api_key` | Required. Identify your LangCache cache and authenticate. |
| `server_url` | LangCache API base URL (default matches typical managed deployments). |
| `ttl` | Default time-to-live for stored entries, in seconds; can be overridden per `store` call. |
| `use_exact_search` / `use_semantic_search` | Enable exact and/or semantic matching (at least one must be `True`). |
| `distance_threshold` (on `check`) | Works with `distance_scale`: `"normalized"` (0–1 distance) or `"redis"` (cosine-style 0–2). |


### Attributes and metadata

LangCache **attributes** are key/value metadata attached to entries. They can be used when **searching** (`check` / `acheck` via the `attributes` argument) and when **deleting** (`delete_by_attributes` / `adelete_by_attributes`).

**You must define the same attribute names (and types) in the LangCache console or API for your cache before RedisVL can use them.** If you pass `metadata` to `store` or `attributes` to `check` but the cache has no attributes configured, the LangCache API returns an error; RedisVL surfaces a clear `RuntimeError` explaining that attributes need to be configured or removed from the call.

String values are encoded for the API and decoded when reading hits so special characters remain usable.


### Read-through caching pattern

Typical flow: try `check`, call the LLM on a miss, then `store` the result.



```python
# NBVAL_SKIP
def call_your_llm(prompt: str) -> str:
    """Replace with your LLM client (OpenAI, Anthropic, etc.)."""
    return f"Answer for: {prompt}"


def answer(user_prompt: str) -> str:
    hits = cache.check(prompt=user_prompt, num_results=1)
    if hits:
        return hits[0]["response"]

    response = call_your_llm(user_prompt)
    cache.store(prompt=user_prompt, response=response)
    return response

```

Optional scoping with attributes (only if those attributes are configured on LangCache):



```python
# NBVAL_SKIP
user_prompt = "Example prompt"

hits = cache.check(
    prompt=user_prompt,
    attributes={"tenant_id": "acme", "model": "gpt-4o"},
    num_results=1,
)

```

### TTL

- **Constructor** `ttl=` sets the default lifetime for new entries (seconds).
- **Per call**, pass `ttl=` to `store` / `astore` to override the default for that entry.



```python
# NBVAL_SKIP
prompt = "What is Redis?"
response = "Redis is an in memory data store."

cache.store(prompt=prompt, response=response, ttl=300)  # this entry expires in 5 minutes

```

### Async usage
Use the `a`-prefixed methods with `asyncio` — for example `acheck`, `astore`, `adelete`, `adelete_by_id`, `adelete_by_attributes`, `aclear`.



```python
# NBVAL_SKIP
async def call_your_llm_async(prompt: str) -> str:
    return f"Async answer for: {prompt}"


async def answer_async(user_prompt: str) -> str:
    hits = await cache.acheck(prompt=user_prompt, num_results=1)
    if hits:
        return hits[0]["response"]

    response = await call_your_llm_async(user_prompt)
    await cache.astore(prompt=user_prompt, response=response)
    return response

```

### Delete operations

| Method | What it does |
|--------|----------------|
| `delete()` / `adelete()` | **Flush** the entire cache (all entries). Aliases: `clear()` / `aclear()`. |
| `delete_by_id(entry_id)` / `adelete_by_id` | Remove one entry by LangCache entry ID (returned from `store`). |
| `delete_by_attributes` / `adelete_by_attributes` | Remove entries matching the given attribute map (non-empty dict required). |


### Current limitations

The wrapper follows the LangCache API. The following RedisVL features either do not apply or are explicitly unsupported:

- **No direct vector search** — Passing `vector=` to `check` / `acheck` logs a warning and does not search by embedding.
- **No `filter_expression`** — RedisVL filter expressions are not translated; use LangCache attributes only.
- **No `update()` / `aupdate()`** — The LangCache API does not update individual entries; these methods raise `NotImplementedError`. Delete the entry (or store a new pair) instead.
- **`filters` on `store`** — Not supported by LangCache; a warning is logged if provided.

**Tip:** See the **LangCacheSemanticCache** section in the [LLM cache API](../api/cache.rst) for parameter and method listings.

