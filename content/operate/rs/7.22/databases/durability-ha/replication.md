---
Title: Database replication
alwaysopen: false
categories:
- docs
- operate
- rs
description: null
linktitle: Replication
weight: 40
url: '/operate/rs/7.22/databases/durability-ha/replication/'
---
Database replication helps ensure high availability.
When replication is enabled, your dataset is replicated to a replica shard,
which is constantly synchronized with the primary shard. If the primary 
shard fails, an automatic failover happens and the replica shard is promoted.  That is, it becomes the new primary shard. 

When the old primary shard recovers, it becomes
the replica shard of the new primary shard. This auto-failover mechanism
guarantees that data is served with minimal interruption.

You can tune your high availability configuration with:

- [Rack/Zone
Awareness]({{< relref "/operate/rs/7.22/clusters/configure/rack-zone-awareness.md" >}}) - When rack-zone awareness is used additional logic ensures that master and replica shards never share the same rack, thus ensuring availability even under loss of an entire rack.
- [High Availability for Replica Shards]({{< relref "/operate/rs/7.22/databases/configure/replica-ha.md" >}}) - When high availability
for replica shards is used, the replica shard is automatically migrated on node failover to maintain high availability.

{{< warning >}}
Enabling replication has implications for the total database size,
as explained in [Database memory limits]({{< relref "/operate/rs/7.22/databases/memory-performance/memory-limit.md" >}}).
{{< /warning >}}

## Auto Tiering replication considerations

We recommend that you set the sequential replication feature using
`rladmin`. This is due to the potential for relatively slow replication
times that can occur with Auto Tiering enabled databases. In some
cases, if sequential replication is not set up, you may run out of memory. 

While it does not cause data loss on the
primary shards, the replication to replica shards may not succeed as long
as there is high write-rate traffic on the primary and multiple
replications at the same time.

The following `rladmin` command sets the number of primary shards eligible to
be replicated from the same cluster node, as well as the number of replica
shards on the same cluster node that can run the replication process at
any given time.

The recommended sequential replication configuration is two, i.e.:

```sh
rladmin tune cluster max_redis_forks 1 max_slave_full_syncs 1
```

{{< note >}}
This means that at any given time,
only one primary and one replica can be part of a full sync replication process.
{{< /note >}}

## Database replication backlog

Redis databases that use [replication for high availability]({{< relref "/operate/rs/7.22/databases/durability-ha/replication.md" >}}) maintain a replication backlog (per shard) to synchronize the primary and replica shards of a database.
By default, the replication backlog is set to one percent (1%) of the database size divided by the database number of shards and ranges between 1MB to 250MB per shard.
Use the [`rladmin`]({{< relref "/operate/rs/7.22/references/cli-utilities/rladmin" >}}) and the [`crdb-cli`]({{< relref "/operate/rs/7.22/references/cli-utilities/crdb-cli" >}}) utilities to control the size of the replication backlog. You can set it to `auto` or set a specific size.  

The syntax varies between regular and Active-Active databases. 

For a regular Redis database:
```text
rladmin tune db <db:id | name> repl_backlog <Backlog size in MB | 'auto'>
```

For an Active-Active database:
```text
crdb-cli crdb update --crdb-guid <crdb_guid> --default-db-config "{\"repl_backlog_size\": <size in MB | 'auto'>}"
```

### Active-Active replication backlog

In addition to the database replication backlog, Active-Active databases maintain a backlog (per shard) to synchronize the database instances between clusters.
By default, the Active-Active replication backlog is set to one percent (1%) of the database size divided by the database number of shards, and ranges between 1MB to 250MB per shard.
Use the [`crdb-cli`]({{< relref "/operate/rs/7.22/references/cli-utilities/crdb-cli" >}}) utility to control the size of the CRDT replication backlog. You can set it to `auto` or set a specific size:  

```text
crdb-cli crdb update --crdb-guid <crdb_guid> --default-db-config "{\"crdt_repl_backlog_size\": <size in MB | 'auto'>}"
```

**For Redis Software versions earlier than 6.0.20:**
The replication backlog and the CRDT replication backlog defaults are set to 1MB and cannot be set dynamically with 'auto' mode.
To control the size of the replication log, use [`rladmin`]({{< relref "/operate/rs/7.22/references/cli-utilities/rladmin" >}}) to tune the local database instance in each cluster.
```text
rladmin tune db <db:id | name> repl_backlog <Backlog size in MB (or if ending with bytes, KB or GB, in the respective unit)>
```