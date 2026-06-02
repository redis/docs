---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Reuse LLM responses for queries that are semantically similar, not just byte-identical, to cut token costs, reduce latency, and share validated answers across users and sessions.
hideListLinks: true
linkTitle: Semantic cache
title: Redis semantic cache
weight: 7
---

## When to use Redis as a semantic cache

Use Redis as a semantic cache when you need to reuse LLM responses for queries that are semantically similar — not just byte-identical — so paraphrased and near-duplicate questions skip the full embed-retrieve-generate pipeline and return a previously validated answer in tens of milliseconds.

## Why the problem is hard

Every repeated or paraphrased question that reaches an LLM triggers the full pipeline — embedding, retrieval, generation — driving per-query cost up by 10–100x compared to a cache lookup, and pushing P95 latency (the 95th percentile latency) into multi-second territory. Some of the obvious workarounds have real drawbacks:

-   **A traditional exact-match cache** (string key to response) only hits when the query is byte-identical, so it misses near-duplicates like *"What's your return policy?"* versus *"How do I return an item?"* — exactly the queries that dominate FAQ-style workloads.
-   **A standalone vector database** can find similar past queries, but adds operational overhead for what is fundamentally a caching problem, and most lack first-class TTL management, eviction, and metadata filtering — features the cache needs in order to stay correct under churn.
-   **Skipping the cache and relying on prompt caching at the model provider** discounts repeated *prefixes* but still runs the model end-to-end on every call, so it does not address latency or full-response reuse across users.

The core difficulty is threshold tuning: too loose and you serve wrong answers, too tight and the hit rate collapses. Effective semantic caching combines soft similarity matching with hard metadata boundaries (tenant, locale, model version, safety flags) so reuse stays inside well-defined limits.

This pattern is distinct from using Redis for RAG vector search. Semantic caching stores **complete LLM responses**, not document chunks, and the goal is to **skip the LLM entirely** on a hit rather than feed retrieved context into one.

## What you can expect from a Redis solution

You can:

-   Return cached answers for paraphrased and near-duplicate queries in tens of milliseconds instead of multi-second LLM round trips.
-   Reduce LLM token spend on workloads with repeated query patterns — FAQ bots, helpdesks, internal knowledge assistants — by 30% or more without a measurable quality regression.
-   Scope cached answers by tenant, locale, or model version so reuse stays within defined boundaries, applied inside the similarity query rather than in application code.
-   Let stale answers expire automatically and shed cold entries under memory pressure without manual cleanup.
-   Share validated, high-quality answers across users, sessions, and channels while keeping the cache non-authoritative and rebuildable at any time.
-   Add semantic caching to an existing Redis deployment without provisioning a separate vector database or cache service — it is an additional index and key pattern on the same instance.

## How Redis supports the solution

In practice, each cache entry is a single [Hash]({{< relref "/develop/data-types/hashes" >}}) or [JSON]({{< relref "/develop/data-types/json" >}}) document holding the prompt, its embedding vector, the LLM response, and metadata fields — tenant, locale, model version, safety flags. A [Redis Search]({{< relref "/develop/ai/search-and-query" >}}) index covers the embedding field together with the metadata fields, so a single [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) call performs KNN against the cached prompts with a TAG or NUMERIC pre-filter applied in the same pass. On a hit above the configured distance threshold the application serves the cached response directly; on a miss it runs the LLM and writes the new prompt, response, and metadata back to the same key pattern with a TTL.

Redis provides the following features that make it a good fit for a semantic cache:

-   [Hashes]({{< relref "/develop/data-types/hashes" >}}) and [JSON]({{< relref "/develop/data-types/json" >}}) store the prompt, embedding, response, and metadata together under a single key, so a cache hit returns everything the application needs in one round trip.
-   [Redis Search]({{< relref "/develop/ai/search-and-query" >}}) with [HNSW vector indexes]({{< relref "/develop/ai/search-and-query/vectors" >}}) finds the nearest cached prompt above a configurable similarity threshold in sub-millisecond time, and the same [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) call applies TAG and NUMERIC filters so tenant isolation and namespace scoping happen inside the query, not in application logic.
-   [`EXPIRE`]({{< relref "/commands/expire" >}}) sets a TTL on each cache entry so stale answers age out without manual cleanup, keeping the cache aligned with the underlying knowledge base.
-   Database-level [eviction policies]({{< relref "/develop/reference/eviction" >}}) (LRU / LFU) bound memory under pressure and shed cold entries automatically, so the cache stays within budget as the prompt distribution shifts.
-   Sub-millisecond reads and writes from memory let the semantic cache ride on the same Redis instance already handling sessions, rate limiting, or RAG retrieval at zero marginal cost.

## Ecosystem

The following libraries, frameworks, and managed services build on Redis for semantic caching:

-   **Python**: [RedisVL](https://github.com/redis/redis-vl-python) provides the `SemanticCache` API with built-in embedding, distance thresholds, TTL, and metadata filters. See the [RedisVL LLM cache user guide]({{< relref "/develop/ai/redisvl/user_guide/how_to_guides/llmcache" >}}) and the [LangCache integration guide]({{< relref "/develop/ai/redisvl/user_guide/how_to_guides/langcache_semantic_cache" >}}).
-   **Frameworks**: [LangChain](https://python.langchain.com/docs/integrations/llm_caching/#redis-cache) (Redis as an LLM cache and vector store), [LlamaIndex](https://docs.llamaindex.ai/en/stable/examples/vector_stores/RedisIndexDemo/), and [LangGraph](https://langchain-ai.github.io/langgraph/) for agent memory and response caching.
-   **Managed**: [Redis LangCache]({{< relref "/develop/ai/context-engine/langcache" >}}) is a fully managed semantic cache with a REST API, configurable distance thresholds, automatic eviction, and built-in metrics — no index management or embedding wiring required.

## Code examples to build your own Redis semantic cache

The following guides show how to build a small Redis-backed semantic cache that sits in front of an LLM call. Each guide includes a runnable interactive demo that embeds an incoming prompt, runs a thresholded KNN lookup against the cache with tenant and locale filters, serves the cached response on a hit, and on a miss calls the LLM and writes the new prompt, response, and metadata back with a TTL.

* [redis-py (Python)]({{< relref "/develop/use-cases/semantic-cache/redis-py" >}})
* [node-redis (Node.js)]({{< relref "/develop/use-cases/semantic-cache/nodejs" >}})
* [go-redis (Go)]({{< relref "/develop/use-cases/semantic-cache/go" >}})
* [redis-rs (Rust)]({{< relref "/develop/use-cases/semantic-cache/rust" >}})
* [NRedisStack (C#)]({{< relref "/develop/use-cases/semantic-cache/dotnet" >}})
* [Jedis (Java)]({{< relref "/develop/use-cases/semantic-cache/java-jedis" >}})
* [Lettuce (Java)]({{< relref "/develop/use-cases/semantic-cache/java-lettuce" >}})
* [Predis (PHP)]({{< relref "/develop/use-cases/semantic-cache/php" >}})
* [redis-rb (Ruby)]({{< relref "/develop/use-cases/semantic-cache/ruby" >}})
