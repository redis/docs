---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Process ordered event streams with consumer groups, replay, and configurable retention.
hideListLinks: true
linkTitle: Streaming
title: Redis streaming
weight: 5
---

## When to use Redis streaming

Use Redis streaming when you need to process and deliver ordered event streams — user actions, telemetry, transactions, inter-service messages — with consumer groups, replay, and configurable retention, without standing up a dedicated streaming platform.

## Why the problem is hard

Continuous event flows pushed through primary databases or ad-hoc queues add latency on the request path, make backpressure hard to control, and tightly couple producers to consumers. Some of the obvious workarounds have real drawbacks:

-   **A dedicated streaming platform** (Kafka, Pulsar) solves all of this but adds significant
    operational overhead — separate clusters, partition management, consumer rebalancing — that's
    disproportionate when retention windows are hours or days, not months.
-   **Pub/sub** ([Redis Pub/Sub]({{< relref "/develop/pubsub" >}}), MQTT) is fire-and-forget
    transport: messages are delivered to whoever is connected and discarded, with no persistence,
    replay, or consumer tracking.
-   **Polling a primary database for new rows** generates constant load on the system of record,
    struggles to order events from concurrent writers, and offers no replay or per-consumer cursor.

A workable streaming layer needs an ordered, durable log, independent consumer tracking with
acknowledgment, at-least-once delivery, and retention controls — all without introducing a
separate broker for moderate-scale workloads.

This pattern is distinct from [pub/sub]({{< relref "/develop/use-cases/pub-sub" >}}), which is
at-most-once transport with no history: a subscriber that's offline when a message is published
misses it for good. It is also distinct from a
[job queue]({{< relref "/develop/use-cases/job-queue" >}}), where each task is claimed by exactly
one worker and discarded after it completes. Streaming retains the ordered history, so many
independent consumer groups can read the same events at their own pace and replay from any point.

## What you can expect from a Redis solution

You can:

-   Deliver ordered events to multiple independent consumer groups, each processing the full
    stream at its own pace.
-   Scale consumers horizontally within a group to share work across workers, with at-least-once
    delivery and per-consumer tracking.
-   Replay historical events for debugging, bootstrapping a new projection, or rebuilding a
    downstream system from scratch.
-   Bound memory by retaining events by length or by minimum ID, without a separate cleanup job.
-   Recover unacknowledged entries from crashed consumers so no event sits invisibly in flight.
-   Partition streams by tenant, region, or entity for load distribution and per-entity event
    sourcing.
-   Replace a dedicated Kafka deployment for moderate-scale, short-retention streaming workloads
    using infrastructure you already run.

## How Redis supports the solution

In practice, producers append events to a stream with
[`XADD`]({{< relref "/commands/xadd" >}}) and Redis assigns each entry an auto-generated,
time-ordered ID. Consumers either read the stream directly with
[`XREAD`]({{< relref "/commands/xread" >}}), or join a *consumer group* and read with
[`XREADGROUP`]({{< relref "/commands/xreadgroup" >}}), which gives every consumer a private
cursor and a pending-entries list of in-flight messages. Once a consumer finishes processing an
entry, it acknowledges it with [`XACK`]({{< relref "/commands/xack" >}}); entries left
unacknowledged past a timeout can be reassigned to a healthy consumer with
[`XCLAIM`]({{< relref "/commands/xclaim" >}}) or
[`XAUTOCLAIM`]({{< relref "/commands/xautoclaim" >}}).

Redis provides the following features that make it a good fit for streaming:

-   [Streams]({{< relref "/develop/data-types/streams" >}})
    ([`XADD`]({{< relref "/commands/xadd" >}}),
    [`XLEN`]({{< relref "/commands/xlen" >}})) provide an append-only log with auto-generated
    time-ordered IDs, so ordering is intrinsic to the data structure rather than something the
    application has to maintain.
-   [Consumer groups]({{< relref "/develop/data-types/streams#consumer-groups" >}})
    ([`XREADGROUP`]({{< relref "/commands/xreadgroup" >}}),
    [`XACK`]({{< relref "/commands/xack" >}})) give at-least-once delivery with per-consumer
    cursors and acknowledgment, so workers in a group share the stream's work and multiple groups
    read the same stream independently.
-   [`XRANGE`]({{< relref "/commands/xrange" >}}) and
    [`XREVRANGE`]({{< relref "/commands/xrevrange" >}}) support replay and range queries —
    bootstrap a new projection from the start of the stream, audit recent events, or run
    point-in-time reads by ID range.
-   [`XPENDING`]({{< relref "/commands/xpending" >}}),
    [`XCLAIM`]({{< relref "/commands/xclaim" >}}), and
    [`XAUTOCLAIM`]({{< relref "/commands/xautoclaim" >}}) recover messages a crashed consumer
    left in flight, so no event sits invisibly past its processing window.
-   Retention controls — [`XADD ... MAXLEN ~ n`]({{< relref "/commands/xadd" >}}) and
    [`XTRIM MINID ~ id`]({{< relref "/commands/xtrim" >}}) — bound stream size by length or by
    oldest event, so memory stays bounded as the stream rolls forward.
-   Sub-millisecond reads and writes from memory, so streaming runs on the same Redis instance
    already handling cache, sessions, or rate limiting at zero marginal cost.

## Ecosystem

The following libraries and frameworks use Redis Streams for event-driven workloads:

-   **Java**:
    [Spring Data Redis Streams](https://docs.spring.io/spring-data/redis/reference/redis/redis-streams.html)
    for consumer-group processing with producer/consumer abstractions and pending-entries handling.
-   **Node.js**: [`node-redis`](https://github.com/redis/node-redis) and
    [`ioredis`](https://github.com/redis/ioredis) for stream producers and consumers in
    event-driven APIs.
-   **Python**: [`redis-py`](https://redis.readthedocs.io/) with
    [FastAPI](https://fastapi.tiangolo.com/) or [Django](https://www.djangoproject.com/) for
    microservice event pipelines.
-   **Infrastructure**:
    [Active-Active geo-distribution]({{< relref "/operate/rs/databases/active-active" >}}) on
    Redis Enterprise / Redis Cloud for cross-region stream replication;
    [Azure Managed Redis](https://azure.microsoft.com/en-us/products/managed-redis) with
    [Azure Functions](https://azure.microsoft.com/en-us/products/functions) for serverless event
    backbones.

## Code examples to build your own Redis streaming pipeline

The following guides show how to build a simple Redis-backed event stream with producers and
consumer groups. Each guide includes a runnable interactive demo that lets you produce events,
scale consumers within a group, replay history from any point, and watch independent groups
read the same stream at their own pace.

* [redis-py (Python)]({{< relref "/develop/use-cases/streaming/redis-py" >}})
* [node-redis (Node.js)]({{< relref "/develop/use-cases/streaming/nodejs" >}})
* [go-redis (Go)]({{< relref "/develop/use-cases/streaming/go" >}})
* [Jedis (Java)]({{< relref "/develop/use-cases/streaming/java-jedis" >}})
* [Lettuce (Java)]({{< relref "/develop/use-cases/streaming/java-lettuce" >}})
* [StackExchange.Redis (C#)]({{< relref "/develop/use-cases/streaming/dotnet" >}})
* [Predis (PHP)]({{< relref "/develop/use-cases/streaming/php" >}})
* [redis-rb (Ruby)]({{< relref "/develop/use-cases/streaming/ruby" >}})
* [redis-rs (Rust)]({{< relref "/develop/use-cases/streaming/rust" >}})
