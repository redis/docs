---
Title: Production Tuning
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: Guidance for sizing and tuning Korvet for production produce/consume
  workloads.
linkTitle: Production Tuning
weight: 20
---

Guidance for sizing and tuning Korvet for production produce/consume workloads. The defaults are chosen to be safe for small deployments; high-volume or multi-datasource workloads typically need the storage connection pool sized to their partition fan-out.

## Storage connection pool sizing

Korvet writes every record to Redis through a bounded connection pool (`korvet.redis.pool`, or the storage-tier override `korvet.storage.local.redis.pool`). The broker serializes storage writes *per partition*, and each in-flight partition write holds a borrowed connection for the duration of its `XADD`. Connection demand therefore scales with the number of *distinct partitions being produced to concurrently* — not with the raw request rate.

A round-robin producer spreads a single topic across all of its partitions, so the connections in simultaneous demand are roughly:

```
sum(partitions) across all topics actively produced to
  + headroom for metadata reads sharing the same pool (ListOffsets / getStreamInfo)
```

When demand exceeds the pool size, writes queue until they exceed `korvet.redis.pool.max-wait` (default 3s) and fail. Before Korvet 0.17.x these failures surfaced to the client as the non-retriable `UNKNOWN_SERVER_ERROR`, causing producers such as Logstash to *drop* records; they are now surfaced as the retriable `REQUEST_TIMED_OUT` so clients retry instead. Either way, a pool sized below the partition fan-out caps throughput and adds latency, so size it correctly.

**Sizing rule**

{{< note >}}
Set `korvet.redis.pool.size` to at least the sum of partitions across all topics produced to concurrently, plus headroom for metadata reads. For example, a round-robin producer writing to two 8-partition topics drives 16 concurrent partition writes — well above the historical default of 8.
{{< /note >}}

The default pool size is *32*, which comfortably covers a couple of 8-partition topics with metadata headroom. Raise it for larger fan-outs:

```bash
# e.g. ~50 partitions of concurrent produce fan-out + metadata headroom
export KORVET_REDIS_POOL_SIZE=64
export KORVET_REDIS_POOL_MAX_WAIT=3s    # block time before an acquire fails
export KORVET_REDIS_IO_THREADS=8        # Lettuce event-loop threads
```

| Setting | Env var | Notes |
|---|---|---|
| `korvet.redis.pool.size` | `KORVET_REDIS_POOL_SIZE` | Max pooled connections. Floor = sum of concurrent partition writes + metadata headroom. Default 32. |
| `korvet.redis.pool.max-wait` | `KORVET_REDIS_POOL_MAX_WAIT` | Time a write blocks waiting to borrow a connection before failing. Default 3s. |
| `korvet.redis.io-threads` | `KORVET_REDIS_IO_THREADS` | Lettuce event-loop thread pool. Raise alongside the pool on high-core hosts. |

When the message-storage tier uses a dedicated Redis (`korvet.storage.local.redis.*`), size *that* pool to the produce fan-out; `korvet.redis.pool` then carries only metadata and registry traffic. Override fields are sparse — anything unset inherits from `korvet.redis.pool`.

### Confirm before raising

More connections do not help if Redis itself is the bottleneck. Before scaling the pool, confirm the Redis backend has CPU and latency headroom — otherwise additional connections just move the queue from the pool to Redis.

### Metrics to watch

Watch these while tuning (see [Storage metrics]({{< relref "/integrate/korvet/reference/metrics/storage" >}})):

- `korvet.storage.local.pool.pending` — waiters queued for a connection. Sustained non-zero values mean the pool is undersized for the load.
- `korvet.storage.local.pool.acquire` — acquisition latency by result. A rising `timeout` result count is the direct signal that produces are failing on pool acquisition.

## Next Steps

- [Monitoring]({{< relref "/integrate/korvet/operations/monitoring" >}})
- [Troubleshooting]({{< relref "/integrate/korvet/operations/troubleshooting" >}})
- [Configuration Reference]({{< relref "/integrate/korvet/reference/configuration" >}})
