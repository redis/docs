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
url: '/operate/rs/7.22/databases/active-active/anage/'
---

You can configure and manage your Active-Active database from either the Cluster Manager UI or the command line.

To change the global configuration of the Active-Active database, use [`crdb-cli`]({{< relref "/operate/rs/7.22/references/cli-utilities/crdb-cli" >}}).

If you need to apply changes locally to one database instance, you use the Cluster Manager UI or [`rladmin`]({{< relref "/operate/rs/7.22/references/cli-utilities/rladmin" >}}).

## Database settings

Many Active-Active database settings can be changed after database creation. One notable exception is database clustering. Database clustering can't be turned on or off after the database has been created.

## Participating clusters

You can add and remove participating clusters of an Active-Active database to change the topology.
To manage the changes to Active-Active topology, use [`crdb-cli`]({{< relref "/operate/rs/7.22/references/cli-utilities/crdb-cli/" >}}) or the participating clusters list in the Cluster Manager UI.

### Add participating clusters

All existing participating clusters must be online and in a syncing state when you add new participating clusters.

New participating clusters create the Active-Active database instance based on the global Active-Active database configuration.
After you add new participating clusters to an existing Active-Active database,
the new database instance can accept connections and read operations.
The new instance does not accept write operations until it is in the syncing state.

{{<note>}}
If an Active-Active database [runs on flash memory]({{<relref "/operate/rs/7.22/databases/auto-tiering">}}), you cannot add participating clusters that run on RAM only.
{{</note>}}

To add a new participating cluster to an existing Active-Active configuration using the Cluster Manager UI:

1. Select the Active-Active database from the **Databases** list and go to its **Configuration** screen.

1. Click **Edit**.

1. In the **Participating clusters** section, go to **Other participating clusters** and click **+ Add cluster**.

1. In the **Add cluster** configuration panel, enter the new cluster's URL, port number, and the admin username and password for the new participating cluster:

    {{<image filename="images/rs/screenshots/databases/active-active-databases/participating-clusters-add-cluster.png" alt="Add cluster panel.">}}

1. Click **Join cluster** to add the cluster to the list of participating clusters. 

1. Click **Save**.


### Remove participating clusters

All existing participating clusters must be online and in a syncing state when you remove an online participating cluster.
If you must remove offline participating clusters, you can forcefully remove them.
If a forcefully removed participating cluster tries to rejoin the cluster,
its Active-Active database membership will be out of date.
The joined participating clusters reject updates sent from the removed participating cluster.
To prevent rejoin attempts, purge the forcefully removed instance from the participating cluster.

To remove a participating cluster using the Cluster Manager UI:

1. Select the Active-Active database from the **Databases** list and go to its **Configuration** screen.

1. Click **Edit**.

1. In the **Participating clusters** section, point to the cluster you want to delete in the **Other participating clusters** list:

    {{<image filename="images/rs/screenshots/databases/active-active-databases/participating-clusters-edit-delete.png" alt="Edit and delete buttons appear when you point to an entry in the Other participating clusters list.">}}

1. Click {{< image filename="/images/rs/buttons/delete-button.png#no-click" alt="The Delete button" width="25px" class="inline" >}} to remove the cluster.

1. Click **Save**.

## Replication backlog

Redis databases that use [replication for high availability]({{< relref "/operate/rs/7.22/databases/durability-ha/replication.md" >}}) maintain a replication backlog (per shard) to synchronize the primary and replica shards of a database. In addition to the database replication backlog, Active-Active databases maintain a backlog (per shard) to synchronize the database instances between clusters.

By default, both the database and Active-Active replication backlogs are set to one percent (1%) of the database size divided by the number of shards. This can range between 1MB to 250MB per shard for each backlog.

### Change the replication backlog size

Use the [`crdb-cli`]({{< relref "/operate/rs/7.22/references/cli-utilities/crdb-cli" >}}) utility to control the size of the replication backlogs. You can set it to `auto` or set a specific size.  

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


