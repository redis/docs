---
Title: Remote Storage (Apache Iceberg on object store)
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: Korvet includes a built-in storage worker that offloads sealed Redis stream
  segments to Apache Iceberg tables backed by Parquet files on S3.
linkTitle: Remote Storage (Iceberg)
weight: 20
---

Korvet includes a built-in storage worker that offloads sealed Redis stream segments to Apache Iceberg tables backed by Parquet files on S3.

{{< note >}}
In Korvet tiered storage terminology, the **local tier** uses Redis Streams and the **remote tier** is a set of Apache Iceberg tables, one per topic. Korvet uses local/remote in its configuration and APIs.
{{< /note >}}

## Overview

The remote tier holds one Apache Iceberg table per topic, named after the topic with separator characters (`.`, `_`, `:`) rewritten to `_` (topic `orders.created.v1` becomes table `orders_created_v1`). All partitions of a topic share its table. The storage worker:

1. Reads sealed LOCAL segments from each topic-partition's segment metadata in Redis
2. Streams the segment contents from Redis (one page resident at a time) into an Iceberg data file
3. Appends and commits the data file to the Iceberg table, then marks the Redis segment as offloaded
4. Runs in-process as part of the Korvet server; there is no separate archive daemon

Each topic's table is a standard Iceberg table: external query engines (Spark, Trino, Athena, DuckDB, ...) can read it directly. Iceberg manages its own metadata and manifest files under the table location. Each offloaded write commits as one Iceberg append; if the storage worker crashes before the commit, the Redis segment stays sealed-but-not-offloaded and the next scan re-streams the (still untouched) Redis segment.

## Configuration

Enable remote storage by setting `korvet.storage.remote.path` in your `application.yml`:

```yaml
korvet:
  storage:
    remote:
      path: s3://my-bucket/korvet
      s3:
        region: us-west-1
    worker:
      tick-interval: 1m
```

For local development and tests, point the cold tier at a local directory instead of an object store. No `s3.*` settings are needed:

```yaml
korvet:
  storage:
    remote:
      path: file:///var/lib/korvet/cold
```

{{< note >}}
Setting `korvet.storage.remote.path` makes the cold tier available. The leader-locked storage worker is enabled by default and rolls eligible segments, offloads sealed segments, and enforces local and remote retention. Topics are archived only when they also have `remote.storage.enable=true`.
{{< /note >}}

### Storage Properties

| Property | Default | Description |
|---|---|---|
| `korvet.storage.remote.path` | *required* | Cold-tier root URI. Supports `s3://` for object storage and `file://` for a local-filesystem warehouse (useful for local development and tests without MinIO/S3). Iceberg resolves the `FileIO` from the URI scheme. |
| `korvet.storage.remote.s3.region` | *unset* | AWS region for the S3 object store. |
| `korvet.storage.remote.s3.endpoint` | *unset* | Optional endpoint URL for S3-compatible stores such as MinIO or LocalStack. |
| `korvet.storage.remote.s3.path-style-access` | *unset* | Use path-style addressing. Required for most non-AWS S3-compatible stores. |
| `korvet.storage.remote.s3.access-key-id` | *unset* | Static access-key id. Prefer IAM roles in production. |
| `korvet.storage.remote.s3.secret-access-key` | *unset* | Static secret access key. Prefer IAM roles in production. |

### Maintenance Properties

| Property | Default | Description |
|---|---|---|
| `korvet.storage.worker.enabled` | `true` | Enables the storage worker in this JVM. |
| `korvet.storage.worker.tick-interval` | `1m` | Tick cadence for the storage worker loop. |
| `korvet.storage.worker.lease-duration` | `2m` | Redis leader-lock lease duration. Must exceed `tick-interval`. |

### Per-Topic Retention Configuration

Control when data moves from the local tier to the remote tier using topic-level configuration:

| Configuration | Default | Description |
|---|---|---|
| `remote.storage.enable` | `false` | Enable tiered storage for this topic (Kafka KIP-405 standard). |
| `local.retention.ms` | `-2` | Time to keep in the local tier. `-2` means use total `retention.ms` (Kafka KIP-405). |
| `local.retention.bytes` | `-2` | Size to keep in the local tier. `-2` means use total `retention.bytes` (Kafka KIP-405). |
| `retention.ms` | `604800000` (7 days) | Total retention across all tiers. |

Remote-tier retention is implicit: `retention.ms - local.retention.ms`.

**Example**: Keep 1 day local and the rest remote (1 year total):

```bash
kafka-configs --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name my-topic --alter \
  --add-config remote.storage.enable=true,retention.ms=31536000000,local.retention.ms=86400000
```

## Storage Format

### Table Layout

