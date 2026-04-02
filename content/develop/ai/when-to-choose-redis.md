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
- Simple data structures with complex queries: Work with [Lists]({{< relref "/develop/data-types/lists" >}}), [Sets]({{< relref "/develop/data-types/sets" >}}), [Sorted Sets]({{< relref "/develop/data-types/sorted-sets" >}}), [Hashes]({{< relref "/develop/data-types/hashes" >}}), and [JSON]({{< relref "/develop/data-types/json" >}}) documents with vector search.
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

Use this decision tree to determine if Redis is the right choice for your use case:

```decision-tree {id="redis-selection-tree"}
id: redis-selection-tree
scope: database-selection
rootQuestion: latency
questions:
    latency:
        text: "Do you need sub-10ms response times?"
        whyAsk: "Redis provides sub-millisecond latency for both reads and writes, which is critical for real-time applications"
        answers:
            yes:
                value: "Yes"
                nextQuestion: state-and-vectors
            no:
                value: "No"
                nextQuestion: realtime
    state-and-vectors:
        text: "Do you need both state management and vector search in one database?"
        whyAsk: "Redis combines key-value storage and vector search, eliminating the need for separate databases"
        answers:
            yes:
                value: "Yes"
                outcome:
                    label: "Choose Redis"
                    id: redis-unified
                    sentiment: positive
            no:
                value: "No"
                nextQuestion: realtime
    realtime:
        text: "Do you need real-time streaming, pub/sub, or event processing?"
        whyAsk: "Redis Streams and Pub/Sub provide built-in real-time messaging patterns"
        answers:
            yes:
                value: "Yes"
                outcome:
                    label: "Choose Redis"
                    id: redis-realtime
                    sentiment: positive
            no:
                value: "No"
                nextQuestion: complexity
    complexity:
        text: "Do you want minimal operational complexity?"
        whyAsk: "Redis requires minimal configuration compared to traditional relational databases"
        answers:
            yes:
                value: "Yes"
                outcome:
                    label: "Choose Redis"
                    id: redis-simple
                    sentiment: positive
            no:
                value: "No"
                outcome:
                    label: "Consider alternatives"
                    id: alternatives
                    sentiment: indeterminate
```

## Related topics

- [Redis for AI applications]({{< relref "/develop/ai" >}})
- [Redis Streams documentation]({{< relref "/develop/data-types/streams" >}})
- [Redis JSON documentation]({{< relref "/develop/data-types/json" >}})
- [Redis client libraries]({{< relref "/develop/clients" >}})

