---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Serve personalised recommendations under tight latency budgets by combining vector similarity with structured filters in a single Redis call.
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
    scaling and monitoring surface, another network hop, and a synchronisation layer between item
    metadata in the primary store and embeddings in the vector store. Most are also optimised for
    batch-loaded read-heavy workloads, not sub-millisecond writes interleaved with reads when
    session signals need to update user features mid-request.
-   **Pre-computing recommendations offline** removes the serving-time cost but cannot react to
    in-session behaviour — the user clicks something, and the next request still ranks against the
    yesterday's offline batch.

A workable serving layer needs vector KNN, structured pre-filters, and atomic per-user feature updates, all on the request path, all in one round trip.

## What you can expect from a Redis solution

You can:

-   Return personalised recommendations with P99 latency under 10 ms for the retrieval stage at
    peak concurrency.
-   Combine embedding similarity with TAG, NUMERIC, and TEXT pre-filters in a single
    [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) call, with no cross-store joins.
-   Incorporate real-time session signals (clicks, dwell time, cart adds) into the *next*
    recommendation without waiting for a batch pipeline — a session vector written with
    [`HSET`]({{< relref "/commands/hset" >}}) is visible to the very next
    [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}).
-   Refresh item embeddings from the offline training pipeline without serving downtime, by
    dual-writing under a new field or swapping a key alias.
-   Co-locate item embeddings, item metadata, user features, and short-term interaction state in
    one serving layer, eliminating cross-store hops on the request path.
-   Run the recommendation index on the same Redis instance already in the stack handling cache,
    sessions, or rate limiting — no additional infrastructure.

## How Redis supports the solution

In practice, each item is a single [Hash]({{< relref "/develop/data-types/hashes" >}}) or
[JSON]({{< relref "/develop/data-types/json" >}}) document holding both its embedding vector and
its structured metadata — category, brand, price, in-stock flag, popularity score. A single
[Redis Search]({{< relref "/develop/ai/search-and-query" >}}) index covers the vector field and
every filter field, so one [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) call can do KNN
retrieval over millions of items with a TAG, NUMERIC, or TEXT pre-filter applied in the same
pass. Per-user features live in a separate hash that the application can update atomically with
[`HSET`]({{< relref "/commands/hset" >}}); those updates are immediately visible to the next
retrieval, so session signals feed scoring without any batch cycle.

Redis provides the following features that make it a good fit for a recommendation serving layer:

-   [Hashes]({{< relref "/develop/data-types/hashes" >}}) and
    [JSON]({{< relref "/develop/data-types/json" >}}) store each item's embedding and structured
    metadata in a single record, so retrieval reads everything the scorer needs in one round trip.
-   [Redis Search]({{< relref "/develop/ai/search-and-query" >}}) with
    [HNSW vector indexes]({{< relref "/develop/ai/search-and-query/vectors" >}}) performs
    approximate KNN over the embedding field at HNSW speeds, and the same
    [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) call applies TAG / NUMERIC / TEXT filters
    to constrain the candidate set in one pass.
-   [`HSET`]({{< relref "/commands/hset" >}}) updates to user feature hashes are atomic and
    immediately visible to the next search, so session signals feed re-ranking without a batch
    cycle or cache invalidation.
-   [`FT.ALTER`]({{< relref "/commands/ft.alter" >}}) and dual-field write patterns let you swap in
    a new embedding model — or re-train an existing one — without taking the serving index offline.
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

* [redis-py (Python)]({{< relref "/develop/use-cases/recommendation-engine/redis-py" >}})
