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
description: Practical patterns for building real-time applications with Redis
linkTitle: Patterns
title: Patterns for building real-time applications
weight: 65
---

Redis patterns are practical guides that show you how to build real-time applications using Redis data structures, commands, and features. Each pattern answers a specific developer question with working code examples and production guidance.

## What you'll find here

These patterns help you solve common development challenges:

- How do I design an event-driven pipeline with Redis Streams?
- How do I model JSON documents for fast search queries?
- How do I implement real-time counters or sliding windows?
- How do I store and query vector embeddings for RAG?
- How do I coordinate multiple AI agents with Streams and Functions?
- How should I structure keys and indexes in Redis Cloud?

## Pattern categories

### Real-time ingestion and transformation

Build event-driven pipelines that ingest, transform, and route data in real time.

- [Event pipelines with Streams](ingestion/streams-event-pipeline/) - Design high-throughput event processing systems
- [Consumer groups for parallel processing](ingestion/consumer-groups/) - Scale event processing across multiple consumers
- [Exactly-once processing](ingestion/exactly-once-processing/) - Achieve reliable message processing with idempotency

### Real-time queries

Query JSON documents, perform full-text search, and find semantically similar content.

- [JSON document queries](queries/json-document-queries/) - Index and query JSON documents in real time
- [Vector similarity search](queries/vector-similarity-search/) - Find semantically similar content with vector embeddings
- [Hybrid vector and keyword search](queries/hybrid-search/) - Combine semantic and exact matching

### Real-time analytics

Calculate metrics, track trends, and aggregate data in real time.

- [Sliding window counters](analytics/sliding-windows/) - Implement time-based analytics and rate limiting
- [Unique counting with HyperLogLog](analytics/unique-counting/) - Track unique visitors and cardinality at scale
- [Real-time aggregations](analytics/real-time-aggregations/) - Build dashboards with Search aggregations

### Messaging and coordination

Coordinate distributed systems with messaging, locks, and workflows.

- [Streams vs Pub/Sub](messaging/streams-vs-pubsub/) - Choose the right messaging pattern
- [Distributed locks](messaging/distributed-locks/) - Coordinate access to shared resources
- [Workflows with Redis Functions](messaging/workflows-with-functions/) - Orchestrate multi-step processes

### Data modeling

Design efficient data models for Redis using JSON, hashes, sorted sets, and indexes.

- [JSON document modeling](data-modeling/json-documents/) - Structure entities as JSON documents
- [Atomic multi-key operations](data-modeling/atomic-operations/) - Ensure consistency across multiple keys
- [Secondary indexes](data-modeling/secondary-indexes/) - Query data by multiple attributes
- [Time-series data](data-modeling/time-series/) - Model and query time-series efficiently

### AI and agentic patterns

Build AI applications with vector search, semantic caching, and agent coordination.

- [Multi-agent coordination](ai/multi-agent-coordination/) - Coordinate multiple AI agents with Streams
- [Agent memory](ai/agent-memory/) - Implement episodic, semantic, and working memory
- [Semantic caching](ai/semantic-caching/) - Cache LLM responses by semantic similarity
- [RAG pipelines](ai/rag-pipeline/) - Build retrieval-augmented generation systems

## More patterns

For additional coding patterns and examples, see:

- [Coding patterns]({{< relref "/develop/clients/patterns" >}}) - Client-focused patterns including:
  - [Bulk loading]({{< relref "/develop/clients/patterns/bulk-loading" >}}) - Load large datasets efficiently
  - [Distributed locks]({{< relref "/develop/clients/patterns/distributed-locks" >}}) - Implement the Redlock algorithm
  - [Twitter clone]({{< relref "/develop/clients/patterns/twitter-clone" >}}) - Comprehensive example using multiple patterns
  - [Secondary indexes]({{< relref "/develop/clients/patterns/indexes" >}}) - Additional indexing examples

## Pattern structure

Each pattern follows a consistent format:

1. **Problem** - What developer problem does this solve?
2. **Solution overview** - High-level approach
3. **Prerequisites** - Links to foundational documentation
4. **Implementation** - Step-by-step guide with code examples
5. **Redis Cloud setup** - Configuration for production deployment
6. **Common pitfalls** - What to avoid
7. **Related patterns** - Links to complementary patterns
8. **More information** - Links to reference documentation

## Code examples

Patterns include working code examples in multiple languages:

- Python (redis-py)
- Node.js (node-redis)
- Java (Jedis)
- Go (go-redis)

Examples are extracted from tested client library documentation and adapted for each pattern's use case.

## Getting started

If you're new to Redis, start with the [quick start guides]({{< relref "/develop/get-started" >}}) to learn the basics. Then explore patterns that match your use case.

For comprehensive documentation on Redis data types, see [Data types]({{< relref "/develop/data-types" >}}).

For AI and vector search applications, see [AI and vector search]({{< relref "/develop/ai" >}}).

