---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Redis Iris is a suite of fully-managed services that give AI agents the context engine they need to reliably act on business data.
hideListLinks: true
linktitle: Redis Iris context engine
title: Redis Iris context engine
weight: 30
---

Redis Iris context engine includes four services:

- **[LangCache]({{< relref "/develop/ai/context-engine/langcache" >}})**: A semantic caching service that stores and reuses LLM responses for similar queries, reducing API costs and improving response latency.
- **[Agent Memory]({{< relref "/develop/ai/context-engine/agent-memory" >}})**: A persistent memory service that maintains short-term session memory and long-term memory across agent interactions.
- **[Context Retriever]({{< relref "/develop/ai/context-engine/context-retriever" >}})**: Turns your business data into structured tools that AI agents can safely and reliably use, defined once and reused across all agents.
- **[Data integration]({{< relref "/develop/ai/context-engine/data-integration" >}})**: Syncs live data from your existing relational databases into Redis Cloud so agents always have access to fresh, accurate business data.

All four services are available on [Redis Cloud]({{< relref "/operate/rc/context-engine" >}}) using the REST API, with no database setup or management required.

## LangCache

[LangCache]({{< relref "/develop/ai/context-engine/langcache" >}}) uses semantic similarity to match incoming prompts against previously cached LLM responses. When LangCache finds a semantically similar response in the cache, it returns that response immediately without making an LLM call.

**Key benefits:**

- **Lower LLM costs**: Reduces redundant API calls for semantically equivalent queries.
- **Faster responses**: Serves cached answers in milliseconds instead of waiting for an LLM.
- **Managed embeddings**: LangCache handles embedding generation automatically.
- **Cache control**: Configure similarity thresholds, TTLs, and eviction policies.

LangCache works well for AI assistants, chatbots, RAG applications, AI agents, and centralized AI gateway services.

[Get started with LangCache]({{< relref "/develop/ai/context-engine/langcache" >}})

## Agent Memory

[Redis Agent Memory]({{< relref "/develop/ai/context-engine/agent-memory" >}}) gives AI agents a structured, persistent memory layer using a two-tier model:

- **Session memory** (short-term or working memory): Holds the current conversation state and session metadata, with configurable TTL-based expiration.
- **Long-term memory**: Stores information extracted from past sessions, including user preferences and learned patterns, as text with vector embeddings for semantic retrieval.

Promotion from session memory to long-term memory is automatic and non-blocking. As a conversation progresses, the service asynchronously extracts and stores important information in the background, keeping agent interactions responsive. You can also create long-term memories directly using the API for bulk imports or external knowledge sources.

Agent Memory is available as a REST API and Python SDK.

[Get started with Redis Agent Memory]({{< relref "/develop/ai/context-engine/agent-memory" >}})

## Context Retriever

Agents don't fail because they lack data. They fail because they don't know how to use it. Context Retriever turns your raw business data into structured tools that agents can reliably act on, without requiring each project to rediscover how your data works.

You define your data model once, specifying the entities that matter (such as customers or orders) and the fields agents need. Context Retriever automatically generates the tools agents use to query and work with that data. Agents never access your database directly. They call the generated tools, and the system handles the rest.

**Key benefits:**

- **Define once, reuse everywhere**: Business context is captured once and shared across all agents.
- **Automatic tool generation**: Tools are generated from your data model, not hand-coded per agent.
- **Controlled access**: Each agent requires a key, and access tags automatically filter what data each agent can see.
- **Governed by design**: Agents can only use tools that have been explicitly defined, with no direct database access.

[Get started with Context Retriever]({{< relref "/develop/ai/context-engine/context-retriever" >}})

## Data integration

AI agents are only as reliable as the data they work with. [Redis Data Integration (RDI)]({{< relref "/operate/rc/rdi" >}}) keeps your Redis Cloud database in sync with your existing relational databases, including Oracle, MySQL, PostgreSQL, and SQL Server, so agents always have access to current, accurate business data without querying slow primary databases directly.

RDI uses a data pipeline that performs an initial sync of your source data into Redis, then captures changes in real time. Updates from your primary database appear in Redis within seconds, eliminating stale data and cache misses. Your agents interact only with Redis, which provides fast and predictable query performance.

**Key benefits:**

- **Always-fresh data**: Changes in your source database propagate to Redis within seconds.
- **No direct database access**: Agents query Redis, not your production databases.
- **Minimal setup**: No infrastructure to manage. Redis Cloud handles the pipeline.
- **Broad source support**: Works with Oracle, MySQL, PostgreSQL, MariaDB, SQL Server, and AWS Aurora.

[Get started with Data integration]({{< relref "/develop/ai/context-engine/data-integration" >}})
