---
Title: Benchmarks
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: Performance benchmarks for Korvet with Redis Enterprise as the storage
  backend.
linkTitle: Benchmarks
weight: 110
---

This page documents performance benchmarks for Korvet with Redis Enterprise as the storage backend.

## Optimal Configuration Benchmark

This benchmark demonstrates the best throughput configuration for Korvet with Redis Enterprise.

### Test Environment

- **Redis Enterprise**: 16 shards, running locally
- **Korvet**: Single instance (macOS, Apple Silicon)
- **Kafka Tools**: `kafka-producer-perf-test` from Apache Kafka
- **Topic Configuration**: 16 partitions (1× the number of shards)
- **Record Size**: 1 KB (1024 bytes)
- **Total Messages**: 8,000,000 (1,000,000 per producer)

### Configuration

| Parameter | Value |
|---|---|
| Producers | 8 |
| Batch Size | 1000 messages (1.07 MB) |
| Redis Connection Pool Size | 8 |
| Acks | 1 |
| Compression | none |
| Linger | 0ms |

### Performance Results

| Metric | Value |
|---|---|
| Aggregate Throughput | 380,952 records/sec |
| Throughput (MB/sec) | 372.02 MB/sec |
| Total Messages | 8,000,000 |
| Duration | 21 seconds |
| Average Latency (range) | 249-411 ms |
| 95th Percentile Latency (range) | 657-2136 ms |

### Korvet Resource Usage

| Metric | Value |
|---|---|
| Process CPU | 2.35% |
| System CPU | 20.51% |
| JVM Memory Used | 244.13 MB |

### Redis Enterprise Metrics

| Metric | Value |
|---|---|
| Total CPU (all 16 shards) | 79% |
| Per-Shard CPU | 2-8% |
| Data per Shard | 112-172 MB |
| Data Distribution | Even across all shards |

### Key Findings

- **High throughput with low CPU usage**: Achieved 372 MB/sec with only 2.35% Korvet CPU usage
- **Excellent scalability headroom**: Both Korvet and Redis Enterprise operating well below capacity
- **Even load distribution**: Data and CPU load distributed evenly across all 16 Redis shards
- **Optimal batch size**: 1000 messages per batch provided the best balance of throughput and latency

### Running This Benchmark

