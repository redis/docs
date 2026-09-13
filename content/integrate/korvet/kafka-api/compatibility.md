---
Title: Kafka Compatibility
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: Korvet implements a subset of the Kafka protocol for compatibility with
  existing clients and tools.
linkTitle: Kafka Compatibility
weight: 60
---

Korvet implements a subset of the Kafka protocol for compatibility with existing clients and tools.

## Supported APIs

| API | Status | Notes |
|---|---|---|
| Produce | ✅ Supported | Send messages to topics |
| Fetch | ✅ Supported | Read messages from topics |
| Metadata | ✅ Supported | Topic and partition information |
| ApiVersions | ✅ Supported | Protocol version negotiation |
| Consumer Groups | ✅ Supported | JoinGroup, SyncGroup, Heartbeat, LeaveGroup, OffsetCommit, OffsetFetch |
| Transactions | ❌ Not planned | Use Redis transactions instead |
| Admin API | ✅ Supported | CreateTopics, DeleteTopics, DescribeConfigs, AlterConfigs, IncrementalAlterConfigs, DescribeCluster, ListGroups, DescribeGroups, DeleteGroups |
| Idempotent Producers | ✅ Supported | InitProducerId API for idempotent producer support (non-transactional) |

## Kafka Version Compatibility

Korvet uses the Apache Kafka client library version 3.9.2 and is compatible with Kafka clients from version 2.8.0 and later.

### Client Compatibility

- **Minimum supported client version**: 2.8.0
- **Recommended client version**: 3.9.x
- **Kafka client library**: 3.9.2

Kafka clients are backward compatible, so newer clients (3.x, 4.x) can connect to Korvet without issues.

### Protocol Features

Korvet implements Kafka protocol features equivalent to Kafka 2.8.0+, including:

- Produce API (the version range advertised by the bundled kafka-clients 3.9.2 library)
- Fetch API (v0-v12; capped at v12 for stability)
- Consumer Group Protocol (JoinGroup, SyncGroup, Heartbeat, LeaveGroup)
- Offset Management (OffsetCommit, OffsetFetch)
- Topic Administration (CreateTopics, DeleteTopics)
- Metadata API

## Compression

Korvet supports all Kafka compression types:

- **NONE**: No compression (default)
- **GZIP**: Good compression ratio, higher CPU usage
- **SNAPPY**: Balanced compression and speed
- **LZ4**: Fast compression, lower CPU usage
- **ZSTD**: Best compression ratio, moderate CPU usage

### How Compression Works

Korvet implements server-side compression:

1. **Producer side**: Kafka clients can send compressed or uncompressed batches. Korvet automatically decompresses incoming batches into individual records before storing them.

2. **Consumer side**: When consumers fetch messages, Korvet compresses the response based on the topic's `compression.type` configuration (not the producer's compression setting).

3. **At rest**: The producer's Kafka batch compression is not retained — each record is stored as its own Redis Stream entry. The storage backend may then apply its own configurable at-rest compression to each record's `value` field (`korvet.storage.local.compression.codec`, default `none`), independently of the Kafka `compression.type` used on the wire.

### Configuring Compression

Compression is configured per-topic using the `compression.type` setting:

```bash
# Set compression for a topic (requires Admin API support)
kafka-configs --bootstrap-server localhost:9092 \
  --entity-type topics \
  --entity-name my-topic \
  --alter \
  --add-config compression.type=lz4
```

The default compression type is `NONE`.

### Benefits

- **Network bandwidth**: Compression reduces the amount of data transferred between Korvet and consumers
- **Flexibility**: Different topics can use different compression algorithms based on their data characteristics
- **Compatibility**: Works transparently with all Kafka clients

## Limitations

- **Replication factor**: Always 1 (Redis provides persistence)
- **Transactions**: Not supported
- **Exactly-once semantics**: Not supported (at-least-once delivery)
- **Consumer group membership**: Held in broker memory. Committed offsets are durable in Redis, so after a broker restart `ListGroups` and `DescribeGroups` report groups with committed offsets in the `Empty` state (with no member details) until clients rejoin.

## Client Configuration

Most Kafka client configurations work with Korvet. Some settings are ignored:

- `acks`: Always treated as `acks=1`
- `replication.factor`: Ignored (always 1)
- `min.insync.replicas`: Ignored

## Testing Compatibility

You can test Korvet with your existing Kafka applications by simply changing the `bootstrap.servers` configuration to point to Korvet.

## Next Steps

- [Producing messages]({{< relref "/integrate/korvet/kafka-api/produce" >}})
- [Consuming messages]({{< relref "/integrate/korvet/kafka-api/consume" >}})
