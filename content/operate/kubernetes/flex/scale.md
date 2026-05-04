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

This guide shows you how to scale Flex databases on Kubernetes to meet changing workload demands.

## Choose a scaling strategy

Use the following table to determine the best scaling strategy for your Flex deployment:

| Goal | Recommended action |
|------|--------------------|
| Increase data capacity only without adding CPU | [Increase `memorySize` and decrease RAM percentage](#decrease-ram-to-flash-ratio) |
| Increase throughput only | [Add shards and vCPU](#add-shards-or-nodes) |
| Increase data capacity and throughput | [Add shards](#add-shards) |
| Improve latency under higher load | [Increase RAM percentage](#increase-ram-to-flash-ratio) |
| Reduce cost while maintaining performance | [Tune RAM-to-flash ratio](#decrease-ram-to-flash-ratio) |

## Prerequisites

Before you scale a Flex deployment, verify that your cluster has sufficient resources, such as memory, disk, and vCPU.

## Scale volume

If your dataset requires more capacity while maintaining performance, you can prepare a Flex database to store more data using one of the following options:

1. Increase `memorySize` and [add shards](#add-shards).

1. Increase `memorySize` and [decrease the RAM-to-flash ratio](#decrease-ram-to-flash-ratio).

### Add shards

You can add more shards to expand dataset capacity while maintaining the existing RAM-to-flash ratio. Throughput capacity also typically increases as a result of additional shards and infrastructure. This strategy is recommended when the dataset size and traffic are expected to grow together.

Before you increase the dataset capacity and add shards, you need to add more RAM and vCPUs to handle the increased number of shards.

To increase the dataset capacity and shards:

1. Edit your REDB custom resource:

    ```sh
    kubectl edit redb <database-name>
    ```

1. Increase `memorySize` in the `spec` section.

1. Increase `shardCount` in the `spec` section.

1. Save and close the file.

### Decrease RAM-to-flash ratio

You can allocate more data to the flash tier to increase the database capacity while keeping the same amount of RAM, shards, and vCPU. This strategy is recommended when scaling for volume only and SSD resources are underutilized. This increases capacity without adding CPU or RAM but can lower RAM hit-rate and increase p99 latency; monitor metrics before and after the change.

To increase the dataset capacity and decrease the RAM-to-flash ratio:

1. Edit your REDB custom resource:

    ```sh
    kubectl edit redb <database-name>
    ```

1. Increase `memorySize` in the `spec` section.

1. Decrease `rofRamSize` in the `redisOnFlashSpec` section.

1. Save and close the file.

## Scale throughput

If your workload's read/write rate increases and latency starts to rise, you can prepare the database to handle more traffic using one of the following strategies:

1. [Add shards or nodes](#add-shards-or-nodes).

1. [Increase the RAM-to-flash ratio](#increase-ram-to-flash-ratio).

### Add shards or nodes

You can add more shards or nodes to distribute traffic and increase throughput without changing the RAM-to-flash ratio. Dataset size capacity also typically increases as a result of additional shards and infrastructure. This strategy is recommended when the dataset size and traffic are expected to grow together.

Before you add shards or nodes, you need to add more RAM and vCPUs to handle the increased number of shards or nodes. This increases capacity and potential throughput but requires more RAM, vCPUs, and a rebalance operation.

To add shards:

1. Edit your REDB custom resource:

    ```sh
    kubectl edit redb <database-name>
    ```

1. Increase `shardCount` in the `spec` section.

1. Save and close the file.

To add nodes to the cluster, increase the `nodes` count in your RedisEnterpriseCluster (REC) custom resource:

```sh
kubectl edit rec <cluster-name>
```

### Increase RAM-to-flash ratio

To improve throughput and lower latency, you can expand the in-memory tier to serve a higher proportion of requests directly from RAM. This strategy is recommended when low latency is your primary goal and you don't need to increase the dataset size.

Before increasing the RAM-to-flash ratio, you might need to add more nodes to accommodate additional RAM. This improves throughput and lowers latency by serving more requests from RAM, at the cost of higher RAM usage.

To increase the RAM-to-flash ratio:

1. Edit your REDB custom resource:

    ```sh
    kubectl edit redb <database-name>
    ```

1. Increase `rofRamSize` in the `redisOnFlashSpec` section.

1. Save and close the file.

## Scale infrastructure

You can increase or adjust the underlying resources supporting the database, such as CPU, memory, and disk.

For Flex deployments on Kubernetes, ensure the cluster has sufficient physical resources before scaling. The cluster requires:

- Enough RAM to support the desired in-memory dataset size.

- Enough SSD capacity for flash-tier data.

- Adequate vCPU to support increased shard count or throughput.

{{<warning>}}
Scaling operations will fail or underperform if the underlying cluster is resource-constrained.
{{</warning>}}

PVC expansion is not supported with `redisOnFlashSpec`. Plan flash storage capacity upfront and don't enable `enablePersistentVolumeResize` in the REC `persistentSpec`.

See Flex [hardware requirements]({{<relref "/operate/kubernetes/flex/plan#hardware-requirements">}}) for more information.
