---
title: Flex on Kubernetes
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Extend Redis databases with flash storage for large-scale, cost-efficient deployments on Kubernetes.
hideListLinks: true
linkTitle: Flex
weight: 41
---

Flex extends your database capacity by combining RAM and flash (SSD) storage. This tiered architecture keeps frequently accessed (hot) data in RAM for sub-millisecond latency while storing less active (warm) data on flash to reduce costs and increase capacity.

Flex databases work with your existing Redis applications and the Redis API without modification.

## How Flex works

### Automatic data tiering

Flex moves data between RAM and flash based on access patterns:

- Frequently accessed data stays in high-speed RAM.
- Less active data moves to cost-efficient flash storage.
- Data accessed from flash promotes back to RAM automatically.

Redis uses an [LRU (least recently used)]({{< relref "/develop/reference/eviction#apx-lru" >}}) eviction policy to manage data placement. When memory pressure increases, Flex identifies cold objects, transfers them to flash, and frees RAM for new or frequently accessed keys.

This process requires no application changes. Your existing Redis commands work across both storage tiers.

### Storage engine

Flex uses Speedb, a high-performance key-value storage engine optimized for flash drives:

- Redis handles all data operations in memory.
- Speedb manages the flash storage layer.
- This design delivers predictable latency and throughput as datasets grow beyond RAM limits.

## When to use Flex

Use Flex when you need to:

- Run Redis at terabyte scale while maintaining high throughput and sub-10 ms latency
- Power real-time feature stores for machine learning applications
- Operate large distributed caches with elastic scaling and consistent performance under heavy load
- Reduce infrastructure costs by combining high-speed RAM with cost-efficient flash storage

Flex does not replace long-term data persistence. For workloads that require durability and recovery across restarts or failures, use Redis persistence features like AOF (Append-Only File), RDB snapshots, or both. For more information, see [Database persistence]({{< relref "/operate/rs/databases/configure/database-persistence" >}}).

## Flex and Auto Tiering

Flex replaces [Auto Tiering]({{< relref "/operate/kubernetes/7.22/re-clusters/auto-tiering" >}}) (formerly known as Redis on Flash). Redis Enterprise selects the implementation based on your Redis version:

| Kubernetes operator version | Implementation |
|-----------------------------|----------------|
| 8.0.2-2 and later           | Flex           |
| 7.22.2-22 and earlier       | Auto Tiering   |

For Redis Enterprise for Kubernetes version 7.22.2-22 or earlier, see [Auto Tiering]({{< relref "/operate/kubernetes/7.22/re-clusters/auto-tiering" >}}).

### Differences between Flex and Auto Tiering

- Key and value offloading
    - Auto Tiering offloads only values to flash while keys remain in RAM.
    - Flex offloads both keys and values, which increases dataset density per node and reduces RAM consumption.
- RAM population strategy
    - Auto Tiering fills all available RAM before offloading data to flash. This maximizes hot-data performance but can cause non-linear performance changes at high utilization.
    - Flex uses utilization-aware RAM population.
        When database utilization is below 50%, Flex uses up to 50% of configured RAM for hot data. Above 50% utilization, Flex uses both RAM and flash proportionally, following the configured RAM-to-flash ratio. This provides a stable performance curve, consistent RAM hit-rate, and predictable throughput and latency.
- Storage engine
    - Auto Tiering uses either RocksDB or Speedb as the storage engine.
    - Flex uses Speedb only.

## Next steps

- [Plan your deployment]({{< relref "/operate/kubernetes/flex/plan" >}}): Review hardware requirements, sizing guidelines, and limitations.
- [Get started]({{< relref "/operate/kubernetes/flex/get-started" >}}): Configure Flex on your cluster.
- [Scale your deployment]({{< relref "/operate/kubernetes/flex/scale" >}}): Learn scaling strategies and best practices.
