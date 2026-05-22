---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Build a Redis-backed semantic cache for LLM responses in Python with redis-py and sentence-transformers
linkTitle: redis-py example (Python)
title: Redis semantic cache with redis-py
weight: 1
---

This guide shows you how to build a small Redis-backed semantic cache for LLM responses in Python with [`redis-py`]({{< relref "/develop/clients/redis-py" >}}) and the [`sentence-transformers`](https://www.sbert.net/) library. It includes a local web server built with the Python standard library so you can send paraphrased prompts at a mock LLM, watch the cache decide hit or miss, sweep the cosine-distance threshold, and see the cumulative latency and token savings build up.

## Overview

Each cache entry is stored as a single Redis [Hash]({{< relref "/develop/data-types/hashes" >}}) at `cache:<id>`. The hash holds the original prompt, the LLM's response, the raw `float32` bytes of a 384-dimensional embedding of the prompt, and metadata fields — tenant, locale, model version, safety flag — plus a `created_ts` and a `hit_count`. A single [Redis Search]({{< relref "/develop/ai/search-and-query" >}}) index covers the embedding field and every metadata field, so one [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) call with a `KNN` clause does the vector lookup *and* the TAG pre-filter in the same round trip — no cross-store joins.

The lookup is thresholded: [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) always returns the nearest entry that satisfies the filters, but the application only serves it as a hit when the reported cosine distance is at or below `distance_threshold`. Anything further away is treated as a miss; the caller runs the LLM and writes the new prompt, response, and embedding back to the same key pattern with a TTL.

That gives you:

* A single round trip for lookup — vector KNN + metadata pre-filter in one [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}).
* Tens of milliseconds on a hit vs. a multi-second LLM call on a miss; the embedding step is the bottleneck either way, and that's a model-side cost, not a Redis one.
* Tenant, locale, and model-version isolation enforced inside the query, not in application code — a write under one tenant cannot be served to another.
* Bounded memory: every entry has an [`EXPIRE`]({{< relref "/commands/expire" >}}) TTL, and a database-level [eviction policy]({{< relref "/develop/reference/eviction" >}}) (LRU / LFU) caps the cache size under pressure.

## How it works

A query goes through three stages: **embed**, **lookup**, and (on a miss) **call the LLM and write back**.

### Hit path (the goal)

1. The application calls `embedder.encode_one(prompt)` to turn the incoming text into a 384-dimensional `float32` vector.
2. `cache.lookup(query_vec, tenant=..., locale=..., model_version=...)` runs [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) with a TAG pre-filter and a `KNN 1` clause. Redis returns the closest cached prompt that satisfies the filters along with its cosine distance.
3. If the distance is at or below the threshold, the cache returns a `CacheHit` containing the cached response. The helper also pipelines an [`HINCRBY`]({{< relref "/commands/hincrby" >}}) on `hit_count` and an [`EXPIRE`]({{< relref "/commands/expire" >}}) refresh, so a frequently used answer keeps its TTL and the demo UI can see which entries are load-bearing.
4. The LLM is not called at all. The application returns the cached response to the user.

### Miss path

When the distance is above the threshold — or there is no candidate in scope at all — the helper returns a `CacheMiss` instead, carrying the distance of the nearest candidate (if any) for logging. The application then:

1. Calls the LLM with the prompt.
2. Calls `cache.put(prompt, response, embedding, tenant=..., locale=..., model_version=...)`. The same embedding the lookup used is reused — no re-encode. The helper writes the Hash with [`HSET`]({{< relref "/commands/hset" >}}) and an [`EXPIRE`]({{< relref "/commands/expire" >}}) TTL in a pipeline.
3. Returns the LLM's response to the user. The next semantically similar prompt under the same metadata scope will be a hit.

## The cache helper

The `RedisSemanticCache` class wraps the Redis Search index and the lookup / write flow
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/semantic-cache/redis-py/cache.py)):

