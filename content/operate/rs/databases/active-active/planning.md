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
---

In Redis Software, Active-Active geo-distribution is based on [conflict-free replicated data type (CRDT) technology](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type). Compared to databases without geo-distribution, Active-Active databases have more complex replication and networking, as well as a different data type.

Because of the complexities of Active-Active databases, there are special considerations to keep in mind while planning your Active-Active database.

See [Active-Active Redis]({{< relref "/operate/rs/databases/active-active/" >}}) for more information about geo-distributed replication. For more info on other high availability features, see [Durability and high availability]({{< relref "/operate/rs/databases/durability-ha/" >}}).

## Participating clusters

You need at least [two participating clusters]({{< relref "/operate/rs/clusters/new-cluster-setup" >}}) for an Active-Active database. If your database requires more than ten participating clusters, contact Redis support. You can [add or remove participating clusters]({{< relref "/operate/rs/databases/active-active/manage#participating-clusters/" >}}) after database creation.

{{<note>}}
If an Active-Active database [runs on flash memory]({{<relref "/operate/rs/databases/flash">}}), you cannot add participating clusters that run on RAM only.
{{</note>}}

For Redis Software versions earlier than 8.0.16, changes made from the Cluster Manager UI to an Active-Active database configuration only apply to the cluster you are editing. For global configuration changes across all clusters, use the `crdb-cli` command-line utility. As of Redis Software version 8.0.16, the Cluster Manager UI supports both global and local configuration changes for Active-Active databases.

## Memory limits

Database memory limits define the maximum size of your database across all database replicas and [shards]({{< relref "/operate/rs/references/terminology.md#redis-instance-shard" >}}) on the cluster. Your memory limit also determines the number of shards.

Besides your dataset, the memory limit must also account for replication, Active-Active metadata, and module overhead. These features can increase your database size, sometimes increasing it by two times or more.

Factors to consider when sizing your database:

- **dataset size**: you want your limit to be above your dataset size to leave room for overhead.
- **database throughput**: high throughput needs more shards, leading to a higher memory limit.
- [**modules**]({{< relref "/operate/oss_and_stack/stack-with-enterprise" >}}): using modules with your database can consume more memory.
- [**database clustering**]({{< relref "/operate/rs/databases/durability-ha/clustering.md" >}}): enables you to spread your data into shards across multiple nodes (scale out).
- [**database replication**]({{< relref "/operate/rs/databases/durability-ha/replication.md" >}}): enabling replication doubles memory consumption
- [**Active-Active replication**]({{< relref "/operate/rs/databases/active-active/_index.md" >}}): enabling Active-Active replication requires double the memory of regular replication, which can be up to two times (2x) the original data size per instance.
- [**database replication backlog**]({{< relref "/operate/rs/databases/active-active/manage#replication-backlog/" >}}) for synchronization between shards. By default, this is set to 1% of the database size.
- [**Active-Active replication backlog**]({{< relref "/operate/rs/databases/active-active/manage.md" >}}) for synchronization between clusters. By default, this is set to 1% of the database size.

It's also important to know Active-Active databases have a lower threshold for activating the eviction policy, because it requires propagation to all participating clusters. The eviction policy starts to evict keys when one of the Active-Active instances reaches 80% of its memory limit. 

For more information on memory limits, see [Memory and performance]({{< relref "/operate/rs/databases/memory-performance/" >}}) or [Database memory limits]({{< relref "/operate/rs/databases/memory-performance/memory-limit.md" >}}).

### Replication OOM protection

When a shard in an Active-Active database reaches an out-of-memory (OOM) condition:

1. Replication between that shard and its peers stops immediately.

1. The syncer process sends commands to the affected shard to trigger garbage collection and free memory.

If the database has no [eviction policy]({{<relref "/operate/rs/databases/memory-performance/eviction-policy/">}}) and no keys with [expiration times (TTL)]({{<relref "/develop/using-commands/keyspace#key-expiration">}}), no memory can be freed, which can lead to persistent replication failure and data desynchronization.

To reduce this risk, Active-Active databases running Redis version 8.4 or later support a configurable memory buffer through the `replication_oom_threshold_percent` setting. This setting reserves a percentage of memory below `maxmemory` for internal replication operations.

The `replication_oom_threshold_percent` setting works as follows:

- If memory usage is below the threshold, all client writes proceed normally.

- If memory usage exceeds the threshold, Redis blocks external client write commands with an out-of-memory error, but internal replication and garbage collection continue in the reserved buffer.

- If memory reaches `maxmemory` despite the client block, the standard out-of-memory behavior applies to all operations, including replication.

