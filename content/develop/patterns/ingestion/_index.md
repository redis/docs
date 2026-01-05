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
description: Patterns for real-time data ingestion and transformation with Redis Streams
linkTitle: Ingestion
title: Real-time ingestion and transformation patterns
weight: 10
---

Real-time ingestion patterns help you build event-driven systems that capture, transform, and route data as it arrives. These patterns use Redis Streams to provide durable, scalable message processing with consumer groups and exactly-once semantics.

## When to use these patterns

Use ingestion patterns when you need to:

- Process events from multiple sources in real time
- Scale event processing across multiple consumers
- Guarantee message delivery and processing
- Transform and route events based on content
- Handle backpressure and flow control
- Maintain event history for replay

## Available patterns

### [Event pipelines with Streams](streams-event-pipeline/)

Build high-throughput event processing pipelines using Redis Streams. Learn how to ingest events, route them to multiple consumers, and handle backpressure.

**Key concepts:** XADD, XREAD, stream routing, retention policies

### [Consumer groups for parallel processing](consumer-groups/)

Scale event processing by distributing work across multiple consumers. Learn how to implement load balancing, failure recovery, and monitoring.

**Key concepts:** XREADGROUP, consumer groups, pending entries, acknowledgments

### [Exactly-once processing](exactly-once-processing/)

Achieve reliable message processing with idempotency patterns and Redis Functions. Learn how to prevent duplicate processing and ensure data consistency.

**Key concepts:** Idempotency keys, deduplication, Redis Functions, transactional guarantees

## Prerequisites

Before working with these patterns, familiarize yourself with:

- [Redis Streams]({{< relref "/develop/data-types/streams" >}}) - Core Streams documentation
- [Redis Functions]({{< relref "/develop/programmability/functions-intro" >}}) - Server-side logic for atomic operations
- [Pipelining]({{< relref "/develop/using-commands/pipelining" >}}) - Batch operations for performance

## Common use cases

- **Event sourcing** - Capture all state changes as events
- **Change data capture** - Stream database changes to other systems
- **Log aggregation** - Collect and process logs from multiple services
- **IoT data ingestion** - Handle high-volume sensor data
- **Real-time ETL** - Extract, transform, and load data continuously
- **Message queuing** - Durable message queues with consumer groups

## Related patterns

- [Streams vs Pub/Sub]({{< relref "/develop/patterns/messaging/streams-vs-pubsub" >}}) - Choose the right messaging pattern
- [Workflows with Redis Functions]({{< relref "/develop/patterns/messaging/workflows-with-functions" >}}) - Orchestrate multi-step processes
- [Time-series data]({{< relref "/develop/patterns/data-modeling/time-series" >}}) - Model time-series efficiently

## More information

- [Streams tutorial]({{< relref "/develop/data-types/streams" >}})
- [Redis Functions guide]({{< relref "/develop/programmability/functions-intro" >}})
- [Client library examples]({{< relref "/develop/clients" >}})

