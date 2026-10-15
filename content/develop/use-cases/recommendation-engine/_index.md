---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Serve personalized recommendations under tight latency budgets by combining vector similarity with structured filters in a single Redis call.
hideListLinks: true
linkTitle: Recommendation engine
title: Redis recommendation engine
weight: 6
---

## When to use Redis as a recommendation engine

Use Redis as the serving layer for a recommendation engine when you need to combine embedding similarity with structured attribute filters under a tight latency budget — typically a multi-stage pipeline of candidate retrieval, scoring, and re-ranking that has to return in tens of milliseconds, while incorporating real-time session signals that can't wait for a batch cycle.

## Why the problem is hard

Recommendation pipelines have to produce a ranked list in roughly 200 ms end to end, and the serving phase needs simultaneous access to item embeddings, item metadata, user features, and recent interaction history. Some of the obvious workarounds have real drawbacks:

-   **A relational database** can store the embeddings, metadata, and user features, but it cannot
    perform sub-millisecond approximate nearest-neighbour search at serving-time concurrency. KNN
    over millions of vectors is not what a row store is built for.
-   **A dedicated vector database** handles KNN with metadata filtering, but adds a separate
    scaling and monitoring surface, another network hop, and a synchronization layer between item
    metadata in the primary store and embeddings in the vector store. Most are also optimized for
    batch-loaded read-heavy workloads, not sub-millisecond writes interleaved with reads when
    session signals need to update user features mid-request.
-   **Pre-computing recommendations offline** removes the serving-time cost but cannot react to
    in-session behavior — the user clicks something, and the next request still ranks against the
    yesterday's offline batch.

A workable serving layer needs vector KNN, structured pre-filters, and per-user feature updates that take effect within the request path — without standing up a separate vector store and synchronizing it with the primary.

## What you can expect from a Redis solution

You can:

-   Return personalized recommendations with P99 latency under 10 ms for the retrieval stage at
    peak concurrency.
-   Combine embedding similarity with TAG, NUMERIC, and TEXT pre-filters in a single
    [`FT.SEARCH`](/content/commands/ft.search.md) call, with no cross-store joins.
-   Incorporate real-time session signals (clicks, dwell time, cart adds) into the *next*
    recommendation without waiting for a batch pipeline — a session vector written with
    [`HSET`](/content/commands/hset.md) is visible to the very next read of the user
    features hash, which the application passes through to
    [`FT.SEARCH`](/content/commands/ft.search.md) as the query vector.
-   Refresh item embeddings from the offline training pipeline without serving downtime by
    overwriting the vector field with [`HSET`](/content/commands/hset.md); the HNSW index
    reflects the new vector on the next query. For schema changes (different dimensionality or
    model), the same playbook scales out to a dual-field write followed by
    [`FT.ALTER`](/content/commands/ft.alter.md) or a swap of the indexed key prefix.
-   Co-locate item embeddings, item metadata, user features, and short-term interaction state in
    one serving layer, eliminating cross-store hops on the request path.
-   Run the recommendation index on the same Redis instance already in the stack handling cache,
    sessions, or rate limiting — no additional infrastructure.

## How Redis supports the solution

In practice, each item is a single [Hash](/content/develop/data-types/hashes.md) or
[JSON](/content/develop/data-types/json/_index.md) document holding both its embedding vector and
its structured metadata — category, brand, price, in-stock flag, popularity score. A single
[Redis Search](/content/develop/ai/search-and-query/_index.md) index covers the vector field and
every filter field, so one [`FT.SEARCH`](/content/commands/ft.search.md) call can do KNN
retrieval over millions of items with a TAG, NUMERIC, or TEXT pre-filter applied in the same
pass. Per-user features live in a separate hash that the application updates atomically with
[`HSET`](/content/commands/hset.md) and
[`HINCRBYFLOAT`](/content/commands/hincrbyfloat.md); the next time the application reads
that hash to build a query, it sees the click, so session signals feed scoring without any batch
cycle.

Redis provides the following features that make it a good fit for a recommendation serving layer:

-   [Hashes](/content/develop/data-types/hashes.md) and
    [JSON](/content/develop/data-types/json/_index.md) store each item's embedding and structured
    metadata in a single record, so retrieval reads everything the scorer needs in one round trip.
-   [Redis Search](/content/develop/ai/search-and-query/_index.md) with
    [HNSW vector indexes](/content/develop/ai/search-and-query/vectors/_index.md) performs
    approximate KNN over the embedding field at HNSW speeds, and the same
    [`FT.SEARCH`](/content/commands/ft.search.md) call applies TAG / NUMERIC / TEXT filters
    to constrain the candidate set in one pass.
-   [`FT.HYBRID`](/content/commands/ft.hybrid.md) (Redis 8.4+) combines text and vector
    similarity into a single ranked result via Reciprocal Rank Fusion or linear combination, for
    queries where lexical match should contribute to the score, not just gate the candidate set.
-   [`HSET`](/content/commands/hset.md) and
    [`HINCRBYFLOAT`](/content/commands/hincrbyfloat.md) updates to user feature hashes are
    atomic, so the next time the application reads that hash to build a query it sees the click
    — session signals feed scoring without any batch cycle or cache invalidation.
-   Overwriting the vector field with [`HSET`](/content/commands/hset.md) re-trains the
    HNSW entry in place; for embedding-model changes,
    [`FT.ALTER`](/content/commands/ft.alter.md) and dual-field write patterns let you swap
    in a new model without taking the serving index offline.
-   Sub-millisecond reads and writes from memory let the recommendation index ride on the same
    Redis instance already handling cache, sessions, or rate limiting at zero marginal cost.

## Ecosystem

The following libraries and frameworks build on Redis Search for recommendation workloads:

-   **Python**: [RedisVL](https://github.com/redis/redis-vl-python) for a high-level vector-search
    client, and the
    [LangChain Redis integration](https://python.langchain.com/docs/integrations/vectorstores/redis/)
    for embedding-driven retrieval chains.
-   **Node.js**: [`redis-om-node`](https://github.com/redis/redis-om-node) for object-mapped
    Hash/JSON documents and Redis Search queries.
-   **Go**: [`go-redis`](https://github.com/redis/go-redis) with first-class Redis Search support
    for FT.SEARCH KNN and structured filters.
-   **ML platforms**: [NVIDIA Merlin](https://github.com/NVIDIA-Merlin) for an online feature store
    and retrieval layer that uses Redis as the serving substrate.

## Code examples to build your own Redis recommendation engine

The following guides show how to build a small Redis-backed product recommendation service. Each guide includes a runnable interactive demo that lets you embed a query, retrieve candidates with KNN, filter by category and price, feed clicks back as a session signal, and watch the next recommendation incorporate them immediately.

* [redis-py (Python)](/content/develop/use-cases/recommendation-engine/redis-py/_index.md)
* [node-redis (Node.js)](/content/develop/use-cases/recommendation-engine/nodejs/_index.md)
* [go-redis (Go)](/content/develop/use-cases/recommendation-engine/go/_index.md)
* [redis-rs (Rust)](/content/develop/use-cases/recommendation-engine/rust/_index.md)
* [NRedisStack (C#)](/content/develop/use-cases/recommendation-engine/dotnet/_index.md)
* [Jedis (Java)](/content/develop/use-cases/recommendation-engine/java-jedis/_index.md)
* [Lettuce (Java)](/content/develop/use-cases/recommendation-engine/java-lettuce/_index.md)
* [Predis (PHP)](/content/develop/use-cases/recommendation-engine/php/_index.md)
* [redis-rb (Ruby)](/content/develop/use-cases/recommendation-engine/ruby/_index.md)
