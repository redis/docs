---
Title: Database memory limits
alwaysopen: false
categories:
- docs
- operate
- rs
- rc
description: When you set a database's memory limit, you define the maximum size the
  database can reach.
linkTitle: Memory limits
weight: 20
---
When you set a database's memory limit, you define the maximum size the
database can reach in the cluster, across all database replicas and
shards, including both primary and replica shards.

If the total size of the database in the cluster reaches the memory
limit, the data eviction policy is
applied.

## Factors for sizing

Factors to consider when sizing your database:

- **dataset size**: you want your limit to be above your dataset size to leave room for overhead.
- **database throughput**: high throughput needs more shards, leading to a higher memory limit.
- [**modules**]({{< relref "/operate/oss_and_stack/stack-with-enterprise" >}}): using modules with your database consumes more memory.
- [**database clustering**]({{< relref "/operate/rs/databases/durability-ha/clustering.md" >}}): enables you to spread your data into shards across multiple nodes.
- [**database replication**]({{< relref "/operate/rs/databases/durability-ha/replication.md" >}}): enabling replication doubles memory consumption.

Additional factors for Active-Active databases:

- [**Active-Active replication**]({{< relref "/operate/rs/databases/active-active/_index.md" >}}): enabling Active-Active replication requires double the memory of regular replication, which can be up to two times (2x) the original data size per instance.
- [**database replication backlog**]({{< relref "/operate/rs/databases/active-active/manage#replication-backlog/" >}}) for synchronization between shards. By default, this is set to 1% of the database size.
- [**Active-Active replication backlog**]({{< relref "/operate/rs/databases/active-active/manage.md" >}}) for synchronization between clusters. By default, this is set to 1% of the database size.

  It's also important to know Active-Active databases have a lower threshold for activating the eviction policy, because it requires propagation to all participating clusters. The eviction policy starts to evict keys when one of the Active-Active instances reaches 80% of its memory limit.

Additional factors for  databases with Auto Tiering enabled:

- The available flash space must be greater than or equal to the total database size (RAM+Flash). The extra space accounts for write buffers and [write amplification](https://en.wikipedia.org/wiki/Write_amplification).

- [**database persistence**]({{< relref "/operate/rs/databases/configure/database-persistence.md" >}}): Auto Tiering uses dual database persistence where both the primary and replica shards persist to disk. This may add some processor and network overhead, especially in cloud configurations with network attached storage.

## What happens when Redis Enterprise Software is low on RAM?

Redis Enterprise Software manages node memory so that data is entirely in RAM (unless using Auto Tiering). If not enough RAM is available, Redis Enterprise prevents adding more data into the databases.

Redis Enterprise Software protects the existing data and prevents the database from being able to store data into the shards.

You can configure the cluster to move the data to another node, or even discard it according to the [eviction policy]({{< relref "/operate/rs/databases/memory-performance/eviction-policy.md" >}}) set on each database by the administrator.

[Auto Tiering]({{< relref "/operate/rs/databases/auto-tiering/" >}})
manages memory so that you can also use flash memory (SSD) to store data.

### Order of events for low RAM

1. If there are other nodes available, your shards migrate to other nodes.
2. If the eviction policy allows eviction, shards start to release memory,
which can result in data loss.
3. If the eviction policy does not allow eviction, you'll receive
out of memory (OOM) messages.
4. If shards can't free memory, Redis Enterprise relies on the OS processes to stop replicas,
but tries to avoid stopping primary shards.

We recommend that you have a [monitoring platform]({{< relref "/operate/rs/monitoring/" >}}) that alerts you before a system gets low on RAM.
You must maintain sufficient free memory to make sure that you have a healthy Redis Enterprise installation.

## Adaptive memory allocation

During high-velocity data ingestion, databases can temporarily reach up to 200% of their configured memory limit. This adaptive memory allocation strategy allows large amounts of data to be written to the database quickly without rejecting valid transactions.

Databases should return to their configured memory limits after data is removed according to the [eviction policy]({{<relref "/operate/rs/databases/memory-performance/eviction-policy/">}}) and [time-to-live (TTL)]({{<relref "/develop/using-commands/keyspace#key-expiration">}}).

## Memory metrics

The Cluster Manager UI provides metrics that can help you evaluate your memory use.

- Free RAM
- RAM fragmentation
- Used memory
- Memory usage
- Memory limit

See [console metrics]({{< relref "/operate/rs/references/metrics" >}}) for more detailed information.

## Related info

- [Memory and performance]({{< relref "/operate/rs/databases/memory-performance" >}})
- [Disk sizing for heavy write scenarios]({{< relref "/operate/rs/clusters/optimize/disk-sizing-heavy-write-scenarios.md" >}})
- [Turn off services to free system memory]({{< relref "/operate/rs/clusters/optimize/turn-off-services.md" >}})
- [Eviction policy]({{< relref "/operate/rs/databases/memory-performance/eviction-policy.md" >}})
- [Shard placement policy]({{< relref "/operate/rs/databases/memory-performance/shard-placement-policy.md" >}})
- [Database persistence]({{< relref "/operate/rs/databases/configure/database-persistence.md" >}})
