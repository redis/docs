---
Title: Configuration
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: Configure Korvet using Spring Boot's standard configuration mechanisms.
linkTitle: Configuration
weight: 50
---

Korvet is configured using Spring Boot's standard configuration mechanisms.

## Configuration Files

Configuration can be provided via:

- `application.yml` or `application.properties`
- Environment variables
- Command-line arguments

The examples on this page use YAML, but every property can equally be set as an environment variable (uppercase, `.` and `-` replaced with `_`) or a command-line argument (`--korvet.broker.port=9092`). See [Environment Variables](#environment-variables) below for the env-var equivalents of each example.

## Basic Configuration

```yaml
korvet:
  broker:
    port: 9092
    host: 0.0.0.0
  redis:
    uri: redis://localhost:6379
```

## Redis Configuration

Configure the Redis connection:

```yaml
korvet:
  redis:
    uri: redis://localhost:6379
    username: default
    password: ${REDIS_PASSWORD}
```

You can also embed credentials in the URI:

```yaml
korvet:
  redis:
    uri: redis://username:password@redis.example.com:6379
```

For TLS/SSL connections, use the `rediss://` scheme:

```yaml
korvet:
  redis:
    uri: rediss://redis.example.com:6379
    username: default
    password: ${REDIS_PASSWORD}
```

For clustered Redis deployments:

```yaml
korvet:
  redis:
    uri: redis://node1:6379,node2:6379,node3:6379
    cluster: true
    username: default
    password: ${REDIS_PASSWORD}
```

## Topic Configuration

Configure topic behavior using a list of glob patterns. Patterns are evaluated in declared order and combined first-match-wins per field, so place more specific patterns ahead of a `*` catch-all.

```yaml
korvet:
  topics:
    - name: "order.*"        # Override defaults for topics matching this pattern
      retention-time: 1h
    - name: "*"              # Catch-all defaults
      auto-create: false     # Automatically create matching topics when they don't exist
      partitions: 1          # Default number of partitions
      retention-time: 7d     # Default retention
```

When auto-create is disabled, topics must be created explicitly using the Kafka AdminClient or command-line tools before they can be used.

As environment variables, the list entries are addressed by index in declared order: the example above translates to `KORVET_TOPICS_0_NAME='order.*'`, `KORVET_TOPICS_0_RETENTION_TIME=1h`, `KORVET_TOPICS_1_NAME='*'`, `KORVET_TOPICS_1_AUTO_CREATE=false`, and so on.

## Offset Encoding Configuration

Korvet uses a stateless encoding scheme to convert Redis Stream entry IDs (timestamp-sequence pairs) into Kafka offsets.
The `offset-sequence-bits` setting controls how many bits are allocated for the sequence number portion of the offset.

```yaml
korvet:
  topics:
    - name: "*"
      offset-sequence-bits: 14  # Default: 14 bits
```

### Understanding Offset Encoding

Redis Stream entry IDs have the format `{timestamp}-{sequence}` (e.g., `1732896000000-0`).
Korvet encodes these into Kafka offsets using bit-packing:

```
Kafka offset = (timestamp << offset-sequence-bits) | sequence
```

### When to Change This Setting

The default value of **14 bits** is suitable for most use cases, supporting up to **~16 million messages/second** per partition.

You should consider changing this setting if:

| Scenario | Recommended Value | Maximum Throughput |
|---|---|---|
| **High throughput** (up to 16M msg/sec) | `14` (default) | ~16 million messages/second |
| **Very high throughput** (>16M msg/sec) | `16` | ~65 million messages/second |
| **Standard throughput** (up to 1M msg/sec, smaller offset deltas) | `10` | ~1 million messages/second |
| **Low throughput** (<100K msg/sec, smallest offset deltas) | `8` | ~256,000 messages/second |

### Trade-offs

**Lower values (8-10 bits):**

- ✅ Smaller offset deltas between messages
- ✅ Better compatibility with Kafka clients that have offset delta limits
- ❌ Lower maximum throughput per partition

**Higher values (14-16 bits):**

- ✅ Higher maximum throughput per partition
- ❌ Larger offset deltas between messages from different milliseconds
- ❌ May exceed Kafka's maximum offset delta limit (Integer.MAX_VALUE) for messages far apart in time

### Maximum Offset Delta Constraint

Kafka has a constraint that the offset delta between consecutive messages in a fetch response cannot exceed `Integer.MAX_VALUE` (2,147,483,647).

With different sequence bit settings, messages from different milliseconds have different offset deltas:

| Sequence Bits | Offset Delta/ms | Max Time Span |
|---|---|---|
| 8 bits | 256 | ~97 days |
| 10 bits | 1,024 | ~24 days |
| 14 bits (default) | 16,384 | ~36 hours |
| 16 bits | 65,536 | ~9 hours |

{{< warning >}}
At the default 14 bits (or higher), ensure your consumers fetch messages regularly to avoid exceeding the offset delta limit when messages span more than a few hours.
{{< /warning >}}

### Example Configurations

For a high-throughput logging system:

```yaml
korvet:
  topics:
    - name: "*"
      offset-sequence-bits: 14  # Support up to ~16 million messages/second
```

For a low-throughput event system with long retention:

```yaml
korvet:
  topics:
    - name: "*"
      offset-sequence-bits: 8  # Lower offset delta, supports longer time spans (~256K msg/sec max)
```

## Consumer Group Configuration

Configure consumer group rebalancing behavior:

```yaml
korvet:
  broker:
    rebalance-delay: 3s  # Delay before completing rebalance (default: 3s)
```

The `rebalance-delay` setting controls how long Korvet waits before completing a consumer group rebalance to allow more members to join.
Increase this value for larger consumer groups, especially in Kubernetes environments where pods may start at different times.

## TLS Configuration

Enable TLS for the Kafka protocol endpoint:

```yaml
korvet:
  broker:
    tls: true
    cert-file: /path/to/server.crt
    key-file: /path/to/server.key
    key-password: ${KEY_PASSWORD}
```

## Remote Storage Configuration

Enable tiered storage to archive sealed segments as Parquet files on S3. The cold tier is configured with `korvet.storage.remote.path`; S3 connection options live under `korvet.storage.remote.s3`.

```yaml
korvet:
  storage:
    remote:
      path: s3://my-bucket/korvet
      s3:
        region: us-east-1
```

{{< note >}}
`korvet.storage.remote.path` configures the remote tier. The leader-locked storage worker is enabled by default and rolls eligible segments, offloads sealed segments, and enforces local and remote retention. Topics are archived only when they also have `remote.storage.enable=true`.
{{< /note >}}

For static credentials:

```yaml
korvet:
  storage:
    remote:
      path: s3://my-bucket/korvet
      s3:
        region: us-east-1
        access-key-id: ${AWS_ACCESS_KEY_ID}
        secret-access-key: ${AWS_SECRET_ACCESS_KEY}
```

For LocalStack or MinIO:

```yaml
korvet:
  storage:
    remote:
      path: s3://my-bucket/korvet
      s3:
        region: us-east-1
        endpoint: http://localhost:4566
        path-style-access: true
        access-key-id: test
        secret-access-key: test
```

{{< note >}}
Remote storage is optional. If `korvet.storage.remote.path` is not set, all reads are served from Redis Streams.
{{< /note >}}

See [Remote Storage]({{< relref "/integrate/korvet/storage/remote-storage" >}}) for complete configuration options and per-topic retention settings.

## Redis Metrics Configuration

Korvet can optionally enable Lettuce command latency metrics to track Redis operation performance.

{{< note >}}
These metrics are disabled by default to minimize overhead. Enable them when you need detailed Redis performance monitoring.
{{< /note >}}

```yaml
korvet:
  redis:
    metrics:
      enabled: true  # Enable Lettuce command metrics (default: false)
      histogram: false  # Enable histogram buckets for percentiles (default: false)
      local-distinction: false  # Track per connection vs per host (default: false)
      max-latency: 5m  # Maximum expected latency (default: 5 minutes)
      min-latency: 1ms  # Minimum expected latency (default: 1 millisecond)
```

**Configuration Properties**:

- `enabled`: Enable Lettuce command latency metrics (default: `false`)
- `histogram`: Enable histogram buckets for aggregable percentile approximations (default: `false`)
- `local-distinction`: Track metrics per connection instead of per host/port (default: `false`)
- `max-latency`: Maximum expected latency for histogram buckets (default: `5m`, only applies when `histogram` is enabled)
- `min-latency`: Minimum expected latency for histogram buckets (default: `1ms`, only applies when `histogram` is enabled)

When enabled, Lettuce will publish two timer metrics:

- `lettuce.command.firstresponse` - Time to first response from Redis
- `lettuce.command.completion` - Time to complete Redis command

Each metric includes tags: `command` (e.g., `XADD`, `XREAD`), `local` (if `local-distinction` enabled), and `remote` (Redis server address).

For more details, see [Lettuce Redis Client Metrics]({{< relref "/integrate/korvet/reference/metrics/redis-client" >}}).

## Environment Variables

All configuration can be set via environment variables using Spring Boot's relaxed binding.
Property paths are converted to uppercase with underscores:

```bash
# Broker configuration
export KORVET_BROKER_HOST=0.0.0.0
export KORVET_BROKER_PORT=9092
export KORVET_BROKER_ID=0

# Consumer groups
export KORVET_BROKER_REBALANCE_DELAY=3s

# TLS for the Kafka endpoint
export KORVET_BROKER_TLS=true
export KORVET_BROKER_CERT_FILE=/path/to/server.crt
export KORVET_BROKER_KEY_FILE=/path/to/server.key
export KORVET_BROKER_KEY_PASSWORD=secret

# Redis configuration
export KORVET_REDIS_URI=redis://redis.example.com:6379
export KORVET_REDIS_USERNAME=default
export KORVET_REDIS_PASSWORD=secret
export KORVET_REDIS_CLUSTER=false

# Redis metrics (optional)
export KORVET_REDIS_METRICS_ENABLED=false
export KORVET_REDIS_METRICS_HISTOGRAM=false
export KORVET_REDIS_METRICS_LOCAL_DISTINCTION=false
export KORVET_REDIS_METRICS_MAX_LATENCY=5m
export KORVET_REDIS_METRICS_MIN_LATENCY=1ms

# Topic configuration (pattern-based; entries are addressed by index,
# evaluated in order — index 0 is the catch-all here)
export KORVET_TOPICS_0_NAME='*'
export KORVET_TOPICS_0_AUTO_CREATE=true
export KORVET_TOPICS_0_PARTITIONS=1
export KORVET_TOPICS_0_RETENTION_TIME=7d
export KORVET_TOPICS_0_OFFSET_SEQUENCE_BITS=14

# Remote storage configuration (optional)
export KORVET_STORAGE_REMOTE_PATH=s3://my-bucket/korvet
export KORVET_STORAGE_REMOTE_S3_REGION=us-east-1
# For static credentials, also set:
# export KORVET_STORAGE_REMOTE_S3_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
# export KORVET_STORAGE_REMOTE_S3_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
# For S3-compatible stores such as LocalStack or MinIO, also set:
# export KORVET_STORAGE_REMOTE_S3_ENDPOINT=http://localhost:4566
# export KORVET_STORAGE_REMOTE_S3_PATH_STYLE_ACCESS=true
```

## Next Steps

- [Complete configuration reference]({{< relref "/integrate/korvet/reference/configuration" >}})
- [Deployment guide]({{< relref "/integrate/korvet/operations/deployment" >}})
