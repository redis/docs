---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Give AI agents persistent memory that spans sessions and tasks — working memory per thread, long-term semantic recall, and a time-ordered event log — on a single Redis instance, with sub-millisecond reads on the agent loop's hot path.
hideListLinks: true
linkTitle: Agent memory
title: Redis as agent memory
weight: 8
---

## When to use Redis as agent memory

Use Redis as the memory layer for an AI agent when each reasoning step needs to recall both *what just happened in this session* and *what the agent has learned over time* under a strict per-step latency budget — without standing up a separate vector database, message broker, and session store for each tier.

## Why the problem is hard

LLMs are stateless. Every API call starts from zero unless the application supplies the relevant context. Without a memory layer, agents re-derive information through extra LLM calls, lose personalization between sessions, and cannot coordinate state in multi-agent deployments. Some of the obvious workarounds have real drawbacks:

-   **A standalone vector database** can index long-term semantic memories, but doesn't cover working session state or an ordered action log, and putting a separate service on the agent's hot path adds latency that compounds across multi-step reasoning loops.
-   **In-process or app-server session storage** keeps working memory close to the agent, but disappears on process restart and can't be shared across multi-agent or load-balanced deployments — exactly the topology most production agents end up in.
-   **Stuffing everything into the LLM context window** shifts the cost of memory onto every API call, hits the model's context limit on long-running sessions, and reliably degrades reasoning quality as the context grows.

The core difficulty is that an agent needs *several kinds* of memory at once — short-lived working state per thread, durable semantic recall by meaning, and an audit trail of recent actions — each with its own retention rule and access pattern. Mapping all three onto a single primitive (only a vector index, only a key-value store, only an append log) forces compromises that show up as either lost context or extra LLM calls. Memory must also stay bounded; without deduplication, summarization, and background consolidation, stale context piles up and degrades downstream accuracy.

This pattern is distinct from generic [session storage]({{< relref "/develop/use-cases/session-store" >}}) (spans a single user session, no semantic recall), from [semantic caching]({{< relref "/develop/use-cases/semantic-cache" >}}) (deduplicates LLM calls, not accumulated agent knowledge), and from RAG retrieval against an external document corpus (static reference material, not the agent's own experience).

## What you can expect from a Redis solution

You can:

-   Persist and resume agent sessions by thread ID across restarts and across load-balanced workers.
-   Recall long-term memories by semantic similarity instead of exact key, scoped per user, namespace, or memory kind.
-   Prevent memory bloat by deduplicating near-identical memories at write time with the same vector index that powers recall.
-   Run semantic caching, RAG retrieval, and agent memory together on a single Redis deployment, sharing the same vector index infrastructure.
-   Keep each step in the agent reasoning loop under budget — Redis reads and writes are sub-millisecond, so the memory layer doesn't dominate per-step latency.

## How Redis supports the solution

In practice, each tier of agent memory maps onto a Redis primitive that's already in the cluster. **Working memory** for an active session is a [Hash]({{< relref "/develop/data-types/hashes" >}}) at a deterministic key such as `agent:session:{thread_id}`, holding the running scratchpad, current goal, and recent turns — written with [`HSET`]({{< relref "/commands/hset" >}}) and read in one round trip with [`HGETALL`]({{< relref "/commands/hgetall" >}}). **Long-term memory** — both episodic ("what happened in past sessions") and semantic ("what the agent has learned about this user or domain") — lives as [JSON]({{< relref "/develop/data-types/json" >}}) documents that carry an embedding vector, indexed by [Redis Search]({{< relref "/develop/ai/search-and-query" >}}) on a [HNSW vector field]({{< relref "/develop/ai/search-and-query/vectors" >}}) together with tag fields (user, namespace, kind, source thread). The agent recalls memories with one [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) call that combines vector similarity with metadata filtering, and the same similarity check runs at write time to deduplicate near-identical memories before they enter the store. **A time-ordered event log** of the agent's recent actions and observations is a [Stream]({{< relref "/develop/data-types/streams" >}}) appended with [`XADD`]({{< relref "/commands/xadd" >}}), replayed with [`XREVRANGE`]({{< relref "/commands/xrevrange" >}}), and bounded with [`XTRIM`]({{< relref "/commands/xtrim" >}}).

Redis provides the following features that make it a good fit for agent memory:

-   [Hashes]({{< relref "/develop/data-types/hashes" >}}) hold per-session working memory under one key, so loading or persisting a thread's state takes a single round trip.
-   [JSON]({{< relref "/develop/data-types/json" >}}) documents store each long-term memory together with its embedding vector and metadata, so a similarity search returns everything the agent needs without a second lookup.
-   [Redis Search]({{< relref "/develop/ai/search-and-query" >}}) with [HNSW vector indexes]({{< relref "/develop/ai/search-and-query/vectors" >}}) recalls memories by meaning in sub-millisecond time, and the same [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) call applies TAG and NUMERIC filters so user, namespace, and kind scoping happen inside the query rather than in application code.
-   [Streams]({{< relref "/develop/data-types/streams" >}}) keep an ordered log of agent actions and observations, [`XTRIM`]({{< relref "/commands/xtrim" >}}) bounds retention without manual cleanup, and consumer groups let downstream workers — summarizers, consolidators — replay the log without losing position.
-   [`EXPIRE`]({{< relref "/commands/expire" >}}) automates memory decay per tier — short TTLs on working memory, longer on episodic logs, no TTL on consolidated core knowledge — so stale context falls off without a separate cleanup job.
-   Sub-millisecond reads and writes from memory keep each turn of the agent loop under budget, and a single Redis instance can carry working memory, long-term recall, the event log, semantic caching, and RAG retrieval at zero marginal infrastructure cost.

## Ecosystem

The following libraries, frameworks, and managed services build on Redis for agent memory:

-   **Python**: [RedisVL]({{< relref "/develop/ai/redisvl" >}}) provides vector-index, session-manager, and semantic-memory helpers you can compose into an agent memory layer.
-   **Frameworks**: [LangChain]({{< relref "/integrate/langchain-redis" >}}) supports Redis as a chat history and memory backend, and [LangGraph & Redis](https://redis.io/blog/langgraph-redis-build-smarter-ai-agents-with-memory-persistence/) ships a Redis checkpointer for persisting graph state across runs.
-   **AWS**: [Amazon Bedrock]({{< relref "/integrate/amazon-bedrock" >}}) agent runtimes integrate with Redis for memory persistence and vector search.
-   **Any language**: standard Redis client libraries cover the pattern below for custom agent loops.
-   **Managed**: [Redis Agent Memory Server]({{< relref "/develop/ai/context-engine/agent-memory" >}}) is a managed agent memory service with REST and MCP interfaces, working and long-term memory tiers, deduplication, summarization, and background consolidation — useful when you'd rather not build and operate the pattern below yourself.

## Code examples to build your own Redis agent memory

The following guide shows how to build a small Redis-backed agent memory layer using only standard Redis commands — working memory in a hash per thread, long-term memory as JSON documents with a vector index, an event log in a stream, and per-tier TTLs for decay. It includes a runnable interactive demo where you can send turns, watch working memory update, see semantic recall against past memories, and inspect the event log.

* [redis-py (Python)]({{< relref "/develop/use-cases/agent-memory/redis-py" >}})
