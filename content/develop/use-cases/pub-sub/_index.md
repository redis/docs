---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Broadcast real-time events to many consumers with Redis pub/sub.
hideListLinks: true
linkTitle: Pub/sub messaging
title: Redis pub/sub messaging
weight: 5
---

## When to use Redis pub/sub

Use Redis pub/sub when you need to broadcast real-time events — notifications, chat messages, cache invalidation signals, UI updates — from one or more producers to many consumers without tight coupling.

## Why the problem is hard

Point-to-point communication between services creates tight coupling that becomes brittle as
the number of producers and consumers grows. Each new subscriber means another integration.
Some of the obvious workarounds have real drawbacks:

-   **In-process event buses** don't work across instances or services — every new pod or worker
    starts with an empty bus.
-   **Full message brokers** (Kafka, RabbitMQ) add operational overhead and latency that's
    overkill when you don't need message persistence, replay, or delivery guarantees.
-   **Per-pair direct connections** (one publisher, one subscriber, hard-coded URLs) don't fan
    out and don't survive instance churn — adding a fourth consumer means touching the producer.

A workable broadcast layer needs sub-millisecond fan-out, no per-subscriber configuration on
the publisher side, and a way to route events through named topics so subscribers can pick what
they care about without coordinating with publishers.

If you also need persistence, replay, or at-least-once delivery, the answer is
[Redis Streams]({{< relref "/develop/data-types/streams" >}}), not pub/sub — the two solve
different problems on the same infrastructure.

## What you can expect from a Redis solution

You can:

-   Fan out events across microservices, pods, or edge nodes without direct service-to-service
    calls.
-   Broadcast cache invalidation to all application instances simultaneously.
-   Push real-time updates to WebSocket clients across multiple server nodes (the
    [Socket.IO](https://socket.io/) Redis adapter pattern).
-   Signal user presence, typing indicators, or live dashboard updates with sub-millisecond
    latency.
-   Subscribe to flexible topic hierarchies with glob patterns — a single `orders:*`
    subscription captures all order events without per-channel wiring.
-   Keep durable state in regular Redis keys or external systems and use pub/sub purely as the
    transport.

## How Redis supports the solution

In practice, a publisher calls `PUBLISH channel payload` and Redis fans the message out to every
client currently subscribed to that channel, in the order the messages were published.
Subscribers register interest with `SUBSCRIBE channel` (exact-match) or `PSUBSCRIBE pattern`
(glob-match), and the connection then switches into a subscribe-only mode that pushes incoming
messages over the same socket. Delivery is at-most-once: a subscriber that's offline when the
message is published misses it for good.

Redis provides the following features that make it a good fit for broadcast messaging:

-   [`PUBLISH`]({{< relref "/commands/publish" >}}) for fan-out from any client to every active
    subscriber of a channel, with a sub-millisecond hop through Redis.
-   [`SUBSCRIBE`]({{< relref "/commands/subscribe" >}}) and
    [`UNSUBSCRIBE`]({{< relref "/commands/unsubscribe" >}}) for exact-match channel
    subscriptions, the simplest topic-based routing model.
-   [`PSUBSCRIBE`]({{< relref "/commands/psubscribe" >}}) and
    [`PUNSUBSCRIBE`]({{< relref "/commands/punsubscribe" >}}) for glob-style pattern
    subscriptions (`cache:invalidate:*`, `news.*.headline`), so a subscriber can listen to whole
    topic hierarchies without pre-registering every channel.
-   [`PUBSUB CHANNELS`]({{< relref "/commands/pubsub-channels" >}}),
    [`PUBSUB NUMSUB`]({{< relref "/commands/pubsub-numsub" >}}), and
    [`PUBSUB NUMPAT`]({{< relref "/commands/pubsub-numpat" >}}) for introspection — list active
    channels, count subscribers per channel, count active pattern subscriptions.
-   [Sharded pub/sub]({{< relref "/develop/pubsub#sharded-pubsub" >}})
    ([`SSUBSCRIBE`]({{< relref "/commands/ssubscribe" >}}),
    [`SPUBLISH`]({{< relref "/commands/spublish" >}})) in Redis 7.0+ so the same pattern scales
    horizontally on a Redis Cluster without every message touching every node.
-   No message storage overhead — messages are delivered to active subscribers and discarded
    immediately, keeping the messaging path stateless and fast.
-   [Keyspace notifications]({{< relref "/develop/pubsub/keyspace-notifications" >}}) for
    receiving events about key changes (`SET`, expiration, eviction) through the same pub/sub
    transport.

## Ecosystem

The following frameworks and libraries use Redis pub/sub for broadcast messaging:

-   **Node.js**: [Socket.IO](https://socket.io/) Redis adapter for cross-node WebSocket fan-out
-   **Python**: [`redis-py`](https://redis.readthedocs.io/) subscribers with
    [FastAPI]({{< relref "/integrate/fastapi" >}}) or [Django Channels](https://channels.readthedocs.io/)
    for WebSocket push and event listeners
-   **Java**: [Spring Data Redis](https://spring.io/projects/spring-data-redis) message listener
    containers for inter-service messaging
-   **Ruby**: [Action Cable](https://guides.rubyonrails.org/action_cable_overview.html) Redis
    adapter for Rails WebSocket broadcasting
-   **Go**: [`go-redis`](https://github.com/redis/go-redis) `PubSub` for event listeners and
    cluster-wide notifications
-   **Infrastructure**: [Kong](https://konghq.com/) and [NGINX](https://www.nginx.com/) event
    hooks; Kubernetes cluster-wide event bus via a shared Redis instance

## Code examples to build your own Redis pub/sub broadcaster

The following guides show how to build a simple Redis-backed pub/sub broadcaster.
Each guide includes a runnable interactive demo for each of the following client libraries:

* [redis-py (Python)]({{< relref "/develop/use-cases/pub-sub/redis-py" >}})
* [node-redis (Node.js)]({{< relref "/develop/use-cases/pub-sub/nodejs" >}})
* [go-redis (Go)]({{< relref "/develop/use-cases/pub-sub/go" >}})
* [Jedis (Java)]({{< relref "/develop/use-cases/pub-sub/java-jedis" >}})
* [Lettuce (Java)]({{< relref "/develop/use-cases/pub-sub/java-lettuce" >}})
* [StackExchange.Redis (C#)]({{< relref "/develop/use-cases/pub-sub/dotnet" >}})
* [Predis (PHP)]({{< relref "/develop/use-cases/pub-sub/php" >}})
* [redis-rb (Ruby)]({{< relref "/develop/use-cases/pub-sub/ruby" >}})
* [redis-rs (Rust)]({{< relref "/develop/use-cases/pub-sub/rust" >}})