The remote tier holds one Iceberg table per topic, under an Iceberg namespace named after
`korvet.namespace` (default `korvet`) so instances sharing a warehouse keep separate tables.
Each table is partitioned by `stream_key`
(identity) — so each topic partition's rows land in their own Iceberg partition — and sorted by
`message_ts`. Iceberg owns the on-disk layout under `korvet.storage.remote.path`: a `metadata/`
directory for table metadata and manifests, plus Parquet data files. Each offloaded segment is written
as one data file named:

```
segment-<segmentId>-<uuid>.parquet
```

The trailing UUID keeps each write unique so a retried offload never collides with a file left by a
prior failed attempt.

### Iceberg Schema

Each row is one message. The hot-tier stream entry is decoded into analytics-friendly columns so external
engines can query the key, value, headers, and timestamps directly. The Iceberg schema is:

```
required STRING                      stream_key;
required LONG                        segment_id;
required STRING                      message_id;
required LONG                        message_ts;
required LONG                        kafka_timestamp;
optional BINARY                      key;
optional BINARY                      value;
optional LIST<STRUCT<                       // headers
           required STRING  header_key,
           optional BINARY  header_value>>;
```

| Column | Type | Description |
|---|---|---|
| `stream_key` | STRING | Local stream key of the source partition (the table partition column). |
| `segment_id` | LONG | Sealed segment number the message came from. |
| `message_id` | STRING | Full Redis stream message id (e.g. `1708956789000-0`). |
| `message_ts` | LONG | Redis stream-id millisecond component (append-time ordering); the table sort key. |
| `kafka_timestamp` | LONG | Producer record timestamp in epoch milliseconds, or `-1` when none was preserved. |
| `key` | BINARY | Record key, decoded from the stream entry. Null when the record has no key. |
| `value` | BINARY | Record value, decoded from the stream entry. Null for a tombstone. |
| `headers` | LIST\<STRUCT\> | Record headers, preserving order and duplicate keys. Each entry has a required `header_key` (STRING) and an optional `header_value` (BINARY). |

### Compression

Data files use Iceberg's default Parquet compression. Row-group and target file sizes are configurable via `korvet.storage.remote.iceberg.row-group-size` and `korvet.storage.remote.iceberg.target-file-size` (both default `128MB`).

## AWS Authentication

The cold tier writes through Iceberg's `S3FileIO`. Configure common S3 settings under `korvet.storage.remote.s3`; otherwise the AWS SDK default credential provider chain is used.

### Credential providers

Common production choices:

| Provider | Use when |
|---|---|
| EC2, ECS, or EKS node roles | Leave static credentials unset and let the AWS SDK use instance metadata. |
| EKS IAM Roles for Service Accounts (IRSA) | Leave static credentials unset. `AWS_ROLE_ARN` and `AWS_WEB_IDENTITY_TOKEN_FILE` are injected into the pod and picked up by the SDK. |
| Static access key + secret | Use `korvet.storage.remote.s3.access-key-id` and `korvet.storage.remote.s3.secret-access-key` for development or S3-compatible stores. |

### IRSA (EKS IAM Roles for Service Accounts)

```yaml
korvet:
  storage:
    remote:
      path: s3://my-bucket/korvet
      s3:
        region: us-east-1
```

When IRSA is configured on the cluster, `AWS_ROLE_ARN` and `AWS_WEB_IDENTITY_TOKEN_FILE` are injected into the pod and picked up automatically.

### IAM role (EC2/ECS/EKS nodes)

```yaml
korvet:
  storage:
    remote:
      path: s3://my-bucket/korvet
      s3:
        region: us-west-1
```

### Static credentials (dev / MinIO)

```yaml
korvet:
  storage:
    remote:
      path: s3://my-bucket/korvet
      s3:
        region: us-west-1
        endpoint: http://localhost:9000
        path-style-access: true
        access-key-id: minioadmin
        secret-access-key: minioadmin
```

## Performance

The storage worker achieves high throughput when archiving to same-region S3:

| Configuration | Throughput | Notes |
|---|---|---|
| Single stream | ~32,000 msg/s | Baseline |
| 4 streams (parallel) | ~115,000 msg/s | Near-linear scaling |

See [Remote Storage Benchmarks]({{< relref "/integrate/korvet/operations/benchmarks#remote-storage-archival-benchmark" >}}) for detailed results.

### Performance tips

- **Same-region S3**: deploy Korvet in the same AWS region as your bucket.
- **Multiple partitions**: archival parallelism is per (topic, partition); more partitions = more archive concurrency.
- **Segment size**: larger sealed segments produce larger Parquet files with better compression and fewer object-store operations.

## Next Steps

- [Storage Overview]({{< relref "/integrate/korvet/storage" >}})
- [Redis Streams (Local Tier)]({{< relref "/integrate/korvet/storage/redis-streams" >}})
- [Remote Storage Benchmarks]({{< relref "/integrate/korvet/operations/benchmarks#remote-storage-archival-benchmark" >}})
- [Kubernetes Deployment]({{< relref "/integrate/korvet/operations/kubernetes" >}})
