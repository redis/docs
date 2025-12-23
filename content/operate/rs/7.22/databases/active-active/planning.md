---
Title: Considerations for planning Active-Active databases
alwaysopen: false
categories:
- docs
- operate
- rs
description: Information about Active-Active database to take into consideration while
  planning a deployment, such as compatibility, limitations, and special configuration
linktitle: Planning considerations
weight: 22
url: '/operate/rs/7.22/databases/active-active/planning/'
---

In Redis Enterprise, Active-Active geo-distribution is based on [conflict-free replicated data type (CRDT) technology](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type). Compared to databases without geo-distribution, Active-Active databases have more complex replication and networking, as well as a different data type.

Because of the complexities of Active-Active databases, there are special considerations to keep in mind while planning your Active-Active database.

See [Active-Active Redis]({{< relref "/operate/rs/7.22/databases/active-active/" >}}) for more information about geo-distributed replication. For more info on other high availability features, see [Durability and high availability]({{< relref "/operate/rs/7.22/databases/durability-ha/" >}}).

## Participating clusters

You need at least [two participating clusters]({{< relref "/operate/rs/7.22/clusters/new-cluster-setup" >}}) for an Active-Active database. If your database requires more than ten participating clusters, contact Redis support. You can [add or remove participating clusters]({{< relref "/operate/rs/7.22/databases/active-active/manage#participating-clusters/" >}}) after database creation.

{{<note>}}
If an Active-Active database [runs on flash memory]({{<relref "/operate/rs/7.22/databases/auto-tiering">}}), you cannot add participating clusters that run on RAM only.
{{</note>}}

Changes made from the Cluster Manager UI to an Active-Active database configuration only apply to the cluster you are editing. For global configuration changes across all clusters, use the `crdb-cli` command-line utility.

## Memory limits

Database memory limits define the maximum size of your database across all database replicas and [shards]({{< relref "/operate/rs/7.22/references/terminology.md#redis-instance-shard" >}}) on the cluster. Your memory limit also determines the number of shards.

Besides your dataset, the memory limit must also account for replication, Active-Active metadata, and module overhead. These features can increase your database size, sometimes increasing it by two times or more.

Factors to consider when sizing your database:

- **dataset size**: you want your limit to be above your dataset size to leave room for overhead.
- **database throughput**: high throughput needs more shards, leading to a higher memory limit.
- [**modules**]({{< relref "/operate/oss_and_stack/stack-with-enterprise" >}}): using modules with your database can consume more memory.
- [**database clustering**]({{< relref "/operate/rs/7.22/databases/durability-ha/clustering.md" >}}): enables you to spread your data into shards across multiple nodes (scale out).
- [**database replication**]({{< relref "/operate/rs/7.22/databases/durability-ha/replication.md" >}}): enabling replication doubles memory consumption
- [**Active-Active replication**]({{< relref "/operate/rs/7.22/databases/active-active/_index.md" >}}): enabling Active-Active replication requires double the memory of regular replication, which can be up to two times (2x) the original data size per instance.
- [**database replication backlog**]({{< relref "/operate/rs/7.22/databases/active-active/manage#replication-backlog/" >}}) for synchronization between shards. By default, this is set to 1% of the database size.
- [**Active-Active replication backlog**]({{< relref "/operate/rs/7.22/databases/active-active/manage.md" >}}) for synchronization between clusters. By default, this is set to 1% of the database size.

It's also important to know Active-Active databases have a lower threshold for activating the eviction policy, because it requires propagation to all participating clusters. The eviction policy starts to evict keys when one of the Active-Active instances reaches 80% of its memory limit. 

For more information on memory limits, see [Memory and performance]({{< relref "/operate/rs/7.22/databases/memory-performance/" >}}) or [Database memory limits]({{< relref "/operate/rs/7.22/databases/memory-performance/memory-limit.md" >}}).

## Networking

Network requirements for Active-Active databases include:

- A VPN between each network that hosts a cluster with an instance (if your database spans WAN).
- A network connection to [several ports](#network-ports) on each cluster from all nodes in all participating clusters.
- A [network time service](#network-time-service) running on each node in all clusters.

Networking between the clusters must be configured before creating an Active-Active database. The setup will fail if there is no connectivity between the clusters.

### Network ports

Every node must have access to the REST API ports of every other node as well as other ports for proxies, VPNs, and the Cluster Manager UI. See [Network port configurations]({{< relref "/operate/rs/7.22/networking/port-configurations.md" >}}) for more details. These ports should be allowed through firewalls that may be positioned between the clusters.

### Network Time Service {#network-time-service}

Active-Active databases require a time service like NTP or Chrony to make sure the clocks on all cluster nodes are synchronized.
This is critical to avoid problems with internal cluster communications that can impact your data integrity.

See [Synchronizing cluster node clocks]({{< relref "/operate/rs/7.22/clusters/configure/sync-clocks.md" >}}) for more information.

## Redis modules {#redis-modules}

Several Redis modules are compatible with Active-Active databases. Find the list of [compatible Redis modules]({{< relref "/operate/oss_and_stack/stack-with-enterprise/enterprise-capabilities" >}}).
{{< note >}}
Starting with v6.2.18, you can index, query, and perform full-text searches of nested JSON documents in Active-Active databases by combining RedisJSON and RediSearch.
{{< /note >}}

## Limitations

Active-Active databases have the following limitations:

- An existing database can't be changed into an Active-Active database. To move data from an existing database to an Active-Active database, you must [create a new Active-Active database]({{< relref "/operate/rs/7.22/databases/active-active/create.md" >}}) and [migrate the data]({{< relref "/operate/rs/7.22/databases/import-export/migrate-to-active-active.md" >}}).
- [Discovery service]({{< relref "/operate/rs/7.22/databases/durability-ha/discovery-service.md" >}}) is not supported with Active-Active databases. Active-Active databases require FQDNs or [mDNS]({{< relref "/operate/rs/7.22/networking/mdns.md" >}}).
- The `FLUSH` command is not supported from the CLI. To flush your database, use the API or Cluster Manager UI.
- The `UNLINK` command is a blocking command for all types of keys.
- Cross slot multi commands (such as `MSET`) are not supported with Active-Active databases.
- The hashing policy can't be changed after database creation.
- If an Active-Active database [runs on flash memory]({{<relref "/operate/rs/7.22/databases/auto-tiering">}}), you cannot add participating clusters that run on RAM only.
- Active-Active databases handle replication internally and do not support the `redis.set_repl()` function in Lua scripts.