```python
import redis
from cache import RedisSemanticCache, CacheHit, CacheMiss
from embeddings import LocalEmbedder

# Use decode_responses=False because the embedding field is raw bytes;
# the helper decodes text fields explicitly where it needs them.
r = redis.Redis(host="localhost", port=6379, decode_responses=False)
cache = RedisSemanticCache(
    redis_client=r,
    index_name="semcache:idx",
    distance_threshold=0.5,    # cosine distance, lower = stricter
    default_ttl_seconds=3600,  # one hour
)
embedder = LocalEmbedder()  # sentence-transformers/all-MiniLM-L6-v2

# One-time index setup (idempotent).
cache.create_index()

# 1) Embed the prompt.
prompt = "How do I return an item?"
query_vec = embedder.encode_one(prompt)

# 2) Look up under a metadata scope. The TAG filter and the KNN
#    travel together in one FT.SEARCH.
result = cache.lookup(
    query_vec,
    tenant="acme",
    locale="en",
    model_version="gpt-4.5-2026",
)

if isinstance(result, CacheHit):
    response = result.response
    print(f"hit ({result.distance:.3f}): {response}")
else:
    # 3a) Miss — call the LLM. (Use your real client here.)
    response = call_llm(prompt)

    # 3b) Cache the new entry. Reuses the same embedding bytes the
    #     lookup used, so we don't pay the encoder twice.
    cache.put(
        prompt=prompt,
        response=response,
        embedding=query_vec,
        tenant="acme",
        locale="en",
        model_version="gpt-4.5-2026",
    )
```

### Data model

Each cache entry is one Redis Hash. The vector field is raw little-endian `float32` bytes — no JSON wrapping — because the Redis Search vector encoding expects exactly that.

```text
cache:7c3f8a1b9e02
  prompt=How do I return an item?
  response=You can return any unworn item within 30 days...
  tenant=acme
  locale=en
  model_version=gpt-4.5-2026
  safety=ok
  created_ts=1715990400.123
  hit_count=4
  embedding=<384 × float32 little-endian bytes>
```

The Redis Search index schema treats every field as queryable in its natural type:

```text
FT.CREATE semcache:idx
  ON HASH PREFIX 1 cache:
  SCHEMA
    prompt         TEXT
    response       TEXT
    tenant         TAG
    locale         TAG
    model_version  TAG
    safety         TAG
    created_ts     NUMERIC SORTABLE
    hit_count      NUMERIC SORTABLE
    embedding      VECTOR HNSW 6 TYPE FLOAT32 DIM 384 DISTANCE_METRIC COSINE
```

The `prompt` and `response` TEXT fields aren't used by the cache lookup itself — that's vector-only — but they make it possible to grep the cache by content from `redis-cli` for debugging or admin tooling.

### The query

The lookup is a hybrid query: a TAG pre-filter expression in parentheses, then `=>[KNN 1 @embedding $vec]`. With `DIALECT 2`, Redis applies the filter first and KNN-ranks only the matching documents.

```text
FT.SEARCH semcache:idx
  "(@tenant:{acme} @locale:{en} @model_version:{gpt\-4\.5\-2026} @safety:{ok})
     =>[KNN 1 @embedding $vec AS distance]"
  PARAMS 2 vec <384-float32-bytes>
  SORTBY distance
  RETURN 7 prompt response tenant locale model_version hit_count distance
  DIALECT 2
```

`distance` is the cosine *distance* (0 means identical, 2 means opposite). The result is sorted ascending, so the top row is the closest candidate. The application inspects `distance` against the threshold and decides hit or miss in user code — Redis returns the row either way, and treating it as a hit or a miss is a policy decision the cache helper owns, not a server-side filter.

## The mock LLM

To make the latency and token savings visible without requiring an API key, `mock_llm.py` provides a deterministic stand-in
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/semantic-cache/redis-py/mock_llm.py)):

```python
from mock_llm import MockLLM

llm = MockLLM(latency_ms=1500.0)  # one and a half seconds per call
response = llm.complete("What is your return policy?")
# response.response       — the templated answer text
# response.latency_ms     — wall-clock time the call took
# response.total_tokens   — estimated prompt + completion tokens
```

The mock sleeps for the configured latency, then keyword-matches against a small FAQ table to produce an answer. The deliberate slowness is what makes a hit visibly cheaper than a miss in the demo. In production code, you would replace `MockLLM` with your real client of choice — OpenAI, Anthropic, Bedrock, vLLM, Ollama, anything — without changing the cache helper.

## Pre-seeding the cache

In a real deployment the cache fills up organically: a first-time question is a miss, the LLM answers, and the response is written back. For the demo, `seed_cache.py` pre-loads a small set of canonical FAQ prompts so the very first query lands on a hit
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/semantic-cache/redis-py/seed_cache.py)):

