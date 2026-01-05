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
description: Patterns for messaging, coordination, and distributed workflows
linkTitle: Messaging
title: Messaging and coordination patterns
weight: 40
---

Messaging and coordination patterns help you build distributed systems that communicate reliably and coordinate access to shared resources. These patterns use Streams, Pub/Sub, distributed locks, and Redis Functions.

## When to use these patterns

Use messaging and coordination patterns when you need to:

- Send messages between microservices
- Coordinate access to shared resources
- Implement distributed locks and semaphores
- Orchestrate multi-step workflows
- Ensure exactly-once message processing
- Handle service failures gracefully

## Available patterns

### [Streams vs Pub/Sub](streams-vs-pubsub/)

Choose the right messaging pattern for your use case. Learn the tradeoffs between Streams and Pub/Sub for different scenarios.

**Key concepts:** Streams, Pub/Sub, persistence, fan-out, message history

### [Distributed locks]({{< relref "/develop/clients/patterns/distributed-locks" >}})

Coordinate access to shared resources across multiple processes. Learn the Redlock algorithm and implementation best practices.

**Key concepts:** SET NX, Redlock, mutual exclusion, deadlock prevention

### [Workflows with Redis Functions](workflows-with-functions/)

Orchestrate multi-step processes with Redis Functions. Learn how to implement state machines, sagas, and error handling.

**Key concepts:** Redis Functions, state machines, saga pattern, compensation

## Prerequisites

Before working with these patterns, familiarize yourself with:

- [Redis Streams]({{< relref "/develop/data-types/streams" >}}) - Durable messaging
- [Pub/Sub]({{< relref "/develop/pubsub" >}}) - Publish-subscribe messaging
- [Redis Functions]({{< relref "/develop/programmability/functions-intro" >}}) - Server-side logic
- [Transactions]({{< relref "/develop/using-commands/transactions" >}}) - Atomic operations

## Common use cases

- **Microservice communication** - Reliable message passing between services
- **Task queues** - Distribute work across worker processes
- **Event-driven architecture** - React to events across services
- **Distributed locking** - Coordinate access to shared resources
- **Leader election** - Select a leader in distributed systems
- **Workflow orchestration** - Multi-step business processes

## Related patterns

- [Event pipelines with Streams]({{< relref "/develop/patterns/ingestion/streams-event-pipeline" >}}) - Build event-driven systems
- [Consumer groups]({{< relref "/develop/patterns/ingestion/consumer-groups" >}}) - Parallel message processing
- [Exactly-once processing]({{< relref "/develop/patterns/ingestion/exactly-once-processing" >}}) - Reliable message handling
- [Atomic operations]({{< relref "/develop/patterns/data-modeling/atomic-operations" >}}) - Multi-key consistency

## More information

- [Streams documentation]({{< relref "/develop/data-types/streams" >}})
- [Pub/Sub documentation]({{< relref "/develop/pubsub" >}})
- [Redis Functions guide]({{< relref "/develop/programmability/functions-intro" >}})
- [Distributed locks pattern]({{< relref "/develop/clients/patterns/distributed-locks" >}})