To reproduce this benchmark, use the provided benchmark script from the [korvet-dist](https://github.com/redis-field-engineering/korvet-dist) repository:

```bash
git clone https://github.com/redis-field-engineering/korvet-dist.git
cd korvet-dist/samples/benchmark/scripts
./run-comprehensive-benchmark.sh
```

The script will:

1. Start Korvet with the specified Redis pool size
2. Create a topic with 16 partitions
3. Run 8 concurrent producers, each sending 1,000,000 messages
4. Collect metrics from Korvet (via actuator) and Redis Enterprise (via API)
5. Generate a detailed report with throughput, latency, and resource usage

Results are saved to `/tmp/korvet-benchmark-<timestamp>/`.

## Single Shard Benchmark

This benchmark demonstrates Korvet performance with a single Redis shard, providing a baseline for comparison with multi-shard configurations.

### Test Environment

- **Redis Enterprise**: 1 shard (~1 GB maxmemory), running locally
- **Korvet**: Single instance (macOS, Apple Silicon)
- **Kafka Tools**: `kafka-producer-perf-test` from Apache Kafka
- **Topic Configuration**: 1 partition (matching the single shard)
- **Record Size**: 1 KB (1024 bytes)

### Configuration

| Parameter | Value |
|---|---|
| Producers | 1 (baseline) / 8 (concurrent) |
| Batch Size | 1000 messages (1.07 MB) |
| Redis Connection Pool Size | 16 |
| Acks | 1 |
| Compression | none |
| Linger | 0ms |

### Performance Results

#### Single Producer (Baseline)

| Metric | Value |
|---|---|
| Throughput | 151,860 records/sec |
| Throughput (MB/sec) | 148.30 MB/sec |
| Total Messages | 200,000 |
| Average Latency | 160 ms |
| P99 Latency | 329 ms |

#### 8 Concurrent Producers

| Metric | Value |
|---|---|
| Aggregate Throughput | 168,641 records/sec |
| Throughput (MB/sec) | 164.68 MB/sec |
| Total Messages | 674,564 |
| Duration | 4.58 seconds |
| Average Latency (range) | 495-724 ms |
| Memory Used | 776.47 MB |

### Comparison: 16 Shards vs 1 Shard

| Metric | 16 Shards | 1 Shard | Ratio |
|---|---|---|---|
| Database Memory | ~16 GB | ~1 GB | 16× |
| Topic Partitions | 16 | 1 | 16× |
| Throughput (rec/s) | 380,952 | 168,641 | 2.26× |
| Throughput (MB/s) | 372.02 | 164.68 | 2.26× |
| Per-shard throughput | 23,809 | 168,641 | 0.14× |

### Key Findings

- **Single shard achieves ~44% of 16-shard aggregate throughput**: 168,641 vs 380,952 records/sec
- **Higher per-shard efficiency with fewer shards**: A single shard processes 168,641 rec/s vs 23,809 rec/s per shard in the 16-shard setup
- **Memory efficiency**: ~1.15 KB per message in Redis Streams (776 MB for 674,564 messages)
- **Single producer baseline**: 151,860 rec/s provides a clean baseline without concurrency overhead

## Remote Storage Archival Benchmark

This benchmark measures the throughput of archiving sealed Redis stream segments to Apache Iceberg tables on S3.

### Test Environment

- **EC2 Instance**: c5.2xlarge (8 vCPU, 16GB RAM) in us-west-1
- **S3 Bucket**: Same region (us-west-1) for optimal network performance
- **Redis**: Docker container on same instance
- **Message Size**: ~100 bytes (binary payload)
- **Compression**: Iceberg default Parquet compression

### Single Stream Results

Archiving from a single Redis Stream to S3:

| Messages | Archive Time | Throughput | Parquet Files |
|---|---|---|---|
| 1,000,000 | 31.3s | 31,970 msg/s | 100 @ 186ms avg |

### Multi-Stream Results (4 Partitions)

Archiving from 4 Redis Streams in parallel to S3:

| Messages | Archive Time | Throughput | Parquet Files |
|---|---|---|---|
| 1,000,000 | 12.5s | 80,239 msg/s | 100 @ 212ms avg |
| 4,000,000 | 34.7s | 115,347 msg/s | 400 @ 192ms avg |

### Scaling Summary

| Configuration | Throughput | vs Single Stream |
|---|---|---|
| 1 stream | 32k msg/s | baseline |
| 4 streams (1M messages) | 80k msg/s | 2.5× |
| 4 streams (4M messages) | 115k msg/s | 3.6× |

### Key Findings

- **Single stream peaks at ~32k msg/s**: Bottleneck is S3 PUT latency for Parquet files
- **Near-linear scaling with streams**: 4 streams achieves 115k msg/s (3.6× single stream)
- **Parquet writes average ~190ms**: Same-region S3 provides consistent low latency
- **Excellent compression**: SNAPPY on this payload achieves ~50:1 compression ratio (~2 bytes/message stored)
- **Same-region S3 is critical**: Cross-region throughput drops ~50%

### Storage Efficiency

| Metric | Value |
|---|---|
| Messages archived | 4,000,000 |
| S3 objects created | 400 (one Parquet per sealed segment) |
| Total S3 storage | ~8 MB |
| Bytes per message | ~2 bytes (after SNAPPY compression) |
| Compression ratio | ~50:1 |

### Archival Configuration

The storage worker was configured with:

```yaml
korvet:
  storage:
    remote:
      path: s3://your-bucket/korvet
      s3:
        region: us-west-1
    worker:
      enabled: true
```

## Redis Flex (Auto-Tiering) Benchmark

This benchmark evaluates Korvet performance with Redis Flex (Auto-Tiering), which uses NVMe flash storage to extend Redis capacity beyond RAM.

### Test Environment

- **Redis Enterprise**: 1× i4i.xlarge (4 vCPU, 32GB RAM, 937GB NVMe)
- **Database Config**: 100GB capacity, 10GB RAM (10% ratio), 8 shards
- **Korvet Client**: c7i.4xlarge (16 vCPU, 32GB RAM)
- **Kafka Tools**: `kafka-producer-perf-test` from Apache Kafka
- **Record Size**: 1 KB (1024 bytes)
- **Region**: us-west-2 (all instances in same VPC)

### Test Configuration

| Parameter | Value |
|---|---|
| Instance Type (Redis) | i4i.xlarge (NVMe-backed) |
| Instance Type (Client) | c7i.4xlarge |
| Shards | 8 (1.25GB RAM per shard) |
| Redis Pool Size | 256 |
| Producer Batch Size | 128KB (`batch.size=131072`) |
| Linger | 5ms (`linger.ms=5`) |
| Acks | 1 |

### Performance Results

| Metric | Korvet → Redis Flex | Direct Redis (XADD) |
|---|---|---|
| Peak Throughput | 150,784 rec/s (147 MB/s) | 130,690 rec/s (128 MB/s) |
| Sustained Throughput | 110,000 rec/s (107 MB/s) | 103,000 rec/s (100 MB/s) |
| Average Latency | 201 ms | < 1 ms |
| P99 Latency | 510 ms | 28 ms |

### Data Structure Comparison

We compared Redis Streams (XADD) vs simple key-value (SET) operations on Redis Flex:

| Operation | Throughput | Notes |
|---|---|---|
| SET (1KB values) | 153,000 ops/sec | Simple key-value, flash-friendly |
| XADD (Streams, 1KB payload) | 103,000 ops/sec | Stream data structure overhead |
| Korvet → XADD | 110-150k rec/sec | Near-native XADD performance |

### Key Findings

- **Korvet matches native Redis Streams performance**: Korvet achieved 110-150k rec/sec, matching or exceeding direct XADD benchmarks
- **Flash eviction is the bottleneck for sustained writes**: RAM fills faster than NVMe can drain at very high throughput
- **Larger RAM buffers help**: 8 shards (1.25GB RAM/shard) outperformed 48 shards (208MB RAM/shard) by avoiding OOM errors
- **Client instance sizing matters**: Upgraded from t3.medium (2 vCPU) to c7i.4xlarge (16 vCPU) to eliminate client-side bottleneck

### OOM Behavior

At sustained throughput above ~150k rec/sec with 1KB payloads, Redis Flex may return OOM errors when the RAM buffer fills faster than flash eviction can drain. This is inherent to Redis Streams on flash storage, not specific to Korvet.

| Scenario | Throughput | Result |
|---|---|---|
| Burst (1M records) | 150k rec/s | ✅ Success |
| Sustained (2M+ records) | 150k rec/s | ⚠️ OOM after ~1.3M records |
| Sustained (unlimited) | 110k rec/s | ✅ Success |

**Mitigation**: For sustained high-throughput workloads on Redis Flex:

- Use fewer shards with larger RAM buffers (e.g., 8 shards vs 48)
- Increase RAM-to-disk ratio (e.g., 15-20% instead of 10%)
- Throttle producer throughput to ~100k rec/sec per instance
- Use multiple Redis Flex clusters for horizontal scaling

### Sizing Recommendations for Redis Flex

| Workload | Shards | RAM per Shard |
|---|---|---|
| Light (< 50k rec/s) | 4 | 2.5GB |
| Medium (50-100k rec/s) | 8 | 1.25GB+ |
| Heavy (100k+ rec/s) | 8-16 | 1GB+ (with throttling) |

## Configuration Recommendations

For optimal throughput:

- **Batch size**: Use 1000 messages per batch for best balance of throughput and latency
- **Producers**: 8 concurrent producers provides excellent throughput with manageable latency
- **Redis pool size**: Match pool size to number of producers (8) for optimal connection utilization
- **Partitions**: Use 1-2× the number of Redis shards (16 partitions for 16 shards)
- **Redis shards**: Match the number of shards to available CPU cores
- **Rebalance delay**: Configure `korvet.broker.rebalance-delay` appropriately (default 3s) to allow all consumers to join before rebalancing
- **Replication**: Disable replication for write-heavy workloads (if durability requirements allow)

## Running Your Own Benchmarks

### Using the Benchmark Script

The [korvet-dist](https://github.com/redis-field-engineering/korvet-dist) repository contains a script to run benchmarks with various configurations.

```bash
git clone https://github.com/redis-field-engineering/korvet-dist.git
cd korvet-dist/samples/benchmark/scripts
./run-comprehensive-benchmark.sh
```

#### Configuration Options

Edit the script to customize benchmark parameters:

```bash
# Test parameters
TOPIC="benchmark-test"
PARTITIONS=16
RECORD_SIZE=1024
NUM_RECORDS=1000000

# Parameter arrays
PRODUCERS=(8)           # Number of concurrent producers
BATCH_SIZES=(1000)      # Messages per batch
POOL_SIZES=(8)          # Redis connection pool size
```

#### What the Script Does

1. **Starts Korvet** with the specified Redis pool size
2. **Flushes Redis** to ensure clean state
3. **Creates topic** with specified number of partitions
4. **Runs producers** using `kafka-producer-perf-test`
5. **Collects metrics**:
   - Korvet CPU and memory (via Spring Boot Actuator at port 8080)
   - Redis Enterprise CPU and memory (via REST API at port 9443)
   - Producer throughput and latency
6. **Generates report** with detailed results

#### Output

Results are saved to `/tmp/korvet-benchmark-<timestamp>/`:

- `SUMMARY.txt`: Summary table of all test results
- `producers-<N>_batch-<B>msg_pool-<P>.txt`: Detailed results for each test

Example summary output:

```
Producers  Batch(msg)   Pool       Total Msgs      Duration(s)  Throughput(rec/s)  Throughput(MB/s)
8          1000         8          8000000         21           380952             372.02
```

### Running Storage Tier Benchmarks

Korvet ships JUnit-based micro-benchmarks alongside its integration tests. These
run under the Gradle `integrationTest` task (not `test`) and use Testcontainers,
so they require a running Docker engine.

#### Tiered read coordinator benchmark

`RedisTieredGroupReadCoordinatorBenchmark` in the `korvet-storage-tiered-redis`
module measures group-read coordination throughput across a range of batch sizes
against a Redis container. It is gated behind the `korvet.benchmark.pel` system
property so it is skipped during normal test runs:

```bash
./gradlew :korvet-storage-tiered-redis:integrationTest \
  --tests "RedisTieredGroupReadCoordinatorBenchmark" \
  -Dkorvet.benchmark.pel=true
```

{{< note >}}
The remote/S3 archival and end-to-end remote-read numbers reported above
were produced with purpose-built harnesses on EC2. The reusable benchmark
scaffolding for capturing results — `BenchmarkConfig`, `ScenarioResult`, and
`BenchmarkResult` — lives in `korvet-server/src/integrationTest` under
`com.redis.korvet.benchmark`. A packaged, repeatable S3/remote-read benchmark
entry point is planned; the throughput figures in this page should be treated as
illustrative of what the storage tier can achieve rather than as a turnkey test
you can run as-is.
{{< /note >}}

#### Result scaffolding

The `BenchmarkResult` type captures version, Git commit, and environment metadata
alongside per-scenario `ScenarioResult` entries, which makes results
comparable across releases. A captured result is shaped like this:

```json
{
  "korvetVersion": "0.5.0-ea1",
  "timestamp": "2026-03-30T17:30:00Z",
  "gitCommit": "abc1234",
  "environment": {
    "javaVersion": "25",
    "osName": "Linux",
    "availableProcessors": 4,
    "maxMemoryMb": 4096
  },
  "config": {
    "messageCount": 10000,
    "recordSizeBytes": 1024,
    "partitions": 1,
    "iterations": 3,
    "batchSizes": [100, 500, 1000]
  },
  "scenarios": [
    {
      "type": "STANDALONE_CONSUMER",
      "batchSize": 100,
      "avgLatencyMs": 250,
      "p95LatencyMs": 320,
      "throughputMsgPerSec": 400.0
    }
  ]
}
```

#### Interpreting Results

- **Standalone vs Consumer Group overhead**: Consumer group reads include additional coordination (JoinGroup, SyncGroup, OffsetFetch) which adds latency
- **ListOffsets Earliest latency**: High values indicate slow remote-tier metadata lookups (Parquet footer reads against the manifest's oldest REMOTE segment)
- **Throughput scaling**: If throughput doesn't scale linearly with batch size, there may be per-request overhead dominating
- **P95 vs Avg**: Large gaps indicate object-store tail latencies or GC pauses

#### Timeout Recommendations

Based on production experience with S3-backed remote storage, configure consumer timeouts appropriately:

```java
// For remote storage reads, increase timeouts
props.put(ConsumerConfig.REQUEST_TIMEOUT_MS_CONFIG, "60000");  // 60s
props.put(ConsumerConfig.DEFAULT_API_TIMEOUT_MS_CONFIG, "120000");  // 2min
props.put(ConsumerConfig.FETCH_MAX_WAIT_MS_CONFIG, "30000");  // 30s
```
