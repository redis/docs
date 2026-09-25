---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Redis Iris is a suite of managed and self-managed services for agent memory, semantic caching, and governed data access.
hideListLinks: true
linktitle: Redis Iris context engine
title: Redis Iris context engine
weight: 30
bannerText: LangCache, Agent Memory, and Context Retriever are currently available in preview. Features and behavior are subject to change.
---

Give your AI agents the context layer they need to reliably act on business data.

Redis Iris eliminates the infrastructure burden of building context-aware AI agents: persistent memory, semantic caching, governed data access, and live data sync, fully managed on Redis Cloud or self-managed on your own infrastructure.

<div class="grid grid-cols-1 md:grid-cols-4 gap-6 my-8">
  {{< tile-card color="bg-blue-300" title="Concepts" description="What happens when an agent asks Redis Iris for context" url="/develop/ai/context-engine/concepts" >}}
  {{< tile-card color="bg-violet-300" title="Agent Memory" description="Persistent short-term and long-term memory across agent interactions" url="/develop/ai/context-engine/agent-memory" >}}
  {{< tile-card color="bg-teal-300" title="LangCache" description="Semantic caching to reduce LLM costs and improve response times" url="/develop/ai/context-engine/langcache" >}}
  {{< tile-card color="bg-rose-300" title="Context Retriever" description="Governed, schema-first data access tools for agents" url="/develop/ai/context-engine/context-retriever" >}}
</div>

## What is Redis Iris?

Redis Iris is a production-ready context engine for AI agents that:

- **Reduces LLM costs**: Semantic caching returns cached responses for similar queries in milliseconds
- **Adds persistent memory**: Agents remember past interactions and user preferences across sessions
- **Structures business data access**: Context Retriever generates governed tools agents can safely call at runtime
- **Keeps data fresh**: Data Integration streams live changes from relational databases into Redis within seconds
- **Deploys your way**: All four services are available fully managed on Redis Cloud or self-managed on your own infrastructure, via REST API

See [how Redis Iris works](/content/develop/ai/context-engine/concepts/_index.md) for the mental model before you start building.

## Why use Redis Iris?

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
  <div class="p-5 border border-redis-pen-300 rounded-lg">
    <h3 class="text-redis-ink-900 font-semibold mb-3">For AI applications</h3>
    <ul class="space-y-1 text-redis-pen-600">
      <li>Agents that remember context across sessions and users</li>
      <li>Faster responses and lower costs through semantic caching</li>
      <li>Reliable, structured access to live business data</li>
      <li>No stale data: near real-time sync from your source databases</li>
    </ul>
  </div>
  <div class="p-5 border border-redis-pen-300 rounded-lg">
    <h3 class="text-redis-ink-900 font-semibold mb-3">For developers</h3>
    <ul class="space-y-1 text-redis-pen-600">
      <li>Four services, fully managed on Redis Cloud or self-managed on your own infrastructure</li>
      <li>Python and JavaScript SDKs and REST APIs for all services</li>
      <li>Define your data model once, reuse it across all agents</li>
      <li>No database setup required on Redis Cloud</li>
    </ul>
  </div>
</div>

## Quick example

Search LangCache before calling your LLM; return a cached response in milliseconds if a semantically similar prompt has been seen before:

```json
POST /v1/caches/{cacheId}/entries/search
{
    "prompt": "What are the features of Product A?"
}
```

If the response is empty (cache miss), call your LLM and store the result:

```json
POST /v1/caches/{cacheId}/entries
{
    "prompt": "What are the features of Product A?",
    "response": "Product A includes X, Y, and Z features..."
}
```

See [LangCache API examples](/content/develop/ai/context-engine/langcache/api-examples.md) and the [Agent Memory REST API quickstart](/content/develop/ai/context-engine/agent-memory/rest-api-quickstart.md) for more.

Redis Iris context engine includes four services:

- **[LangCache](/content/develop/ai/context-engine/langcache/_index.md)**: A semantic caching service that stores and reuses LLM responses for similar queries, reducing API costs and improving response latency.
- **[Agent Memory](/content/develop/ai/context-engine/agent-memory/_index.md)**: A persistent memory service that maintains short-term session memory and long-term memory across agent interactions.
- **[Context Retriever](/content/develop/ai/context-engine/context-retriever/_index.md)**: Turns your business data into structured tools that AI agents can safely and reliably use, defined once and reused across all agents.
- **[Data integration](/content/develop/ai/context-engine/data-integration/_index.md)**: Syncs live data from your existing relational databases into Redis Cloud so agents always have access to fresh, accurate business data.

All four services are available fully managed on [Redis Cloud](/content/operate/iris/_index.md) using the REST API, with no database setup or management required, or self-managed on your own infrastructure.

## LangCache

[LangCache](/content/develop/ai/context-engine/langcache/_index.md) uses semantic similarity to match incoming prompts against previously cached LLM responses. When LangCache finds a semantically similar response in the cache, it returns that response immediately without making an LLM call.

**Key benefits:**

- **Lower LLM costs**: Reduces redundant API calls for semantically equivalent queries.
- **Faster responses**: Serves cached answers in milliseconds instead of waiting for an LLM.
- **Managed embeddings**: LangCache handles embedding generation automatically.
- **Cache control**: Configure similarity thresholds, time-to-live (TTL) settings, and eviction policies.

LangCache works well for AI assistants, chatbots, retrieval-augmented generation (RAG) applications, AI agents, and centralized AI gateway services.

[Get started with LangCache](/content/develop/ai/context-engine/langcache/_index.md)

## Agent Memory

[Agent Memory](/content/develop/ai/context-engine/agent-memory/_index.md) gives AI agents a structured, persistent memory layer using a two-tier model:

- **Session memory** (short-term or working memory): Holds the current conversation state and session metadata, with configurable TTL-based expiration.
- **Long-term memory**: Stores information extracted from past sessions, including user preferences and learned patterns, as text with vector embeddings for semantic retrieval.

Promotion from session memory to long-term memory is automatic and non-blocking. As a conversation progresses, the service asynchronously extracts and stores important information in the background, keeping agent interactions responsive. You can also create long-term memories directly using the API for bulk imports or external knowledge sources.

Agent Memory is available through Python and TypeScript SDKs and a REST API.

[Get started with Agent Memory](/content/develop/ai/context-engine/agent-memory/_index.md)

## Context Retriever

Agents don't fail because they lack data. They fail because they don't know how to use it. Context Retriever turns your raw business data into structured tools that agents can reliably act on, without requiring each project to rediscover how your data works.

You define your data model once, specifying the entities that matter (such as customers or orders) and the fields agents need. Context Retriever automatically generates the tools agents use to query and work with that data. Agents never access your database directly. They call the generated tools, and the system handles the rest.

**Key benefits:**

- **Define once, reuse everywhere**: Business context is captured once and shared across all agents.
- **Automatic tool generation**: Tools are generated from your data model, not hand-coded per agent.
- **Controlled access**: Each agent requires a key, and access tags automatically filter what data each agent can see.
- **Governed by design**: Agents can only use tools that have been explicitly defined, with no direct database access.

[Get started with Context Retriever](/content/develop/ai/context-engine/context-retriever/_index.md)

## Data integration

AI agents are only as reliable as the data they work with. [Redis Data Integration (RDI)](/content/operate/rc/rdi/_index.md) keeps your Redis Cloud database in sync with your existing relational databases, including Oracle, MySQL, PostgreSQL, and SQL Server, so agents always have access to current, accurate business data without querying slow primary databases directly.

RDI uses a data pipeline that performs an initial sync of your source data into Redis, then captures changes in real time. Updates from your primary database appear in Redis within seconds, eliminating stale data and cache misses. Your agents interact only with Redis, which provides fast and predictable query performance.

**Key benefits:**

- **Always-fresh data**: Changes in your source database propagate to Redis within seconds.
- **No direct database access**: Agents query Redis, not your production databases.
- **Minimal setup**: No infrastructure to manage. Redis Cloud handles the pipeline.
- **Broad source support**: Works with Oracle, MySQL, PostgreSQL, MariaDB, SQL Server, and AWS Aurora.

[Get started with Data integration](/content/develop/ai/context-engine/data-integration/_index.md)