```python
from seed_cache import seed
from cache import RedisSemanticCache
from embeddings import LocalEmbedder

cache = RedisSemanticCache()
embedder = LocalEmbedder()
cache.create_index()
seed(cache, embedder, tenant="acme", locale="en")
```

The seed list stores the canonical phrasing of each question ("What is your return policy?"). Paraphrases of any of these prompts ("How do I return an item?", "Can I get a refund?") embed close to the canonical entry, so the cache lookup serves the stored response without ever calling the model.

## The interactive demo

`demo_server.py` runs a ThreadingHTTPServer. The HTML page lets you:

* Type a prompt and toggle metadata: tenant, locale, model version. Each combination is a separate cache namespace inside the same index.
* Slide the cosine-distance threshold and see hits flip to misses (and back) on the same prompt, with the actual distance reported on each query.
* Submit with **Ask** to run the full hit-or-miss path (calls the LLM on a miss, writes the answer back). Submit with **Lookup only (no LLM)** to sweep the threshold against a fixed prompt without polluting the cache.
* Watch the cumulative panel build up: total queries, cache hits, cache misses, hit ratio, tokens not spent, LLM seconds not waited.
* Inspect every cached entry, including remaining TTL and total hit count, and drop individual entries to simulate eviction.

The server holds one `LocalEmbedder`, one `RedisSemanticCache`, and one `MockLLM` for the lifetime of the process. Endpoints:

| Endpoint        | What it does                                                                  |
|-----------------|-------------------------------------------------------------------------------|
| `GET  /state`   | Index info and the full list of cached entries.                               |
| `POST /query`   | Embed the prompt, run `FT.SEARCH`, on miss call the LLM and write back.       |
| `POST /reset`   | Drop every cached entry and re-seed from the FAQ list.                        |
| `POST /drop`    | Delete a single cached entry by id.                                           |

## Run the demo locally

1.  Clone the [`redis/docs`](https://github.com/redis/docs) repository and change into the example
    directory:

    ```bash
    git clone https://github.com/redis/docs.git
    cd docs/content/develop/use-cases/semantic-cache/redis-py
    ```

2.  Install the dependencies:

    ```bash
    pip install redis sentence-transformers numpy
    ```

3.  Make sure a Redis instance with the Redis Search module is running locally on
    port 6379. [Redis Stack]({{< relref "/operate/oss_and_stack/install/install-stack" >}}) or
    [Redis 8 with Search]({{< relref "/develop/ai/search-and-query" >}}) both work.

4.  Start the demo server. The first run downloads the `all-MiniLM-L6-v2` model
    (~80 MB) into the local Hugging Face cache:

    ```bash
    python demo_server.py
    ```

5.  Open <http://localhost:8085> and try some queries:

    * **"What is your return policy?"** — exact match against the seed, distance ≈ 0,
      hit at any threshold.
    * **"How fast is delivery?"** — paraphrase of the shipping seed; distance
      around 0.30, hit at the default threshold of 0.5.
    * **"How do I return an item?"** — slightly looser paraphrase of the returns
      seed; distance around 0.49, still a hit at the default threshold. Slide
      the threshold down to 0.4 to see this one flip to a miss.
    * **"What payment methods do you accept?"** — unrelated to anything in the
      seed; distance > 0.8, so you'll see a miss, the mock LLM kicks in for
      ~1.5 s, the new answer is cached, and a follow-up of the same question
      is now an immediate hit.
    * Switch the **Tenant** dropdown to `globex` or `initech` and re-ask any
      seeded question — the result flips to a miss because the cache entries
      live under `acme`. That's the metadata pre-filter at work inside `FT.SEARCH`.

    `all-MiniLM-L6-v2` puts FAQ-style paraphrases in the 0.3–0.5 cosine-distance
    range and unrelated queries above 0.8, which is what motivates the 0.5
    default. A stricter embedding model (or a domain-tuned one) would let you
    drop the threshold further; a noisier one would push it up. The right
    threshold is always a function of the model, the corpus, and how
    conservative the application needs to be about reuse.

The server is read/write against your local Redis. The default index name is `semcache:idx` and entry keys live under `cache:`. Pass `--no-reset` to keep an existing cache across restarts, `--threshold` to change the default cosine-distance cutoff, or `--llm-latency-ms` to make the mock LLM faster or slower for the demo.
