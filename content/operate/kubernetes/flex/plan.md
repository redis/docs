---
title: Plan a Redis Flex deployment on Kubernetes
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Hardware requirements, sizing guidelines, and limitations for Redis Flex on Kubernetes.
hideListLinks: true
linkTitle: Plan
weight: 10
---

Review the hardware requirements, sizing guidelines, and known limitations before you deploy Redis Flex.

## Version requirements

Redis Flex requires:

- Redis Enterprise for Kubernetes version 8.0.2-2 or later
- Redis version 8.0 or later

{{<note>}}
Redis 7.4 preview uses Auto Tiering regardless of cluster policy. Upgrade to Redis 8.0 or later to use Redis Flex.
{{</note>}}

## Hardware requirements

### Flash storage requirements

Your SSDs must meet these requirements:

- **Locally attached** to worker nodes in your Kubernetes cluster. Network-attached storage (NAS), storage area networks (SAN), and cloud block storage (like AWS EBS) are not supported.
- **Dedicated** to Redis Flex. Don't share Flash storage with other database components like durability, binaries, or persistence.
- **Formatted and mounted** on the nodes that run Redis Enterprise pods.
- **Provisioned as local persistent volumes**. You can use a [local volume provisioner](https://github.com/kubernetes-sigs/sig-storage-local-static-provisioner) for dynamic provisioning.
- **Configured with a StorageClass** resource with a unique name.

For more information about storage configuration, see [Kubernetes local volumes](https://kubernetes.io/docs/concepts/storage/volumes/#local).

### Flash capacity sizing

Provision Flash capacity that exceeds your total database size. The extra space accounts for:

- Write buffers
- Space amplification
- Operational overhead

### Recommended SSD types

For best performance, use NVMe SSDs:

| SSD type              | Recommendation                 |
|-----------------------|--------------------------------|
| NVMe Gen 5 or Gen 4   | Recommended                    |
| NVMe Gen 3            | Supported (lower performance)  |

## Sizing guidelines

### Shard fundamentals

Redis Flex databases consist of shards—independent data partitions that handle a portion of the dataset and request load. Each shard runs as a self-contained Redis process with dedicated memory, CPU, and Flash resources.

### Recommended shard size

Use these standard building blocks for capacity planning:

- **50 GB per shard**: Standard capacity unit
- **1 vCPU per shard**: Baseline compute allocation

For example, a 1 TB dataset requires 20 shards (20 × 50 GB).

### RAM percentage impact on performance

The RAM-to-Flash ratio directly affects throughput and latency:

- More RAM: Higher throughput and lower latency
- Less RAM: Lower throughput, higher latency, and lower cost

The following table shows expected performance per 50 GB shard with 1 vCPU:

| RAM % | Throughput   | Latency (p99) |
|-------|--------------|---------------|
| 10%   | 5K ops/sec   | ~10 ms        |
| 20%   | 10K ops/sec  | ~6-8 ms       |
| 30%   | 15K ops/sec  | ~5 ms         |
| 40%   | 20K ops/sec  | ~3-4 ms       |
| 50%   | 25K ops/sec  | <3 ms         |

{{<note>}}
These figures assume uniform key distribution and a mixed read/write workload. Actual performance varies based on your data model, command mix, and network latency.
{{</note>}}

### Example: 1 TB deployment

The following table shows aggregate throughput for a 1 TB dataset (20 shards) at different RAM percentages:

| RAM % | Shards | vCPU total | Approx. throughput |
|-------|--------|------------|-------------------|
| 10%   | 20     | 20         | 100K ops/sec      |
| 20%   | 20     | 20         | 200K ops/sec      |
| 30%   | 20     | 20         | 300K ops/sec      |
| 40%   | 20     | 20         | 400K ops/sec      |
| 50%   | 20     | 20         | 500K ops/sec      |

## Module compatibility

### Supported

Redis Flex supports:

- All standard Redis data types
- Redis JSON
- Redis probabilistic data structures (Bloom filters, Count-Min Sketch, Top-K)

### Not supported

Redis Flex doesn't support:

- Redis Query Engine (RQE)
- RedisTimeSeries
- Active-Active databases

## Best practices

### Key and value sizes

- Store small keys and values when possible. Avoid objects larger than 10 KB.
- Large objects reduce performance because the entire value moves between RAM and Flash.
- Keys or values larger than 4 GB can't be stored in Flash and remain in RAM only.

If you attempt to store oversized objects, warnings appear in the Redis logs:

```text
WARNING: key too big for disk driver, size: 4703717276, key: subactinfo:htable
```

### Replication configuration

Enable replication before populating the database with data. If you enable replication after the database is created, recovery can fail because required persistence files might be missing.

### RAM population strategy (Redis 8.2+)

Starting with Redis 8.2, Redis Flex uses utilization-aware RAM population:

- Below 50% utilization: Uses up to 50% of configured RAM for hot data
- Above 50% utilization: Uses RAM and Flash proportionally based on the configured ratio

This strategy delivers a stable performance curve across all utilization levels.

## Known limitations

{{<warning>}}
Redis Flex doesn't support Active-Active databases.
{{</warning>}}

- **PVC expansion**: Not supported with `redisOnFlashSpec`. Don't enable `enablePersistentVolumeResize` in the REC `persistentSpec`.
- **Redis 7.4 preview**: Uses Auto Tiering regardless of cluster policy.
- **Maximum object size**: Keys or values larger than 4 GB remain in RAM only.
- **Flash storage**: Must be locally attached. Network storage isn't supported.

### Deprecated fields

The `flashStorageEngine` field is deprecated. Use `bigStoreDriver` instead.

## Next steps

- [Get started]({{< relref "/operate/kubernetes/flex/get-started" >}}): Configure Redis Flex on your cluster.
- [Scale your deployment]({{< relref "/operate/kubernetes/flex/scale" >}}): Learn scaling strategies.
