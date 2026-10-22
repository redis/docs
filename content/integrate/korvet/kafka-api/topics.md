---
Title: Topic Management
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: How to create and manage topics in Korvet.
linkTitle: Topic Management
weight: 30
---

This guide covers creating and managing topics in Korvet.

{{< note >}}
Topic defaults — including auto-create — are configured via the pattern list under `korvet.topics`. Each entry's `name` is a glob pattern matched against topic names; entries are evaluated in declared order and combined first-match-wins per field.
{{< /note >}}

## Creating Topics

### Automatic Topic Creation

By default, topics are not automatically created when you first produce to them or request metadata for them.
Auto-creation is configured per pattern under `korvet.topics`:

```yaml
korvet:
  topics:
    - name: "*"
      auto-create: false  # Enable/disable automatic topic creation (default: false)
      partitions: 1       # Default partitions for auto-created topics (default: 1)
```

When auto-creation is disabled, you must explicitly create topics before using them.

### Explicit Topic Creation

You can create topics explicitly with standard Kafka tooling or with the bundled `korvet` CLI.

#### Using `korvet topics`

`korvet topics` mirrors `kafka-topics` syntax. It is a thin wrapper over the Kafka AdminClient
and passes `--config key=value` pairs through verbatim. The only Korvet-specific topic config is
`offset.sequence.bits`; all other accepted keys are standard Kafka topic configs such as `retention.ms`
and `segment.ms`.

```bash
korvet topics --bootstrap-server localhost:9092 \
  --create \
  --topic my-topic \
  --partitions 3 \
  --config retention.ms=604800000 \
  --config offset.sequence.bits=14 \
  --config segment.ms=3600000
```

{{< note >}}
The `korvet topics create` command does not accept `--replication-factor`, as Korvet uses Redis for storage and replication. The upstream `kafka-topics` tool still requires it (see below).
{{< /note >}}

#### Using `kafka-topics`

Upstream Kafka CLI tooling works for standard Kafka topic configs:

```bash
kafka-topics --bootstrap-server localhost:9092 \
  --create \
  --topic my-topic \
  --partitions 3 \
  --replication-factor 1
```

#### Creating Topics with the `offset.sequence.bits` Configuration

{{< warning >}}
The upstream **`kafka-topics` CLI** performs client-side validation and rejects the Korvet-specific `offset.sequence.bits` config with an `Unknown topic config name` error.

Use `korvet topics` (a thin AdminClient wrapper that does not validate config names client-side) when you want to set `offset.sequence.bits`, or use the Kafka AdminClient API directly.
{{< /warning >}}

To set `offset.sequence.bits` with upstream Kafka tooling, use the Kafka AdminClient API, which does **not** perform client-side validation:

```java
Properties props = new Properties();
props.put(AdminClientConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");

try (AdminClient admin = AdminClient.create(props)) {
    NewTopic topic = new NewTopic("my-topic", 3, (short) 1);
    topic.configs(Map.of(
        "offset.sequence.bits", "14",
        "retention.ms", "604800000"
    ));
    admin.createTopics(List.of(topic)).all().get();
}
```

**Accepted topic configurations:**

The broker accepts only the following topic config keys. Any other key (including `value.type` and `storage.compression`) is rejected with `INVALID_CONFIG` ("Unknown or unsupported topic config").

