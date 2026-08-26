---
Title: Tiered Storage
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: Korvet stores all messages in Redis Streams (the local tier) and can
  optionally archive older data to Apache Iceberg tables on an object store (the
  remote tier).
hideListLinks: false
linkTitle: Tiered Storage
weight: 40
---

Korvet stores all messages in Redis Streams (the local tier) and can optionally archive older data to Apache Iceberg tables on an object store (the remote tier) for cost-efficient long-term retention. This section covers both tiers and how data moves between them. For the foundational storage model, see [Concepts & Architecture]({{< relref "/integrate/korvet/concepts" >}}); for the exact Redis key layout, see Redis Data Structures.

## Storage Architecture

Korvet supports two storage configurations:

### Redis-Only Storage (Default)

The default configuration uses Redis Streams exclusively:

- **Primary storage**: All messages stored in Redis Streams
- **Persistence**: Redis AOF and RDB for durability
- **Consumer groups**: Built-in support for coordinated consumption
- **Performance**: Sub-millisecond read/write latency
- **Retention**: Configurable time and size-based retention (applied by the background storage worker via `XTRIM`)

This is the recommended configuration for most use cases.

### Tiered Storage (Local → Remote)

For long-term data retention and cost optimization, Korvet can be configured with tiered storage.
Because a tiered partition is split into fixed-size **segments** (see [How It Works](#how-it-works)), the data
naturally spans three temperature tiers:

- **Hot tier (RAM)**: The current **open** segment lives in Redis memory and receives all writes, giving sub-millisecond produce and fetch latency.
- **Warm tier (flash/disk)**: Sealed segments that are still within the local retention window. With [Redis Flex (Auto Tiering, formerly Redis on Flash)](https://redis.io/docs/latest/operate/rs/databases/auto-tiering/), Redis transparently keeps these colder sealed segments on SSD/flash while keeping the hot working set in RAM — no Korvet configuration required. Without Redis Flex, sealed segments simply remain in RAM until they are offloaded or expire.
- **Cold tier (object store)**: Offloaded sealed segments archived to Apache Iceberg tables (one per topic) on S3 (or any Iceberg-supported object store / Hadoop-compatible filesystem).

Key points:

- **Automatic archival**: The built-in storage worker continuously offloads sealed segments from the local tier (hot/warm) to the cold tier.
- **Transparent to Redis Flex**: Segmentation is what makes the hot/warm split work — each sealed segment is a separate Redis Stream key, so Redis Flex can demote whole segments to flash based on access patterns.
- **High throughput**: Achieves 100k+ messages/second to S3 with parallel streams.

## How It Works

### Redis-Only Storage

1. **Produce**: Messages are written to Redis Streams using `XADD`
2. **Retention**: A background storage worker applies retention policies using `XTRIM` (`MAXLEN` for count/byte limits, `MINID` for time limits)
3. **Consume**: Consumers read messages using `XREAD` (standalone) or `XREADGROUP` (consumer groups)
4. **Persistence**: Redis handles durability through AOF/RDB snapshots

### Tiered Storage

A topic partition is treated as a sequence of fixed-size **segments**. Segmentation is not specific to
tiered storage: every newly created topic is segmented by default (see `segment.bytes` / `segment.ms` in
[Topics]({{< relref "/integrate/korvet/kafka-api/topics" >}})), regardless of whether `remote.storage.enable` is set. The only
exception is compacted topics, which keep a single-stream layout. In a Redis-only deployment the segments
simply stay in Redis; tiered storage adds offloading on top.

With tiered storage, the newest segment (the **open** segment) lives in Redis and receives all writes; older
sealed segments are offloaded to the remote tier and dropped from Redis once local retention expires. Reads
are served transparently across all tiers, so a consumer never sees the tier boundary.

{{< image filename="images/korvet/tiered-storage.svg" alt="How tiered storage works" >}}

1. **Produce (hot)**: Messages are appended (`XADD`) to the open segment in Redis RAM (hot tier).
2. **Seal (warm)**: When the open segment reaches its configured size or age (`segment.bytes` / `segment.ms`), the storage worker seals it and opens the next one. `segment.bytes` is compared against the segment's **real** stored size (Redis `MEMORY USAGE`), not an estimate. Sealed segments remain in the local tier; with Redis Flex enabled, Redis can demote these colder segments from RAM to flash automatically (warm tier).
3. **Archive (cold)**: The leader-locked storage worker streams sealed segments from Redis into the topic's Apache Iceberg table on the remote object store (cold tier), then marks them offloaded.
4. **Consume**: Consumers read transparently across tiers — the broker reads from local Redis (RAM or flash) or the remote table depending on which segment holds the requested offset.
5. **Cleanup**: After `local.retention.ms`, offloaded segments are dropped from Redis; the total `retention.ms` governs when they are removed from the remote tier.

{{< note >}}
The hot/warm split is handled entirely by Redis Flex and requires no Korvet configuration — Korvet only
distinguishes **local** (Redis) and **remote** (object store) tiers. Segmentation is what lets Redis Flex
operate per-segment: each sealed segment is its own stream key, so the colder ones can live on flash
while the open segment stays in RAM.
{{< /note >}}

### Per-Topic Tiered Storage Configuration

Tiered storage is controlled at the topic level using Kafka-compatible configuration:

- `remote.storage.enable=true` - Enable tiered storage for a topic (Kafka KIP-405)
- `local.retention.ms` - Time to keep in local tier before moving to remote
- `retention.ms` - Total retention across all tiers

Example: 1 hour local, 6 days remote (7 days total):

```bash
kafka-configs --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name my-topic --alter \
  --add-config remote.storage.enable=true,local.retention.ms=3600000,retention.ms=604800000
```

See [Topic Configuration]({{< relref "/integrate/korvet/kafka-api/topics#tiered-storage-configuration" >}}) for full details.

Legacy single-stream topics can be migrated to the segmented layout in place — see
[Migrating a Single-Stream Topic to Segmented Storage]({{< relref "/integrate/korvet/storage/migrate-to-segmented" >}}).

## Storage Layout

Each topic partition maps to a Redis Stream, and each Kafka record is stored as a single stream entry
whose body breaks the record out into separate, directly-readable `value`, `key`, `headers`, and
`timestamp` fields. When tiered storage is enabled, a partition is split into per-segment streams that
are offloaded to the remote tier as they seal. For the exact stream-key patterns, segment keying, and
record field layout, see Redis Data Structures.

## Benefits

- **Performance**: Sub-millisecond latency for local tier operations
- **Simplicity**: Redis-only mode requires no additional infrastructure
- **Reliability**: Redis persistence ensures data durability
- **Scalability**: Handle millions of messages per second
- **Cost optimization**: Optional remote tier reduces storage costs for long-term retention
- **Flexibility**: Choose between simplicity (Redis-only) and cost optimization (tiered)

## Next Steps

- [Redis Streams (Local Tier)]({{< relref "/integrate/korvet/storage/redis-streams" >}})
- [Remote Storage (Apache Iceberg)]({{< relref "/integrate/korvet/storage/remote-storage" >}})
- [Storage Configuration]({{< relref "/integrate/korvet/reference/configuration" >}})
- [Monitoring]({{< relref "/integrate/korvet/operations/monitoring" >}})
