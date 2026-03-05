---
title: Scale Redis Flex on Kubernetes
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Scaling strategies and methods for Redis Flex deployments on Kubernetes.
hideListLinks: true
linkTitle: Scale
weight: 30
---

This guide shows you how to scale Redis Flex databases on Kubernetes to meet changing workload demands.

## Scaling dimensions

Redis Flex supports three scaling dimensions:

| Dimension      | What it addresses     | How to scale                        |
|----------------|-----------------------|-------------------------------------|
| Volume         | Data size             | Increase `memorySize`               |
| Throughput     | Operations per second | Adjust RAM percentage or add shards |
| Infrastructure | Node capacity         | Add nodes to the cluster            |

## Before you scale

Before you scale a Redis Flex deployment:

1. Verify that your cluster has sufficient resources (CPU, memory, Flash storage).
2. For volume scaling, confirm that enough Flash capacity exists across nodes.
3. For infrastructure scaling, provision and add new nodes before you increase database size.

## Scale volume (data size)

To store more data, increase the database `memorySize` in your REDB specification.

When you scale volume:

- Adjust `rofRamSize` proportionally to maintain the same RAM percentage.
- Volume scaling can trigger shard redistribution. Monitor the database during this operation.

## Scale throughput (operations per second)

To increase throughput, use one of these options:

### Option 1: Increase RAM percentage

Allocate more RAM relative to total size by increasing `rofRamSize`. A higher RAM percentage keeps more data in fast memory, which improves throughput.

See [Plan your deployment]({{< relref "/operate/kubernetes/flex/plan" >}}) for details on how RAM percentage affects performance.

### Option 2: Add shards

Increase the number of shards by setting the `shardCount` field to distribute load. Each shard handles a portion of requests in parallel.

## Scale infrastructure (cluster capacity)

To add capacity to the underlying cluster:

1. Update your `RedisEnterpriseCluster` resource to increase the `nodes` count.
2. Apply the configuration:

    ```sh
    kubectl apply -f rec.yaml
    ```

3. Wait for all new pods to reach `Running` status before you scale databases.

## Scaling decision table

Use this table to determine the best scaling approach:

| Goal                 | Recommended action                   |
|----------------------|--------------------------------------|
| Store more data      | Increase `memorySize`                |
| Improve latency      | Increase `rofRamSize` (higher RAM %) |
| Handle more ops/sec  | Add shards or increase RAM %         |
| Add cluster capacity | Add nodes to the REC                 |

## Scaling best practices

- **Scale incrementally**: Make gradual changes and monitor performance.
- **Pre-provision infrastructure**: Add cluster nodes before you scale databases.
- **Monitor during scaling**: Watch for increased latency or errors during operations.
- **Test scaling procedures**: Verify scaling in a non-production environment first.

## Known limitations

- **PVC expansion**: Not supported with `redisOnFlashSpec`. Plan Flash storage capacity upfront.
- **Scaling down**: Reduce database size gradually to avoid data loss.
- **Active-Active**: Redis Flex doesn't support Active-Active databases.

## Next steps

- [Plan your deployment]({{< relref "/operate/kubernetes/flex/plan" >}}): Review sizing guidelines for capacity planning.
- [Redis Flex overview]({{< relref "/operate/kubernetes/flex" >}}): Learn how Redis Flex manages data across RAM and Flash.
