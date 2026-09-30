---
linkTitle: Redis for AI
title: Redis for AI
categories:
- docs
- integrate
- oss
- rs
- rc
description: Build AI applications with Redis vector database and semantic caching
group: library
stack: true
summary: Python, JavaScript, and Java libraries for building AI applications with vector search, RAG, and semantic caching.
type: integration
weight: 5
---

Build powerful AI applications using Redis as your vector database with specialized libraries for Python, JavaScript, and Java.

## Overview

Redis provides comprehensive AI libraries and tools to help you build intelligent applications with vector search, retrieval-augmented generation (RAG), semantic caching, and more. Whether you're working with LangChain, LlamaIndex, or building custom AI solutions, Redis has the tools you need.

[Explore the complete Redis for AI documentation](/content/develop/ai/_index.md)

## Key Features

- **Vector Search**: Store and query vector embeddings with HNSW and FLAT index types
- **Semantic Caching**: Cache LLM responses to reduce costs and improve performance
- **RAG Support**: Build retrieval-augmented generation applications with popular frameworks
- **Multi-language Support**: Libraries available for Python, JavaScript, and Java
- **Real-time Performance**: Sub-millisecond query latency for production AI applications

## AI Libraries

### RedisVL (Python)

The Redis Vector Library (RedisVL) is a Python client library for building AI applications with Redis.

- **Vector Search**: Create and query vector indexes with ease
- **Semantic Caching**: Built-in LLM cache for faster responses
- **RAG Utilities**: Tools for building retrieval-augmented generation apps
- **Framework Integration**: Works with LangChain, LlamaIndex, and more

[Learn more about RedisVL](/content/develop/ai/redisvl/_index.md)

### LangChain Integration

Use Redis with LangChain for vector stores, semantic caching, and chat message history.

- **Vector Store**: Store and retrieve embeddings for RAG applications
- **Semantic Cache**: Cache LLM responses based on semantic similarity
- **Chat History**: Persist conversation history for AI agents

[Learn more about LangChain integration](/content/integrate/langchain-redis/_index.md)

### Client Libraries with Vector Search

All major Redis client libraries support vector search operations:

- **redis-py (Python)**: [Vector search guide](/content/develop/clients/redis-py/vecsearch.md)
- **node-redis (JavaScript)**: [Vector search guide](/content/develop/clients/nodejs/vecsearch.md)
- **Jedis (Java)**: [Vector search guide](/content/develop/clients/jedis/vecsearch.md)
- **NRedisStack (C#/.NET)**: [Vector search guide](/content/develop/clients/dotnet/nredisstack/vecsearch.md)
- **go-redis (Go)**: [Vector search guide](/content/develop/clients/go/vecsearch.md)

## Getting Started

### Quick Start Guides

- [Redis vector database quick start](/content/develop/get-started/search-tutorial/vector-search.md)
- [RAG quick start guide](/content/develop/get-started/rag.md)

### Tutorials and Examples

Explore our [AI notebooks collection](/content/develop/ai/notebook-collection.md) with examples for:

- RAG implementations with RedisVL, LangChain, and LlamaIndex
- Advanced RAG techniques and optimizations
- Integration with cloud platforms like Azure and Vertex AI

### Video Tutorials

Watch our [AI video collection](/content/develop/ai/ai-videos.md) for practical demonstrations.

## Use Cases

- **Retrieval-Augmented Generation (RAG)**: Enhance LLM responses with relevant context
- **Semantic Search**: Find similar documents, images, or products
- **Recommendation Systems**: Build real-time personalized recommendations
- **AI Agents**: Create autonomous agents with memory and tool use
- **Chatbots**: Build conversational AI with context and history

## Additional Resources

- [Complete AI documentation](/content/develop/ai/_index.md)
- [Ecosystem integrations](/content/develop/ai/ecosystem-integrations.md)
- [Vector search benchmarks](https://redis.io/blog/benchmarking-results-for-vector-databases/)
- [RAG best practices](https://redis.io/blog/get-better-rag-responses-with-ragas/)

