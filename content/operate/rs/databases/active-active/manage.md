---
Title: Manage Active-Active databases
alwaysopen: false
categories:
- docs
- operate
- rs
description: Manage your Active-Active database settings.
linktitle: Manage
weight: 30
---

You can configure and manage your Active-Active database from either the admin console or the command line.

To change the global configuration of the Active-Active database, use the [`crdb-cli`]({{< relref "/operate/rs/references/cli-utilities/crdb-cli" >}}).

If you need to apply changes locally to one database instance, you use the admin console or the `rladmin` CLI.

If you are using the new Cluster Manager UI, switch to the legacy admin console to manage Active-Active databases.

{{<image filename="images/rs/screenshots/switch-to-legacy-ui.png"  width="300px" alt="Select switch to legacy admin console from the dropdown.">}}{{</image>}}

## Database settings

The following table shows a list of database settings, tools you can use to change those settings, and links to more information.

Much of the Active-Active database settings can be changed after the database has been created. One notable exception is database clustering. Database clustering can't be turned on or off after the database has been created and will remain the same through the lifetime of the database.

## Participating clusters

You can add and remove participating clusters of an Active-Active database to change the topology.
To manage the changes to Active-Active topology, use the [`crdb-cli`]({{< relref "/operate/rs/references/cli-utilities/crdb-cli/" >}}) tool or the participating clusters list in the admin console.
You can make multiple changes at once and changes will be committed when the database configuration is saved.

![add-active-active-participants](/images/rs/add-active-active-participants.png)

### Add participating clusters

All of the existing participating clusters must be online and in a syncing state when you add new participating clusters.

New participating clusters create the Active-Active database instance based on the global Active-Active database configuration.
After you add new participating clusters to an existing Active-Active database,
the new database instance can accept connections and read operations.
The new instance does not accept write operations until it is in the syncing state.

### Remove participating clusters

All of the existing participating clusters must be online and in a syncing state when you remove an online participating clusters.
If you must remove offline participating clusters, you can do this with forced removal.
If a participating cluster that was removed forcefully returns attempts to re-join the cluster,
it will have an out of date on Active-Active database membership.
The joined participating clusters reject updates sent from the removed participating cluster.
To avoid re-join attempts, purge the forcefully removed instance from the participating cluster.

## Replication backlog

Redis databases that use [replication for high availability]({{< relref "/operate/rs/databases/durability-ha/replication.md" >}}) maintain a replication backlog (per shard) to synchronize the primary and replica shards of a database. In addition to the database replication backlog, Active-Active databases maintain a backlog (per shard) to synchronize the database instances between clusters.

By default, both the database and Active-Active replication backlogs are set to one percent (1%) of the database size divided by the number of shards. This can range between 1MB to 250MB per shard for each backlog.

### Change the replication backlog size

Use the [`crdb-cli`]({{< relref "/operate/rs/references/cli-utilities/crdb-cli" >}}) utility to control the size of the replication backlogs. You can set it to `auto` or set a specific size.  

Update the database replication backlog configuration with the `crdb-cli` command shown below.

```text
crdb-cli crdb update --crdb-guid <crdb_guid> --default-db-config "{\"repl_backlog_size\": <size in MB | 'auto'>}"
```

Update the Active-Active (CRDT) replication backlog with the command shown below: 

```text
crdb-cli crdb update --crdb-guid <crdb_guid> --default-db-config "{\"crdt_repl_backlog_size\": <size in MB | 'auto'>}"
```

## Data persistence

Active-Active supports AOF (Append-Only File) data persistence only.  Snapshot persistence is _not_ supported for Active-Active databases and should not be used.

If an Active-Active database is currently using snapshot data persistence, use `crdb-cli` to switch to AOF persistence:
```text
 crdb-cli crdb update --crdb-guid <CRDB_GUID> --default-db-config '{"data_persistence": "aof", "aof_policy":"appendfsync-every-sec"}'
```


