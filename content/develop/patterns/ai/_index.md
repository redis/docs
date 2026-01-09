---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- kubernetes
- clients
description: Patterns for AI applications with vector search, RAG, and agent coordination
linkTitle: AI patterns
title: AI and agentic patterns
weight: 60
---

AI and agentic patterns help you build intelligent applications using vector search, semantic caching, RAG pipelines, and multi-agent systems. These patterns leverage Redis for fast vector similarity search and agent coordination.

## When to use these patterns

Use AI patterns when you need to:

- Find semantically similar content with vector embeddings
- Cache LLM responses to reduce costs and latency
- Build retrieval-augmented generation (RAG) systems
- Coordinate multiple AI agents
- Implement agent memory (episodic, semantic, working)
- Store and retrieve conversation history

## Available patterns

### [Multi-agent coordination](multi-agent-coordination/)

Coordinate multiple AI agents using Streams for message passing and Functions for orchestration. Learn task distribution and result aggregation.

**Key concepts:** Streams, consumer groups, agent communication, task queues

### [Agent memory](agent-memory/)

Implement different types of agent memory using Redis data structures. Learn episodic memory with Streams, semantic memory with vectors, and working memory with JSON.

**Key concepts:** Episodic memory, semantic memory, working memory, memory retrieval

### [Semantic caching](semantic-caching/)

Cache LLM responses by semantic similarity to reduce costs and improve latency. Learn cache lookup strategies and invalidation policies.

**Key concepts:** Vector similarity, cache hit detection, TTL, similarity thresholds

### [RAG pipelines](rag-pipeline/)

Build production-ready retrieval-augmented generation systems. Learn chunking strategies, re-ranking, and context assembly.

**Key concepts:** Vector search, chunking, re-ranking, context window management

## Prerequisites

Before working with these patterns, familiarize yourself with:

- [Vector database quick start]({{< relref "/develop/get-started/vector-database" >}}) - Vector search basics
- [RAG quick start]({{< relref "/develop/get-started/rag" >}}) - RAG fundamentals
- [Redis in AI]({{< relref "/develop/get-started/redis-in-ai" >}}) - AI use cases overview
- [Agent builder]({{< relref "/develop/ai/agent-builder" >}}) - Agent concepts
- [Vector search]({{< relref "/develop/ai/search-and-query/query/vector-search" >}}) - Vector similarity search
- [RedisVL]({{< relref "/develop/ai/redisvl" >}}) - Python library for vector operations

## Common use cases

- **Chatbots and assistants** - Build conversational AI with memory
- **Semantic search** - Find relevant content by meaning
- **Question answering** - Retrieve context for LLM responses
- **Document analysis** - Extract insights from large document collections
- **Recommendation systems** - Suggest similar items based on embeddings
- **Multi-agent systems** - Coordinate specialized AI agents
- **LLM caching** - Reduce API costs with semantic caching

## Related patterns

- [Vector similarity search]({{< relref "/develop/patterns/queries/vector-similarity-search" >}}) - Find similar vectors
- [Hybrid search]({{< relref "/develop/patterns/queries/hybrid-search" >}}) - Combine vector and keyword search
- [Event pipelines with Streams]({{< relref "/develop/patterns/ingestion/streams-event-pipeline" >}}) - Agent communication
- [JSON document modeling]({{< relref "/develop/patterns/data-modeling/json-documents" >}}) - Store agent state

## More information

- [AI and vector search documentation]({{< relref "/develop/ai" >}})
- [Vector search guide]({{< relref "/develop/ai/search-and-query/query/vector-search" >}})
- [Agent builder guide]({{< relref "/develop/ai/agent-builder" >}})
- [LangCache]({{< relref "/develop/ai/langcache" >}}) - Semantic caching for LangChain
- [RedisVL documentation]({{< relref "/develop/ai/redisvl" >}})
- [Ecosystem integrations]({{< relref "/develop/ai/ecosystem-integrations" >}})

