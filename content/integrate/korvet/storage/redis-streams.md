---
Title: Redis Streams Storage
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: Korvet uses Redis Streams as its primary storage layer for all messages.
linkTitle: Redis Streams (Local Tier)
weight: 10
---

Korvet uses Redis Streams as its primary storage layer for all messages.

## Why Redis Streams?

- **Low latency**: Sub-millisecond read/write performance
- **Consumer groups**: Built-in support for coordinated consumption
- **Persistence**: AOF and RDB for durability
- **Scalability**: Handle millions of messages per second

## Stream Structure

In **Redis-only** mode (the default), each topic partition maps to a single Redis Stream. When **tiered
storage** is enabled for the topic (`remote.storage.enable=true`), the partition is instead split into
**segment** streams that seal and roll over as they fill.

For the exact stream-key patterns, segment keying, and record field layout, see
Redis Data Structures.

### Segments (tiered storage only)

Segments apply only to topics with tiered storage enabled; Redis-only topics use the single
per-partition stream described above.

A tiered partition starts with a single open segment (`segmentId` `0`). The storage worker seals the
open segment and opens the next one (`1`, `2`, ...) when the open segment reaches its message-count
limit or its configured age. Sealing into discrete segments enables:

- **Efficient retention**: Drop entire sealed segments when data expires
- **Archival**: Offload sealed segments to remote storage without blocking writes to the open segment
- **Memory tiering with Redis Flex**: Because each segment is a separate stream key, [Redis Flex (Auto Tiering)](https://redis.io/docs/latest/operate/rs/databases/auto-tiering/) can keep the open segment hot in RAM while transparently demoting colder sealed segments to flash/SSD — a **warm** tier between RAM and the remote object store. This is handled by Redis and needs no Korvet configuration.

## Write Behavior

A few local-tier write specifics worth knowing:

- The broker assigns each stream entry ID (a timestamp-based `timestamp-sequence` value); it is **not** the `*` auto-generated ID.
- The `XADD` call sets only the entry ID and carries no retention arguments — retention is applied separately by the storage worker (see [Retention Policies](#retention-policies)).
- Null versus empty (for example a `null`-value tombstone versus an empty value) is encoded by stream-field **presence**: a field is omitted when its component is absent and present-but-empty when the component is a zero-length array.

The record field layout itself is documented in Redis Data Structures.

## At-Rest Compression

Korvet can compress the `value` field before writing it to Redis. The codec is set per topic via
`storage.compression.type`, falling back to the server-level `korvet.storage.local.compression.codec`
(default `none`). The default stores values uncompressed and directly readable by non-Kafka clients.
When a codec is used, the value is written as that codec's
**standard frame format** with no Korvet-specific marker prefixed (`gzip`, the
[LZ4 frame](https://github.com/lz4/lz4/blob/dev/doc/lz4_Frame_format.md), the
[Snappy framing format](https://github.com/google/snappy/blob/main/framing_format.txt), or a `zstd`
frame), so a non-Kafka client can decompress the field with any stock decompressor for that codec —
knowing only the topic's codec.

`storage.compression.type` is fixed at topic creation. Because the stored value carries no codec marker,
the effective codec is pinned at creation: a topic that does not set its own `storage.compression.type`
snapshots the server-level default into its config, so a later change to the server default never
reinterprets a topic's already-written values.

Supported codecs are `none`, `gzip`, `snappy`, `lz4`, and `zstd`. Use `none` when values must stay
directly readable from Redis with `XRANGE` or when payloads are small, random, or already compressed.
For JSON, logs, telemetry, and other repetitive text payloads, start with `zstd` for the best storage
reduction. Use `snappy` when CPU headroom is tighter and you want the lowest codec cost with good
compression.

Compression is a trade-off, not a free win: produce pays the compression cost before `XADD`, and
fetch pays the decompression cost after `XREAD`. For compressible payloads, smaller stored values
can more than offset that CPU cost because Redis writes and reads less data.

The following local benchmark uses a batch of 1,000 JSON records, each 1 KiB before compression.
Write latency is `compress 1,000 records + one pipelined batch of 1,000 XADD commands`; read latency
is `XREAD COUNT 1000 + decompress 1,000 records`. Values are median batch latencies from a local
Redis instance and are intended as directional guidance, not end-to-end broker latency.
The compressed write and read paths are faster in this JSON workload because the reduced Redis I/O
more than pays for codec CPU time.

| Codec | Stored size | Total write latency | Write change vs none | Total read latency | Read change vs none |
|---|---|---|---|---|---|
| `none` | 100% | 29 ms | baseline | 7 ms | baseline |
| `lz4` | 30% | 15 ms | 48% lower | 5 ms | 34% lower |
| `snappy` | 31% | 13 ms | 57% lower | 4 ms | 48% lower |
| `zstd` | 22% | 10 ms | 64% lower | 4 ms | 49% lower |
| `gzip` | 23% | 15 ms | 49% lower | 5 ms | 36% lower |

For JSON-like payloads around this size, `snappy` is the lowest-CPU choice, while `zstd` stores the
least data and produced the lowest total write/read batch latency in this run. For small, random, or
already-compressed payloads, compression can add CPU cost without reducing Redis I/O enough to pay
for it; leave those topics uncompressed.

{{< note >}}
At-rest compression is independent of Kafka protocol compression (`compression.type`). At-rest compression applies to data stored in Redis, while protocol compression applies to data in transit between Kafka clients and Korvet.
{{< /note >}}

## Retention Policies

Korvet enforces retention with a background storage worker that issues `XTRIM`, not at produce time:

- **`retention.ms`**: Time-based retention (default: 7 days)
- **`retention.bytes`**: Size-based retention (default: unlimited)
- **`compression.type`**: Compression type for fetch responses (none, gzip, snappy, lz4, zstd)

### How Retention Works

A leader-locked background storage worker periodically trims each stream with `XTRIM`:

- **Count-based** (`retention.bytes`): `XTRIM <streamKey> MAXLEN <count>`. The byte limit is converted to a message count by dividing by the topic's measured average message size (falling back to 1024 bytes when no measurement exists yet).
- **Time-based** (`retention.ms`): `XTRIM <streamKey> MINID <minTimestamp>`, where `minTimestamp` is the current time minus `retention.ms`.

```bash
# Count-based trim
XTRIM korvet:storage:local:my-topic:0 MAXLEN 1000

# Time-based trim (keep messages newer than minTimestamp)
XTRIM korvet:storage:local:my-topic:0 MINID 1234567890000
```

{{< note >}}
- Retention is enforced by the background storage worker, not at produce time. `XADD` carries no retention arguments.
- `XTRIM` uses exact trimming (no `~` / `LIMIT`) for predictable retention behavior.
- Size-based retention (`retention.bytes`) is converted to a message count using the topic's measured average message size.
{{< /note >}}

### Configuring Retention

Set retention when creating topics via Kafka Admin API:

**Example: Create topic with retention configuration**

```java
Properties props = new Properties();
props.put("bootstrap.servers", "localhost:9092");

AdminClient admin = AdminClient.create(props);
NewTopic topic = new NewTopic("my-topic", 3, (short) 1);
topic.configs(Map.of(
    "retention.ms", "86400000",      // 1 day
    "retention.bytes", "1073741824", // 1 GB
    "compression.type", "lz4"        // Compress fetch responses with LZ4
));
admin.createTopics(List.of(topic));
```

Or configure defaults in `application.yml` via a catch-all pattern:

```yaml
korvet:
  topics:
    - name: "*"
      retention-time: 7d
      retention-bytes: 10GB
      compression: lz4
```

### Manual Trimming

For manual stream management, use Redis's `XTRIM` command:

```bash
# Trim by count (keep last 1000 messages)
XTRIM korvet:storage:local:my-topic:0 MAXLEN 1000

# Trim by age (keep messages newer than the given timestamp)
XTRIM korvet:storage:local:my-topic:0 MINID <timestamp-in-ms>
```

## Performance Tuning

### Async Operations

Korvet uses asynchronous Redis operations for maximum throughput:

- All Redis commands use Lettuce's async API (`RedisFuture`)
- Operations return `CompletableFuture` to avoid blocking
- Multiple operations execute in parallel
- Netty event loop threads remain non-blocking

**Benefits:**

- Higher throughput with fewer threads
- Better resource utilization
- Reduced latency under load

### Pipelining

Korvet automatically batches Redis operations using Lettuce's command pipelining:

- Multiple commands are batched together
- `setAutoFlushCommands(false)` delays command execution
- `flushCommands()` sends all commands in a single network round-trip
- Significantly improves throughput for high-volume producers

**Example:** Producing 1000 messages sends 1000 `XADD` commands in a single pipeline instead of 1000 round-trips.

- Configurable pool size based on workload

### Compression Types

Korvet supports two types of compression:

#### 1. At-Rest Compression

Compresses the stored record value at rest in Redis Streams:

- **Where**: Applied to the `value` field in Redis Streams
- **When**: At write time (produce) and read time (fetch)
- **Configuration**: Per topic via `storage.compression.type` (create-time only), falling back to the server-level `korvet.storage.local.compression.codec` (default `none`). The effective codec is pinned at topic creation. Set a topic to `none` to keep values directly readable by non-Kafka clients.
- **Use case**: Reduce Redis memory usage for large or repetitive data

**How it works:**

- Producer writes: The value is compressed before storing in Redis, as the topic codec's standard frame format with no Korvet-specific marker
- Consumer reads: The value is decompressed when fetching from Redis
- The codec is pinned per topic at creation, so the value field is always a plain standard frame a non-Kafka client can decompress with any stock decompressor for that codec
- Transparent to Kafka clients - they receive uncompressed data
- Independent of Kafka protocol compression

**Benefits:**

- Reduces Redis memory usage
- Lower storage costs
- Faster Redis persistence (smaller AOF/RDB files)
- No impact on Kafka client compatibility

See [At-Rest Compression](#at-rest-compression) for configuration details.

#### 2. Protocol Compression (Kafka Standard)

Compresses Kafka protocol messages between clients and Korvet:

- **Where**: Applied to Kafka Fetch/Produce request/response payloads
- **When**: During network transmission
- **Configuration**: `compression.type` topic config (none, gzip, snappy, lz4, zstd)
- **Use case**: Reduce network bandwidth between Kafka clients and Korvet

**How it works:**

- **Producer side**: Kafka clients can send compressed or uncompressed batches; Korvet decompresses them before storing
- **Consumer side**: Korvet compresses fetch responses based on topic's `compression.type` configuration
- **Storage**: Messages are stored uncompressed in Redis (unless at-rest compression is enabled)

**Benefits:**

- Reduces network bandwidth for fetch responses
- Transparent to clients - works with all Kafka clients
- Flexible per-topic configuration
- Standard Kafka feature

#### Compression Comparison

| Feature | At-Rest Compression | Protocol Compression |
|---|---|---|
| **Purpose** | Reduce Redis memory usage | Reduce network bandwidth |
| **Applied at** | Redis storage layer | Kafka protocol layer |
| **Configuration** | `korvet.storage.local.compression.codec` | `compression.type` |
| **Affects** | Redis memory, persistence | Network traffic |
| **Transparent to** | Kafka clients | Storage layer |
| **Recommended for** | JSON/log payloads with `zstd`; CPU-sensitive topics with `snappy` | High-throughput consumers |

{{< tip >}}
You can use both types of compression together! For example, set `korvet.storage.local.compression.codec=zstd` to save Redis memory for JSON/log topics and `compression.type=lz4` for fast network compression.
{{< /tip >}}

See [Compression]({{< relref "/integrate/korvet/kafka-api/compatibility#compression" >}}) for protocol compression configuration details.

## Next Steps

- [Monitoring]({{< relref "/integrate/korvet/operations/monitoring" >}})
- [Configuration Reference]({{< relref "/integrate/korvet/reference/configuration" >}})
