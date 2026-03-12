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
- Redis database version 8.2 or later

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

### RAM-to-flash ratio

The RAM-to-flash ratio directly affects throughput and latency:

- More RAM: Higher throughput and lower latency
- Less RAM: Lower throughput, higher latency, and lower cost

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

- Store small keys and values (under 10 KB) when possible. Large objects reduce performance, and objects larger than 4 GB can't be stored in Flash.
- Enable replication before populating the database with data. If you enable replication after the database is created, recovery can fail because required persistence files might be missing.
- Increase RAM percentage if 99th-percentile latency exceeds your target or cache hit rates drop.
- Decrease RAM percentage if memory utilization is high but latency remains stable to lower cost and improve efficiency.
- Re-evaluate the ratio of RAM to Flash periodically as dataset size and access patterns evolve.

## Known limitations

- **Flash storage**: Must be locally attached. Network storage isn't supported.
- **Active-Active**: Not supported with Flex.
- **PVC expansion**: Not supported with `redisOnFlashSpec`. Don't enable `enablePersistentVolumeResize` in the REC `persistentSpec`.
- **Maximum object size**: Keys or values larger than 4 GB remain in RAM only.

### Deprecated fields

The `flashStorageEngine` field is deprecated. Use `bigStoreDriver` instead.

## Next steps

- [Get started]({{< relref "/operate/kubernetes/flex/get-started" >}}): Configure Redis Flex on your cluster.
- [Scale your deployment]({{< relref "/operate/kubernetes/flex/scale" >}}): Learn scaling strategies.
