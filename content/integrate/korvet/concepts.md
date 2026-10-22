---
Title: Concepts & Architecture
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: How Korvet maps Kafka topics, offsets, and consumer groups onto Redis
  Streams primitives.
linkTitle: Concepts & Architecture
weight: 20
---

Korvet is a Kafka-compatible streaming service backed by Redis Streams. This page explains
the core concepts and the high-level architecture: how Kafka topics, offsets, and consumer groups map onto
Redis primitives. If you only need to run or use Korvet, the [Get Started]({{< relref "/integrate/korvet/quick-start" >}})
and [Using the Kafka API]({{< relref "/integrate/korvet/kafka-api" >}}) sections are enough. For the request-by-request implementation
details, see Under the Hood.

## Architecture

Korvet exposes a Kafka-compatible broker interface while persisting data in Redis-backed
storage. At a high level:

- Kafka protocol requests are terminated by the broker.
- Kafka topics and partitions map onto Redis Streams.
- Kafka offsets are translated to and from Redis Stream entry IDs.
- Consumer-group behavior combines broker-side coordination with Redis-native delivery primitives.

{{< image filename="images/korvet/architecture.svg" alt="Architecture Overview" >}}

### Kafka to Redis Model

| Kafka Concept | How Korvet Implements It |
|---|---|
| Topic partition | A Redis Stream |
| Message record (key, value, headers, timestamp) | A single Redis Stream entry |
| Message offset | Encoded from the Redis Stream entry ID — no offset table to maintain |
| Consumer group | A Redis Streams consumer group |
| Committed offsets and topic metadata | Tracked in Redis |

For the exact keys and structures, see Redis Data Structures.

### Design Principles

- **Compatibility**: Maintain full Kafka protocol compatibility so existing clients and tools work unchanged.
- **Statelessness**: Offsets are computed from Redis entry IDs rather than stored in side tables (see [Topics, Partitions, and Offsets](#topics-partitions-and-offsets)).
- **Atomicity**: Use Redis transactions (`MULTI`/`EXEC`) and Lua scripts for atomic operations.
- **Performance**: Leverage pipelining, connection pooling, and caching for high throughput.

## Topics, Partitions, and Offsets

Like Kafka, Korvet organizes messages into topics and partitions:

- **Topic**: A logical stream of messages (e.g., `orders`, `events`).
- **Partition**: A topic is divided into partitions for parallelism; each partition maps to a Redis Stream.
- **Offset**: Each message has a unique, monotonically increasing offset within its partition.

Offsets are **stateless**: rather than maintaining a side table, Korvet encodes the Kafka
offset directly from the Redis Stream entry ID (`{timestamp}-{sequence}`). This makes offset conversion an
O(1) computation in both directions and requires no extra storage. The number of bits reserved for the
sequence is tunable per topic (`offset-sequence-bits`) to trade write throughput against batch coherence;
see [the configuration reference]({{< relref "/integrate/korvet/reference/configuration" >}}) for defaults and limits, and
Offset Encoding for the exact formula.

## Consumer Groups

Korvet implements Kafka consumer groups on top of Redis Streams native consumer groups:

- **Coordination**: The broker implements the Kafka group coordinator protocol (join, sync, heartbeat, rebalance).
- **Delivery**: Redis Streams consumer groups (`XREADGROUP`) handle per-consumer delivery state.
- **Offset management**: Explicit Kafka commits are tracked in a separate committed-offset store, so consumer
  progress survives restarts.
- **Membership**: Active group membership (members, assignments, generation) is held in broker memory. After a
  broker restart, groups with committed offsets remain visible to admin APIs in the `Empty` state until their
  clients rejoin.

## Message Format

Messages follow the Kafka record format:

- **Key**: Optional message key (byte array).
- **Value**: Message payload (byte array).
- **Headers**: Optional key-value metadata.
- **Timestamp**: Message timestamp.

Each Kafka record is stored as a single Redis Stream entry whose body breaks the record out into separate,
directly-readable `value`, `key`, `headers`, and `timestamp` fields, so a non-Kafka client can read the
payload straight from the stream (for example with `XRANGE`). A field is omitted when its component is
absent. See Redis Data Structures for the exact
layout.

## Next Steps

- [Using the Kafka API]({{< relref "/integrate/korvet/kafka-api" >}}) — produce, consume, and manage topics
- [Tiered Storage]({{< relref "/integrate/korvet/storage" >}}) — local and remote tiers, and how data moves between them
- Under the Hood — request workflows, protocol mapping, and internals
