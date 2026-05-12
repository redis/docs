---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Redis Iris is a suite of fully-managed services that give AI agents the context engine they need to reliably act on business data.
hideListLinks: true
linktitle: Context engine
title: Context engine
weight: 30
---

Context engine includes three services:

- **[LangCache]({{< relref "/develop/ai/context-engine/langcache" >}})** — a semantic caching service that stores and reuses LLM responses for similar queries, reducing API costs and improving response latency.
- **[Agent Memory]({{< relref "/develop/ai/context-engine/agent-memory" >}})** — a persistent memory service that maintains short-term session memory and long-term memory across agent interactions.
- **[Context Retriever](#context-retriever)** — turns your business data into structured tools that AI agents can safely and reliably use, defined once and reused across all agents.

All three services are available on [Redis Cloud]({{< relref "/operate/rc/context-engine" >}}) via REST API, with no database setup or management required.

## LangCache

[LangCache]({{< relref "/develop/ai/context-engine/langcache" >}}) uses semantic similarity to match incoming prompts against previously cached LLM responses. When a semantically similar prompt has been seen before, LangCache returns the cached response immediately — no LLM call required.

**Key benefits:**

- **Lower LLM costs** — avoid redundant API calls for semantically equivalent queries
- **Faster responses** — serve cached answers in milliseconds instead of waiting for an LLM
- **Managed embeddings** — LangCache handles embedding generation automatically
- **Cache control** — configure similarity thresholds, TTLs, and eviction policies

LangCache works well for AI assistants, chatbots, RAG applications, AI agents, and centralized AI gateway services.

[Get started with LangCache]({{< relref "/develop/ai/context-engine/langcache" >}})

## Agent Memory

[Redis Agent Memory]({{< relref "/develop/ai/context-engine/agent-memory" >}}) gives AI agents a structured, persistent memory layer using a two-tier model:

- **Session memory** (short-term / working memory) holds the current conversation state and session metadata, with configurable TTL-based expiration.
- **Long-term memory** stores information extracted from past sessions — user preferences, learned patterns, and other relevant context — as text with vector embeddings for semantic retrieval.

Promotion from session memory to long-term memory is automatic and non-blocking. As a conversation progresses, the service asynchronously extracts and stores important information in the background, keeping agent interactions responsive. You can also create long-term memories directly via the API for bulk imports or external knowledge sources.

Agent Memory is available as a REST API and Python SDK.

[Get started with Redis Agent Memory]({{< relref "/develop/ai/context-engine/agent-memory" >}})

## Context Retriever

AI agents don't fail because they lack data — they fail because they don't know how to use it. Context Retriever solves this by turning your raw business data into structured tools that agents can reliably act on, without every project needing to rediscover how your data works.

You define your data model once — the entities that matter (such as customers or orders) and the fields agents need. Context Retriever automatically generates the tools agents use to query and work with that data. Agents never access your database directly; they call the generated tools, and the system handles the rest.

**Key benefits:**

- **Define once, reuse everywhere** — business context is captured once and shared across all agents
- **Automatic tool generation** — tools are generated from your data model, not hand-coded per agent
- **Controlled access** — each agent requires a key; access tags automatically filter what data each agent can see
- **Governed by design** — agents can only use tools that have been explicitly defined, with no direct database access

[Get started with Context Retriever](#) <!-- link to be added -->
