---
Title: Frequently Asked Questions
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: Common questions about Korvet.
linkTitle: FAQ
weight: 40
---

Common questions about Korvet.

## General

### What is Korvet?

Korvet is a Kafka-compatible streaming service backed by Redis Streams, with optional tiered storage to an Apache Iceberg table on an object store for long-term archival.

### Why use Korvet instead of Kafka?

- **Simpler operations**: No ZooKeeper, no partition rebalancing complexity
- **Redis integration**: Leverage existing Redis infrastructure and persistence
- **Low latency**: Sub-millisecond read/write performance with Redis Streams
- **Optional cost optimization**: Tiered storage to object-store Parquet for long-term retention

### Is Korvet production-ready?

Korvet is in active development. The core features are functional:

- ✅ Kafka protocol implementation (Produce, Fetch, Consumer Groups, Admin API)
- ✅ Redis Streams storage with retention policies
- ✅ Async operations for high throughput
- ✅ Metrics and observability
- ✅ Built-in Parquet archival to object store (100k+ msg/s to S3)

## Compatibility

### Which Kafka clients work with Korvet?

Any Kafka client that supports the Kafka protocol should work. Tested clients include:

- Java: kafka-clients
- Python: kafka-python, confluent-kafka-python
- Go: sarama
- Node.js: kafkajs

### What Kafka features are supported?

Supported:

- ✅ Produce API
- ✅ Fetch API
- ✅ Consumer Groups (JoinGroup, SyncGroup, Heartbeat, LeaveGroup, OffsetCommit, OffsetFetch)
- ✅ Topic metadata
- ✅ Admin API (CreateTopics, DeleteTopics, DescribeConfigs, DescribeCluster)
- ✅ Compression (GZIP, SNAPPY, LZ4, ZSTD)

Not supported:

- ❌ Transactions
- ❌ Exactly-once semantics (at-least-once delivery only)

### Can I migrate from Kafka to Korvet?

Yes, but with some considerations:

- Transactions are not supported
- Exactly-once semantics are not supported (at-least-once only)
- You'll need to re-produce historical data or use a migration tool
- Consumer group offsets won't transfer automatically

## Performance

### What throughput can Korvet handle?

Performance depends on your Redis instance and configuration. With async operations and pipelining:

- **Produce**: 50,000+ messages/second per instance (tested up to 170k msg/sec)
- **Fetch**: 100,000+ messages/second per instance (tested up to 313k msg/sec)
- **Latency**: Sub-millisecond p50, 1-3ms p95, <100ms p99

See the [load-testing sample](https://github.com/redis-field-engineering/korvet-dist/tree/main/samples/load-testing) for benchmarking tools.

### How do I scale Korvet?

Korvet is stateless and can be scaled horizontally:

1. Run multiple Korvet instances
2. Put a load balancer in front
3. Clients connect to any instance

### What are the resource requirements?

Minimum:

- **CPU**: 1 core
- **Memory**: 512MB
- **Redis**: 8+

Recommended for production:

- **CPU**: 2-4 cores
- **Memory**: 2-4GB
- **Redis**: Cluster or Enterprise for HA

## Storage

### How long can I keep data in Redis?

As long as your Redis instance has capacity. Configure retention policies (the Kafka-compatible topic config keys `retention.ms` and `retention.bytes`, or the `retention-time`/`retention-bytes` keys on a `korvet.topics` pattern) to trim old messages. Trimming is enforced asynchronously by a leader-locked background storage worker (via Redis `XTRIM`), not at write time.

### What happens when Redis is full?

You have several options:

1. **Increase Redis memory**: Scale up your Redis instance
2. **Configure retention**: Set `retention.ms` or `retention.bytes` to automatically trim old messages
3. **Enable tiered storage**: Configure optional Parquet archival to move old messages to object storage
4. **Redis eviction policies**: Configure Redis eviction (e.g., `allkeys-lru`) as a last resort

### Can I query archived data directly from the object store?

Yes. The remote tier is a standard Apache Iceberg table (Parquet data files plus Iceberg metadata and manifests), so external query engines such as Spark, Trino, Athena, and DuckDB can read it directly. Korvet clients also read archived data transparently through the normal Kafka fetch API — the broker reads from the remote tier on their behalf.

See [Remote Storage]({{< relref "/integrate/korvet/storage/remote-storage" >}}) for configuration details.

### Should I use JSON flattening or RAW storage with compression?

It depends on your data structure and message size:

**Use JSON flattening** (default for JSON objects):

- Shallow JSON with many top-level fields (10+)
- Small messages (<1KB)
- When you need field-level access in Redis
- Varied field values (UUIDs, timestamps, user data)

**Use RAW + storage compression**:

- Deeply nested JSON (>2-3 levels)
- Large messages (>10KB)
- Repetitive data patterns (logs, telemetry)
- Binary formats (Protocol Buffers, Avro)

Start with ZSTD for JSON/log storage efficiency. Use SNAPPY when CPU cost matters more than the last
few percentage points of compression.

**Example:** For log messages with deep nesting, RAW+ZSTD can reduce Redis memory usage by 18x compared to JSON flattening.

See [Value Mapper Selection]({{< relref "/integrate/korvet/storage/redis-streams" >}}#value-mapper-selection) for detailed guidance and performance comparisons.

### How much memory can storage compression save?

Based on production testing with 100KB messages:

- **ZSTD**: Up to 51x compression (100KB → 2KB)
- **LZ4**: Up to 14x compression (100KB → 7KB)
- **GZIP**: Up to 26x compression (100KB → 4KB)
- **SNAPPY**: Up to 10x compression (100KB → 10KB)

Actual compression ratios depend on your data. Repetitive data (logs, structured text) compresses better than random data (images, encrypted data).

{{< tip >}}
Use ZSTD for JSON/log storage efficiency. Use SNAPPY for CPU-sensitive topics that still benefit from compression.
{{< /tip >}}

## Operations

### How do I monitor Korvet?

Korvet exposes metrics via Prometheus and health checks via Spring Boot Actuator. See [Monitoring]({{< relref "/integrate/korvet/operations/monitoring" >}}).

### How do I troubleshoot issues?

1. Check logs (JSON format by default)
2. Review metrics in Prometheus
3. Check health endpoints
4. See [Troubleshooting guide]({{< relref "/integrate/korvet/operations/troubleshooting" >}})

### Can I run Korvet in Kubernetes?

Yes! See [Deployment guide]({{< relref "/integrate/korvet/operations/deployment" >}}) for Kubernetes manifests.

## Development

### How do I contribute to Korvet?

See the [GitHub repository](https://github.com/redis-field-engineering/korvet-dist) for contribution guidelines.

### Where can I report bugs?

File an issue at https://github.com/redis-field-engineering/korvet-dist/issues

### Is there a roadmap?

Check the GitHub issues and project boards for planned features.

## Next Steps

- [Getting started]({{< relref "/integrate/korvet/quick-start" >}})
- [Troubleshooting]({{< relref "/integrate/korvet/operations/troubleshooting" >}})
