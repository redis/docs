---
Title: Configure high availability for replica shards
alwaysopen: false
categories:
- docs
- operate
- rs
description: Configure high availability for replica shards so that the cluster automatically
  migrates the replica shards to an available node.
linkTitle: Replica high availability
weight: 50
---

When you enable [database replication]({{< relref "/operate/rs/databases/durability-ha/replication.md" >}}),
Redis Enterprise Software creates a replica of each primary shard.  The replica shard will always be 
located on a different node than the primary shard to make your data highly available.  If the primary shard 
fails or if the node hosting the primary shard fails, then the replica is promoted to primary.

Without replica high availability (_replica\_ha_) enabled, the promoted primary shard becomes a single point of failure 
as the only copy of the data.

Enabling _replica\_ha_ configures the cluster to automatically replicate the promoted replica on an available node. 
This automatically returns the database to a state where there are two copies of the data: 
the former replica shard which has been promoted to primary and a new replica shard.

An available node:

1. Meets replica migration requirements, such as [rack-awareness]({{< relref "/operate/rs/clusters/configure/rack-zone-awareness.md" >}}).
1. Has enough available RAM to store the replica shard.
1. Does not also contain the primary shard.

In practice, replica migration creates a new replica shard and copies the data from the primary shard to the new replica shard.

For example:

1. Node:2 has a primary shard and node:3 has the corresponding replica shard.
1. Either:

    - Node:2 fails and the replica shard on node:3 is promoted to primary.
    - Node:3 fails and the primary shard is no longer replicated to the replica shard on the failed node.

1. If replica HA is enabled, a new replica shard is created on an available node.
1. The data from the primary shard is replicated to the new replica shard.

{{< note >}}
- Replica HA follows all prerequisites of replica migration, such as [rack-awareness]({{< relref "/operate/rs/clusters/configure/rack-zone-awareness.md" >}}).
- Replica HA migrates as many shards as possible based on available DRAM in the target node. When no DRAM is available, replica HA stops migrating replica shards to that node.
{{< /note >}}

## Configure high availability for replica shards

If replica high availability is enabled for both the cluster and a database,
the database's replica shards automatically migrate to another node when a primary or replica shard fails.
If replica HA is not enabled at the cluster level,
replica HA will not migrate replica shards even if replica HA is enabled for a database.

Replica high availability is enabled for the cluster by default.

When you create a database using the Cluster Manager UI, replica high availability is enabled for the database by default if you enable replication.

{{<image filename="images/rs/screenshots/databases/config-replica-ha-enabled-7-8-2.png" alt="When you select the Replication checkbox in the High availability section of the database configuration screen, the Replica high availability checkbox is also selected by default.">}}

To use replication without replication high availability, clear the **Replica high availability** checkbox.

You can also enable or turn off replica high availability for a database using `rladmin` or the REST API.

{{< note >}}
For Active-Active databases, replica HA is enabled for the database by default to make sure that replica shards are available for Active-Active replication.
{{< /note >}}

### Configure cluster policy for replica HA

To enable or turn off replica high availability by default for the entire cluster, use one of the following methods:

- [rladmin tune cluster]({{< relref "/operate/rs/references/cli-utilities/rladmin/tune#tune-cluster" >}}): 
    
    ```sh
    rladmin tune cluster slave_ha { enabled | disabled }
    ```

- [Update cluster policy]({{< relref "/operate/rs/references/rest-api/requests/cluster/policy#put-cluster-policy" >}}) REST API request:

    ```sh
    PUT /v1/cluster/policy 
    { "slave_ha": <boolean> }
    ```

### Turn off replica HA for a database

To turn off replica high availability for a specific database using `rladmin`, run:

``` text
rladmin tune db db:<ID> slave_ha disabled
```

You can use the database name in place of `db:<ID>` in the preceding command.


## Configuration options

You can see the current configuration options for replica HA with:

``` text
rladmin info cluster
```

### Grace period

By default, replica HA has a 10-minute grace period after node failure and before new replica shards are created.

{{<note>}}The default grace period is 30 minutes for containerized applications using [Redis Enterprise Software for Kubernetes]({{< relref "/operate/kubernetes/" >}}).{{</note>}}

{{<note>}}For Kubernetes deployments, if ReplicaHA(previously SlaveHA) is enabled at the cluster level, you must also manually enable it at the database level for each RedisEnterpriseDatabase (REDB) using the UI or `rladmin`. Without manual database-level configuration, databases will show `slave_ha: disabled (database)` even when cluster-level ReplicaHA is enabled.{{</note>}}

To configure this grace period from rladmin, run:

``` text
rladmin tune cluster slave_ha_grace_period <time_in_seconds>
```


### Shard priority

Replica shard migration is based on priority.  When memory resources are limited, the most important replica shards are migrated first:

1. `slave_ha_priority` - Replica shards with higher 
    integer values are migrated before shards with lower values.

    To assign priority to a database, run:

    ``` text
    rladmin tune db db:<ID> slave_ha_priority <positive integer>
    ```
    
    You can use the database name in place of `db:<ID>` in the preceding command.

1. Active-Active databases - Active-Active database synchronization uses replica shards to synchronize between the replicas.
1. Database size - It is easier and more efficient to move replica shards of smaller databases.
1. Database UID - The replica shards of databases with a higher UID are moved first.

### Cooldown periods

Both the cluster and the database have cooldown periods.

After node failure, the cluster cooldown period (`slave_ha_cooldown_period`) prevents another replica migration due to another node failure for any
database in the cluster until the cooldown period ends. The default is one hour.

After a database is migrated with replica HA,
it cannot go through another migration due to another node failure until the cooldown period for the database (`slave_ha_bdb_cooldown_period`) ends. The default is two hours.

To configure cooldown periods, use [`rladmin tune cluster`]({{< relref "/operate/rs/references/cli-utilities/rladmin/tune#tune-cluster" >}}):

- For the cluster:

    ``` text
    rladmin tune cluster slave_ha_cooldown_period <time_in_seconds>
    ```

- For all databases in the cluster:

    ``` text
    rladmin tune cluster slave_ha_bdb_cooldown_period <time_in_seconds>
    ```

### Alerts

The following alerts are sent during replica HA activation:

- Shard migration begins after the grace period.
- Shard migration fails because there is no available node (sent hourly).
- Shard migration is delayed because of the cooldown period.