- `retention.ms` - Total time-based retention in milliseconds (across all tiers)
- `retention.bytes` - Total size-based retention in bytes
- `segment.ms` - Duration of each local stream bucket in milliseconds. Must be positive and less than the effective local retention window. Newly created topics default to `86400000` (1 day); the default is applied only when it fits within the effective retention (otherwise the topic rolls on `segment.bytes` alone). Compacted topics keep a single-stream layout and are not segmented.
- `segment.bytes` - Size of each local stream bucket in bytes. Newly created topics default to `134217728` (128 MiB). Compacted topics keep a single-stream layout and are not segmented. Adding `segment.bytes` (or `segment.ms`) to a legacy single-stream topic migrates it to the segmented layout in place — see [Migrating a Single-Stream Topic to Segmented Storage]({{< relref "/integrate/korvet/storage/migrate-to-segmented" >}}).
- `compression.type` - Compression for Kafka fetch responses (`none`, `gzip`, `snappy`, `lz4`, `zstd`). Default: `none`
- `cleanup.policy` - `delete` (retention-based trimming, the default), `compact` (key-based log compaction), or `compact,delete` (both). See [Log Compaction](#log-compaction).
- `message.timestamp.type` - Which timestamp Korvet reports for records on this topic: `CreateTime` (default) reports the producer-supplied creation time; `LogAppendTime` reports the broker append time (the millisecond component of the Redis Stream entry ID). See [Record Timestamps](#record-timestamps).
- `log.append.timestamp.header` - When `true`, every record in fetch responses gets an additional `korvet.log.append.timestamp.ms` header carrying the broker append time, leaving the record's own timestamp untouched. Default: `false`. Available since v0.18.0. See [Record Timestamps](#record-timestamps).
- `offset.sequence.bits` - Bits reserved for the per-millisecond sequence component in Korvet offsets. Range: `1`-`16`. Default: `14`. Settable only at topic creation; cannot be altered.
- `storage.compression.type` - Codec for compressing the record value at rest in Redis (`none`, `gzip`, `snappy`, `lz4`, `zstd`). Unset inherits the server-level `korvet.storage.local.compression.codec` (default `none`). Use `zstd` for JSON/log storage efficiency, `snappy` when CPU cost matters more, and `none` when non-Kafka clients must read values directly with `XRANGE`. Settable only at topic creation; cannot be altered.

**Tiered storage configurations** (when remote storage is enabled at server level):

- `remote.storage.enable` - Enable tiered storage for this topic (Kafka KIP-405). Default: `false`
- `local.retention.ms` - Time to keep in the local tier before Redis data expires. `-2` = use `retention.ms` (Kafka KIP-405)
- `local.retention.bytes` - Size to keep in the local tier before Redis trimming falls back to `retention.bytes`. `-2` = use `retention.bytes` (Kafka KIP-405)

{{< note >}}
At-rest compression of the record value is set per topic via `storage.compression.type` (falling back to the server-level `korvet.storage.local.compression.codec`, default `none`). This is distinct from the Kafka-facing `compression.type`, which only affects fetch-response compression. Prefer `zstd` for JSON/log topics and `snappy` for CPU-sensitive topics.
{{< /note >}}

## Log Compaction

Topics created or altered with `cleanup.policy=compact` (or `compact,delete`) are compacted by key: a background pass on the storage worker periodically deletes every record that has been superseded by a newer record with the same key, keeping only the latest record per key. This supports keyed-state topics such as Schema Registry journals and Kafka Connect config/offset topics, which rebuild their state by replaying a compacted topic.

Because Korvet derives Kafka offsets from Redis stream entry IDs rather than positions, compaction deletes superseded entries in place (`XDEL`): surviving records keep their original offsets, and consumers simply observe offset gaps — the same behavior as Kafka compaction.

Semantics:

- `compact`-only topics ignore `retention.ms`/`retention.bytes`: the head of the log is never trimmed, only superseded keys are removed. `compact,delete` applies both compaction and retention trimming.
- Records produced to a compacted topic must have a key; unkeyed records are rejected with `INVALID_RECORD` (standard Kafka behavior).
- Tombstones (records with a null value) are retained as the latest record for their key so replaying consumers observe deletions. Tombstone purging (`delete.retention.ms`) is not implemented; tombstones are kept indefinitely.
- `min.compaction.lag.ms`/`max.compaction.lag.ms` are not supported; compaction runs at the storage worker's tick interval. Records appended while a compaction pass is running are left for the next pass.
- `cleanup.policy=compact` cannot be combined with `remote.storage.enable=true`: compaction is not supported on tiered topics, and the combination is rejected at create/alter time.

## Record Timestamps

Every record Korvet stores carries a millisecond timestamp, persisted in the `timestamp` field of its Redis Stream entry. Two per-topic settings control how that timestamp is sourced and reported.

### `message.timestamp.type`

- `CreateTime` (default) — the timestamp is the producer-supplied creation time taken from the `ProducerRecord`. It is stored verbatim and returned unchanged to consumers.
- `LogAppendTime` — Korvet reports the broker append time instead: the millisecond component of the Redis Stream entry ID assigned when the record was written. Fetched records carry this value as their timestamp, and produce responses report it in `log_append_time`.

This mirrors Kafka's `message.timestamp.type`. It changes which value consumers see as **the** record timestamp.

### `log.append.timestamp.header`

When set to `true`, Korvet adds a header named `korvet.log.append.timestamp.ms` to every record returned in fetch responses. Its value is the broker append time (the Redis Stream entry ID's millisecond component) as an ASCII-decimal string.

This is additive and independent of `message.timestamp.type`:

- The record's own `timestamp` is left untouched — consumers that ignore the header see no change.
- It lets you expose log-append time **alongside** the producer creation time, without switching the topic to `LogAppendTime`.

The setting defaults to `false` and is available since v0.18.0.

### Consuming the log-append header

Enable the header on the topic first:

```bash
korvet topics --bootstrap-server localhost:9092 \
  --alter --topic logs \
  --config log.append.timestamp.header=true
```

The header value is the broker append time in epoch milliseconds, encoded as an ASCII-decimal string. Consumers must request headers and parse the bytes to a `long`.

#### Java Kafka consumer

```java
import org.apache.kafka.common.header.Header;
import java.nio.charset.StandardCharsets;

for (ConsumerRecord<String, String> record : records) {
    Header header = record.headers().lastHeader("korvet.log.append.timestamp.ms");
    if (header != null) {
        long appendTimeMs = Long.parseLong(new String(header.value(), StandardCharsets.US_ASCII));
        // record.timestamp() is still the producer CreateTime;
        // appendTimeMs is when Korvet wrote it to Redis.
    }
}
```

#### Python (kafka-python)

```python
consumer = KafkaConsumer("logs", bootstrap_servers="localhost:9092")
for msg in consumer:
    headers = dict(msg.headers)  # list of (key, value-bytes) tuples
    raw = headers.get("korvet.log.append.timestamp.ms")
    append_time_ms = int(raw.decode("ascii")) if raw else None
```

#### Spark Structured Streaming

Spark exposes Kafka headers as an `array<struct<key:string,value:binary>>` column, but only when `includeHeaders` is enabled on the source. Pick out the header by key, cast its bytes to a string, then to a `bigint`, and convert to a timestamp:

```python
kafka_df = (
    spark.readStream.format("kafka")
    .option("kafka.bootstrap.servers", "korvet:9092")
    .option("subscribe", "logs")
    .option("includeHeaders", "true")   # required to read headers
    .option("startingOffsets", "earliest")
    .load()
)

events = kafka_df.select(
    col("value").cast("string").alias("value"),
    col("timestamp").alias("producer_create_time"),  # CreateTime from the record
    col("headers"),
).withColumn(
    "korvet_append_time",
    expr(
        "timestamp_millis(CAST(get(transform("
        "filter(headers, h -> h.key = 'korvet.log.append.timestamp.ms'), "
        "h -> CAST(h.value AS STRING)), 0) AS BIGINT))"
    ),
).drop("headers")
```

`filter(...)` selects the matching header, `transform(...)` decodes its binary value to a string, `get(..., 0)` takes the first match, and `timestamp_millis(...)` turns the epoch-millis `bigint` into a Spark `timestamp`. With both `producer_create_time` and `korvet_append_time` in hand you can compute ingest latency, e.g. `unix_millis(korvet_append_time) - unix_millis(producer_create_time)`.

{{< tip >}}
A complete, runnable pipeline (Logstash → Korvet → Spark → Delta/S3) that uses this exact expression to measure end-to-end latency lives in `samples/logstash-spark-s3/spark_consumer.py`.
{{< /tip >}}

## Listing Topics

List all topics:

```bash
kafka-topics --bootstrap-server localhost:9092 --list
```

## Describing Topics

Get details about a topic:

```bash
kafka-topics --bootstrap-server localhost:9092 \
  --describe \
  --topic my-topic
```

## Deleting Topics

Delete a topic:

```bash
kafka-topics --bootstrap-server localhost:9092 \
  --delete \
  --topic my-topic
```

## Altering Topic Configuration

Topics can be configured with:

- **Partitions**: Number of partitions for parallelism (set during creation only)
- **Retention**: Time-based (`retention.ms`) and size-based (`retention.bytes`) retention policies
- **Protocol Compression**: Compression for Kafka fetch responses (`compression.type`)
- **At-Rest Compression**: Codec for the record value stored in Redis (`storage.compression.type`, create-time only)
- **Offset Encoding**: Per-topic offset sequence width (`offset.sequence.bits`, create-time only)
- **Bucketing**: Time-bucketed local streams (`segment.ms`, `segment.bytes`)

### Using kafka-configs CLI

Use `korvet topics --alter` or `kafka-configs` to alter topic configurations.

```bash
korvet topics --bootstrap-server localhost:9092 \
  --alter \
  --topic my-topic \
  --config retention.ms=604800000 \
  --config segment.ms=1800000
```

```bash
kafka-configs --bootstrap-server localhost:9092 \
  --entity-type topics \
  --entity-name my-topic \
  --alter \
  --add-config retention.ms=604800000,compression.type=lz4
```

{{< note >}}
`offset.sequence.bits` cannot be altered after topic creation; it is settable only at creation time.
{{< /note >}}

### Using AdminClient API

Alternatively, use the AdminClient API:

```java
ConfigResource topicResource = new ConfigResource(ConfigResource.Type.TOPIC, "my-topic");
List<AlterConfigOp> ops = List.of(
    new AlterConfigOp(new ConfigEntry("retention.ms", "604800000"), AlterConfigOp.OpType.SET),
    new AlterConfigOp(new ConfigEntry("compression.type", "lz4"), AlterConfigOp.OpType.SET)
);
admin.incrementalAlterConfigs(Map.of(topicResource, ops)).all().get();
```

See [Redis Streams storage]({{< relref "/integrate/korvet/storage/redis-streams" >}}) for details on how records are stored.

### Describing Topic Configuration

View current topic configuration using `korvet topics --describe` or `kafka-configs --describe`:

```bash
korvet topics --bootstrap-server localhost:9092 \
  --describe \
  --topic my-topic
```

```bash
kafka-configs --bootstrap-server localhost:9092 \
  --entity-type topics \
  --entity-name my-topic \
  --describe
```

**Protocol compression types** (`compression.type`):

- `none` - No compression (default)
- `gzip` - Good compression ratio, higher CPU usage
- `snappy` - Balanced compression and speed
- `lz4` - Fast compression, lower CPU usage
- `zstd` - Best compression ratio, moderate CPU usage

{{< note >}}
At-rest compression in Redis is set per topic via `storage.compression.type` (create-time only), falling back to the server-level `korvet.storage.local.compression.codec` (default `none`). It is independent of the Kafka-facing `compression.type`, which only affects fetch-response compression. Prefer `zstd` for JSON/log topics, `snappy` for CPU-sensitive topics, and `none` when non-Kafka clients must read values directly from Redis.
{{< /note >}}

See [Compression]({{< relref "/integrate/korvet/kafka-api/compatibility#compression" >}}) for more details on protocol compression.

## Tiered Storage Configuration

When tiered storage is enabled at the server level, you can configure per-topic retention policies to control when data moves between tiers.

### Configuring Tiered Storage with AdminClient API

Use the AdminClient API to configure tiered storage (since `kafka-configs --alter` is not supported):

```java
NewTopic topic = new NewTopic("my-topic", 3, (short) 1);
topic.configs(Map.of(
    "remote.storage.enable", "true",
    "retention.ms", "31536000000",           // 1 year total
    "local.retention.ms", "86400000"         // 1 day in local tier
));
admin.createTopics(List.of(topic)).all().get();
```

This configures:

- **Local tier**: 1 day (`local.retention.ms=86400000`)
- **Remote tier**: ~364 days (implicit: `retention.ms - local.retention.ms`)
- **Total retention**: 1 year (`retention.ms=31536000000`)

### Tiered Storage Configuration Reference

| Configuration | Default | Description |
|---|---|---|
| `remote.storage.enable` | `false` | Enable tiered storage for this topic (Kafka KIP-405) |
| `local.retention.ms` | `-2` | Time to keep in the local tier before Redis data expires. `-2` = use total `retention.ms` |
| `local.retention.bytes` | `-2` | Size to keep in the local tier before Redis trimming falls back to `retention.bytes`. `-2` = use total `retention.bytes` |
| `retention.ms` | `604800000` | Total retention across all tiers (7 days default) |

{{< note >}}
Remote tier retention is implicit and calculated as `retention.ms - local.retention.ms`. Data is deleted after the total `retention.ms` period.
{{< /note >}}

See [Remote Storage]({{< relref "/integrate/korvet/storage/remote-storage" >}}) for server-level tiered storage configuration.

## Next Steps

- [Producing messages]({{< relref "/integrate/korvet/kafka-api/produce" >}})
- [Consuming messages]({{< relref "/integrate/korvet/kafka-api/consume" >}})
- [Redis Streams storage]({{< relref "/integrate/korvet/storage/redis-streams" >}})
- [Remote Storage (Parquet)]({{< relref "/integrate/korvet/storage/remote-storage" >}})
