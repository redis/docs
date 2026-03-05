---
title: Redis Flex on Kubernetes
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Extend Redis databases with Flash storage for large-scale, cost-efficient deployments on Kubernetes.
hideListLinks: true
linkTitle: Redis Flex
weight: 41
---

Redis Flex extends your database capacity by combining RAM and Flash (SSD) storage. This tiered architecture keeps frequently accessed (hot) data in RAM for sub-millisecond latency while storing less active (warm) data on Flash to reduce costs and increase capacity.

Redis Flex databases work with your existing Redis applications and the Redis API without modification.

## How Redis Flex works

### Automatic data tiering

Redis Flex moves data between RAM and Flash based on access patterns:

- Frequently accessed data stays in high-speed RAM.
- Less active data moves to cost-efficient Flash storage.
- Data accessed from Flash promotes back to RAM automatically.

Redis uses an LRU (least recently used) eviction policy to manage data placement. When memory pressure increases, Redis Flex identifies cold objects, transfers them to Flash, and frees RAM for new or frequently accessed keys.

This process requires no application changes. Your existing Redis commands work across both storage tiers.

### Storage engine

Redis Flex uses Speedb, a high-performance key-value storage engine optimized for Flash drives:

- Redis handles all data operations in memory.
- Speedb manages the Flash storage layer.
- This design delivers predictable latency and throughput as datasets grow beyond RAM limits.

### Key and value offloading (Redis 8.2+)

Starting with Redis 8.2, Redis Flex offloads both keys and values to Flash:

| Redis version | What moves to Flash              |
|---------------|----------------------------------|
| Before 8.2    | Values only (keys remain in RAM) |
| 8.2 and later | Both keys and values             |

This capability increases dataset density per node and reduces RAM consumption.

## When to use Redis Flex

Use Redis Flex when you need to:

- Run Redis at terabyte scale while maintaining high throughput and sub-10 ms latency
- Power real-time feature stores for machine learning applications like fraud detection, recommendation systems, and personalization engines
- Operate large distributed caches that require elastic scaling and consistent performance under heavy load
- Reduce infrastructure costs by combining high-speed RAM with cost-efficient Flash storage

## What Redis Flex is not

Redis Flex optimizes for performance, elasticity, and scalability—not long-term data persistence.

Although Redis Flex retains data in memory or Flash during operation, don't use it as a primary system of record or persistent storage layer. For workloads that require durability and recovery across restarts or failures, use Redis persistence features like AOF (Append-Only File), RDB snapshots, or both.

For more information, see [Database persistence]({{< relref "/operate/rs/databases/configure/database-persistence" >}}).

## Redis Flex and Auto Tiering

Redis Flex replaces Auto Tiering. The Redis Enterprise operator selects the appropriate implementation based on your Redis version:

| Kubernetes operator version | Implementation |
|-----------------------------|----------------|
| 8.0.2-2 and later           | Redis Flex     |
| 7.22.2-22 and earlier       | Auto Tiering   |

For Redis Enterprise for Kubernetes version 7.22.2-22 or earlier, see [Auto Tiering]({{< relref "/operate/kubernetes/7.22/re-clusters/auto-tiering" >}}).

## Next steps

- [Plan your deployment]({{< relref "/operate/kubernetes/flex/plan" >}}): Review hardware requirements, sizing guidelines, and limitations.
- [Get started]({{< relref "/operate/kubernetes/flex/get-started" >}}): Configure Redis Flex on your cluster.
- [Scale your deployment]({{< relref "/operate/kubernetes/flex/scale" >}}): Learn scaling strategies and best practices.
