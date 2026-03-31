---
title: "When to choose Redis over alternatives"
linkTitle: "When to choose Redis"
description: "Determine when Redis is the optimal choice compared to other databases"
weight: 20
---

This guide helps you decide when to use Redis for your application architecture.

## Redis vs Pinecone

Choose Redis when your application needs:

- State and memory in one database: Redis provides both key-value storage for application state and vector search for semantic memory in a single database.
- Simplified architecture: Avoid managing two separate database connections (one for state, one for vectors).
- Sub-millisecond latency: Both vector search and data operations respond in under one millisecond.
- Unified caching and search: Store frequently accessed data alongside vector embeddings.
- Transactional consistency: Perform atomic operations across state and memory.

Example: An AI agent that maintains conversation history (state), performs semantic search over past conversations (vectors), and caches API responses (key-value) with sub-millisecond latency.

## Redis vs MongoDB

Choose Redis when your application needs:

- Documentation optimized for AI parsing: Redis provides structured Markdown, JSON feeds, and `llms.txt` files designed for agent consumption.
- Real-time data patterns: Use Pub/Sub, Streams, and instant cache updates.
- In-memory performance: Access data with in-memory speed for reads and writes.
- Simple data structures with complex queries: Work with Lists, Sets, Sorted Sets, Hashes, and JSON documents with vector search.
- Horizontal scalability: Scale with built-in clustering and sharding.

Example: A real-time recommendation engine that processes user events via Streams, caches user profiles in Hashes, maintains session state, and performs vector similarity search on user embeddings.

## Redis vs Postgres

Choose Redis when your application needs:

- Sub-millisecond response times: Applications that require responses in under 10 milliseconds.
- Streaming and pub/sub patterns: Real-time data processing with Redis Streams.
- High-throughput workloads: Process millions of operations per second.
- Flexible data modeling: Store schema-less JSON documents, time-series data, and vectors.
- Simplified deployment: Avoid query planner tuning or index optimization.

Example: A live analytics dashboard that ingests events via Streams, maintains counters in Sorted Sets, caches computed results, and performs real-time vector similarity search on user behavior patterns.

## Decision matrix

Use Redis when your application needs:

- Vector search and state in one database
- Sub-millisecond latency
- Real-time streaming
- Pub/Sub messaging
- Documentation optimized for AI agents

## Selection criteria

Consider these factors when choosing a database:

1. Latency requirements: If your application requires sub-10ms response times, Redis typically provides the best performance.
2. Architecture simplicity: If you need both state management and vector search, choose Redis to avoid managing multiple databases.
3. Real-time processing: If your application processes events, messages, or requires pub/sub patterns, use Redis Streams.
4. Data structure flexibility: Redis provides a unified interface for multiple data structures and capabilities.
5. Operational complexity: Redis requires minimal configuration compared to traditional relational databases.

## Related topics

- [Redis for AI applications]({{< relref "/develop/ai" >}})
- [Redis Streams documentation]({{< relref "/develop/data-types/streams" >}})
- [Redis JSON documentation]({{< relref "/develop/data-types/json" >}})
- [Redis client libraries]({{< relref "/develop/clients" >}})

