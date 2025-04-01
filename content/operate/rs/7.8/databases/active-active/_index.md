---
Title: Active-Active geo-distributed Redis
alwaysopen: false
categories:
- docs
- operate
- rs
- kubernetes
description: Overview of the Active-Active database in Redis Enterprise Software
hideListLinks: true
linktitle: Active-Active
weight: 40
url: '/operate/rs/7.8/databases/active-active/'
---
In Redis Enterprise, Active-Active geo-distribution is based on [CRDT technology](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type).
The Redis Enterprise implementation of CRDT is called an Active-Active database (formerly known as CRDB).
With Active-Active databases, applications can read and write to the same data set from different geographical locations seamlessly and with latency less than one millisecond (ms),
without changing the way the application connects to the database.

Active-Active databases also provide disaster recovery and accelerated data read-access for geographically distributed users.


## High availability

The [high availability]({{< relref "/operate/rs/databases/durability-ha/" >}}) that Active-Active replication provides is built upon a number of Redis Enterprise Software features (such as [clustering]({{< relref "/operate/rs/databases/durability-ha/clustering.md" >}}), [replication]({{< relref "/operate/rs/databases/durability-ha/replication.md" >}}), and [replica HA]({{< relref "/operate/rs/databases/configure/replica-ha.md" >}})) as well as some features unique to Active-Active ([multi-primary replication]({{<relref "#multi-primary-replication/">}}), [automatic conflict resolution]({{<relref "#conflict-resolution/">}}), and [strong eventual consistency]({{<relref "#strong-eventual-consistency/">}})).

Clustering and replication are used together in Active-Active databases to distribute multiple copies of the dataset across multiple nodes and multiple clusters. As a result, a node or cluster is less likely to become a single point of failure. If a primary node or primary shard fails, a replica is automatically promoted to primary. To avoid having one node hold all copies of certain data, the [replica HA]({{< relref "/operate/rs/databases/configure/replica-ha.md" >}}) feature (enabled by default) automatically migrates replica shards to available nodes.

## Multi-primary replication

In Redis Enterprise Software, replication copies data from primary shards to replica shards. Active-Active geo-distributed replication also copies both primary and replica shards to other clusters. Each Active-Active database needs to span at least two clusters; these are called participating clusters.

Each participating cluster hosts an instance of your database, and each instance has its own primary node. Having multiple primary nodes means you can connect to the proxy in any of your participating clusters. Connecting to the closest cluster geographically enables near-local latency. Multi-primary replication (previously referred to as multi-master replication) also means that your users still have access to the database if one of the participating clusters fails.

{{< note >}}
Active-Active databases do not replicate the entire database, only the data.
Database configurations, LUA scripts, and other support info are not replicated.
{{< /note >}}

## Syncer

Keeping multiple copies of the dataset consistent across multiple clusters is no small task. To achieve consistency between participating clusters, Redis Active-Active replication uses a process called the [syncer]({{< relref "/operate/rs/databases/active-active/syncer" >}}). 

The syncer keeps a [replication backlog]({{< relref "/operate/rs/databases/active-active/manage#replication-backlog/" >}}), which stores changes to the dataset that the syncer sends to other participating clusters. The syncer uses partial syncs to keep replicas up to date with changes, or a full sync in the event a replica or primary is lost.

## Conflict resolution

Because you can connect to any participating cluster to perform a write operation, concurrent and conflicting writes are always possible. Conflict resolution is an important part of the Active-Active technology. Active-Active databases only use [conflict-free replicated data types (CRDTs)](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type). These data types provide a predictable conflict resolution and don't require any additional work from the application or client side.

When developing with CRDTs for Active-Active databases, you need to consider some important differences. See [Develop applications with Active-Active databases]({{< relref "/operate/rs/databases/active-active/develop/_index.md" >}}) for related information.


## Strong eventual consistency

Maintaining strong consistency for replicated databases comes with tradeoffs in scalability and availability. Redis Active-Active databases use a strong eventual consistency model, which means that local values may differ across replicas for short periods of time, but they all eventually converge to one consistent state. Redis uses vector clocks and the CRDT conflict resolution to strengthen consistency between replicas. You can also enable the causal consistency feature to preserve the order of operations as they are synchronized among replicas.

Other Redis Enterprise Software features can also be used to enhance the performance, scalability, or durability of your Active-Active database. These include [data persistence]({{< relref "/operate/rs/databases/configure/database-persistence.md" >}}), [multiple active proxies]({{< relref "/operate/rs/databases/configure/proxy-policy.md" >}}), [distributed synchronization]({{< relref "/operate/rs/databases/active-active/synchronization-mode.md" >}}), [OSS Cluster API]({{< relref "/operate/rs/databases/configure/oss-cluster-api.md" >}}), and [rack-zone awareness]({{< relref "/operate/rs/clusters/configure/rack-zone-awareness.md" >}}).

## Next steps

- [Plan your Active-Active deployment]({{< relref "/operate/rs/databases/active-active/planning.md" >}})
- [Get started with Active-Active]({{< relref "/operate/rs/databases/active-active/get-started.md" >}})
- [Create an Active-Active database]({{< relref "/operate/rs/databases/active-active/create.md" >}})
