---
title: Scale Flex databases for Redis Software
alwaysopen: false
categories:
- docs
- operate
- rs
description: Scaling strategies for Flex deployments for Redis Software.
hideListLinks: true
linkTitle: Scale
weight: 30
---

This guide shows you how to scale Flex databases for Redis Software to meet changing workload demands.

## Choose a scaling strategy

Use the following table to determine the best scaling strategy for your Flex deployment:

| Goal | Recommended action |
|------|--------------------|
| Increase data capacity only without adding CPU | Increase database limit and decrease RAM percentage |
| Increase throughput only | Add shards and vCPU |
| Increase data capacity and throughput | Add shards |
| Improve latency under higher load | Increase RAM percentage |
| Reduce cost while maintaining performance | Tune RAM-to-flash ratio |

## Prerequisites

Before you scale a self-managed Flex deployment, verify that your cluster has sufficient resources, such as memory, disk, and vCPU.

## Scale volume

If your dataset requires more capacity while maintaining performance, you can prepare a Flex database to store more data using one of the following options:

1. Increase the database limit and [add shards](scale-volume-add-shards).

1. Increase the database limit and [decrease the RAM-to-flash ratio](#decrease-ram-to-flash-ratio).

### Add shards {#scale-volume-add-shards}

You can add more shards to expand dataset capacity while maintaining the existing RAM-to-flash ratio. Throughput capacity also typically increases as a result of additional shards and infrastructure. This strategy is recommended when the dataset size and traffic are expected to grow together.

Before you increase the dataset capacity and add shards, you need to add more RAM and vCPUs to handle the increased number of shards.

To increase the dataset capacity and shards using the Cluster Manager UI:

1. On the **Databases** screen, select the database you want to edit.

1. From the **Configuration** tab, click **Edit**.

1. In the **Capacity** section, increase the **Memory limit**.

1. In the **Clustering** section, increase the **Number of shards**.

1. Click **Save**.

### Decrease RAM-to-flash ratio

You can allocate more data to the flash tier while keeping the same amount of RAM to increase the database capacity. This strategy increases the total volume without requiring additional RAM or vCPU.
Maintains existing shard count while improving hardware utilization.
Recommended when: scaling for volume only, and SSD resources are underutilized.

This will increase the DB with flash storage without needing additional vCPU or memory. Usually best for when scaling only volume is required and there is unutilized SSD space.

To increase the dataset capacity and decrease the RAM-to-flash ratio using the Cluster Manager UI:

1. On the **Databases** screen, select the database you want to edit.

1. From the **Configuration** tab, click **Edit**.

1. In the **Capacity** section:

    1. Increase the **Memory limit**.

    1. Decrease the **RAM limit**.

1. Click **Save**.

## Scale throughput

If your workload's read/write rate increases and latency starts to rise, you can prepare the database to handle more traffic using one of the following strategies:

1. [Add shards or nodes](#add-shards-or-nodes).

1. [Increase the RAM-to-flash ratio](#increase-ram-to-flash-ratio).

### Add shards or nodes

You can add more shards or nodes to distribute traffic and increase throughput without changing the RAM-to-flash ratio. Dataset size capacity also typically increases as a result of additional shards and infrastructure. This strategy is recommended when the dataset size and traffic are expected to grow together.

Before you add shards or nodes, you need to add more RAM and vCPUs to handle the increased number of shards or nodes.

To add shards using the Cluster Manager UI:

1. On the **Databases** screen, select the database you want to edit.

1. From the **Configuration** tab, click **Edit**.

1. In the **Clustering** section, increase the **Number of shards**.

1. Click **Save**.

To add nodes to the cluster, see [Add a node]({{<relref "/operate/rs/clusters/add-node">}}) for instructions.

### Increase RAM-to-flash ratio

To improve throughput and lower latency, you can expand the in-memory tier to serve a higher proportion of requests directly from RAM. This strategy is recommended when low latency is your primary goal and you don't need to increase the dataset size.

Before increasing the RAM-to-flash ratio, you might need to add more nodes to accommodate additional RAM. See [Add a node]({{<relref "/operate/rs/clusters/add-node">}}) for instructions.

To increase the RAM-to-flash ratio using the Cluster Manager UI:

1. On the **Databases** screen, select the database you want to edit.

1. From the **Configuration** tab, click **Edit**.

1. In the **Capacity** section, increase the **RAM limit**.

1. Click **Save**.

## Scale infrastructure

You can increase or adjust the underlying resources supporting the database, such as CPU, memory, and disk.

For self-managed Redis Flex deployments, ensure the cluster has sufficient physical resources before scaling. The cluster requires:

- Enough RAM to support the desired in-memory dataset size.

- Enough SSD capacity for flash-tier data.

- Adequate vCPU to support increased shard count or throughput.

{{<warning>}}
Scaling operations will fail or underperform if the underlying cluster is resource-constrained.
{{</warning>}}

See Flex [hardware requirements]({{<relref "/operate/rs/flex/plan#hardware-requirements">}}) for more information.