`replication_oom_threshold_percent` defaults to `5`, which means 5% of `maxmemory` is reserved. To adjust the reserved percentage in all participating clusters, use an [update Active-Active database configuration]({{<relref "/operate/rs/references/rest-api/requests/crdbs#patch-crdbs">}}) REST API request:

```sh
PATCH https://<host>:<port>/v1/crdbs/<crdb_guid>
{ 
  "default_db_config": { 
    "replication_oom_threshold_percent": <integer from 0 to 20> 
  }
}
```

## Networking

Network requirements for Active-Active databases include:

- A VPN between each network that hosts a cluster with an instance (if your database spans WAN).
- A network connection to [several ports](#network-ports) on each cluster from all nodes in all participating clusters.
- A [network time service](#network-time-service) running on each node in all clusters.

Networking between the clusters must be configured before creating an Active-Active database. The setup will fail if there is no connectivity between the clusters.

### Network ports

Every node must have access to the REST API ports of every other node as well as other ports for proxies, VPNs, and the Cluster Manager UI. See [Network port configurations]({{< relref "/operate/rs/networking/port-configurations.md" >}}) for more details. These ports should be allowed through firewalls that may be positioned between the clusters.

### Network Time Service {#network-time-service}

Active-Active databases require a time service like NTP or Chrony to make sure the clocks on all cluster nodes are synchronized.
This is critical to avoid problems with internal cluster communications that can impact your data integrity.

See [Synchronizing cluster node clocks]({{< relref "/operate/rs/clusters/configure/sync-clocks.md" >}}) for more information.

## Data compression

Active-Active databases replicate data between participating clusters over the network. When clusters are geographically distributed, compressing the replicated data can:

- Reduce network traffic.

- Resolve throughput issues.

- Reduce network traffic costs.

The compression level is an integer between 0 and 6 where:

- `0` turns off compression. This compression level is recommended only when throughput is low, because compression can lead to high lag in such scenarios.

- `6` provides the highest compression but uses the most resources.

- The default compression level is `3`.

To change the compression level, use the `--compression` option when you [create]({{< relref "/operate/rs/references/cli-utilities/crdb-cli/crdb/create" >}}) or [update]({{< relref "/operate/rs/references/cli-utilities/crdb-cli/crdb/update" >}}) an Active-Active database with [`crdb-cli`]({{< relref "/operate/rs/references/cli-utilities/crdb-cli" >}}).

## Redis modules {#redis-modules}

Several Redis modules are compatible with Active-Active databases. Find the list of [compatible Redis modules]({{< relref "/operate/oss_and_stack/stack-with-enterprise/enterprise-capabilities" >}}).

Active-Active databases created with or upgraded to Redis version 8 or later automatically enable [Redis Search]({{<relref "/operate/oss_and_stack/stack-with-enterprise/search/search-active-active">}}) and [JSON]({{<relref "/operate/oss_and_stack/stack-with-enterprise/json">}}), which allows you to index, query, and perform full-text searches of nested JSON documents.


## Limitations

Active-Active databases have the following limitations:

- An existing database can't be changed into an Active-Active database. To move data from an existing database to an Active-Active database, you must [create a new Active-Active database]({{< relref "/operate/rs/databases/active-active/create.md" >}}) and [migrate the data]({{< relref "/operate/rs/databases/import-export/migrate-to-active-active.md" >}}).
- [Discovery service]({{< relref "/operate/rs/databases/durability-ha/discovery-service.md" >}}) is not supported with Active-Active databases. Active-Active databases require FQDNs or [mDNS]({{< relref "/operate/rs/networking/mdns.md" >}}).
- The `FLUSH` command is not supported from the CLI. To flush your database, use the API or Cluster Manager UI.
- The `UNLINK` command is a blocking command for all types of keys.
- Cross slot multi commands (such as `MSET`) are not supported with Active-Active databases.
- The hashing policy can't be changed after database creation.
- Database clustering cannot be enabled or turned off after database creation.
- Active-Active databases cannot be configured as Redis Flex deployments.
- Active-Active databases handle replication internally and do not support the `redis.set_repl()` function in Lua scripts.
- If you enabled the default database password during the creation of an Active-Active database, you should not turn off the default database password because it could prevent the removal of participating database instances.
- When upgrading an Active-Active database from Redis 7.4 or earlier to version 8.0 or later, you cannot use module commands, such as [Redis Search](https://redis.io/docs/latest/commands/?group=search) and [JSON](https://redis.io/docs/latest/commands/?group=json) commands, until all Active-Active database instances in all participating clusters have been upgraded. These commands are not blocked automatically, and running these commands before finishing the upgrade process can cause syncer crashes.
