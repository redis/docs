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

You can configure and manage your Active-Active database from either the Cluster Manager UI or the command line.


## Database settings

Most Active-Active database settings can be changed after database creation. One notable exception is database clustering, which can't be turned on or off after the database has been created.

As of Redis Software version 8.0.16, the Cluster Manager UI supports both [global](#change-global-configuration) and [local](#change-local-configuration) configuration changes for Active-Active databases. In earlier versions, configuration changes made in the Cluster Manager UI applied only to the local instance and required additional manual updates for each participating cluster.

### Change global configuration

Global configuration changes are applied to all participating clusters in the Active-Active database. However, if your Active-Active mesh contains local configurations, they will continue to override global settings on the database instances where they are applied.

{{< warning >}}
Applying global configuration changes will override any local settings created using the API or earlier Cluster Manager UI versions. To keep local changes, manage them in the [**Local** configuration tab](#change-local-configuration).
{{< /warning >}}

<br />

{{< multitabs id="change-global-config-methods"
tab1="Cluster Manager UI"
tab2="crdb-cli" >}}

To make global configuration changes in the Cluster Manager UI:

1. Select the Active-Active database from the **Databases** list and go to its **Configuration** screen.

1. While on the **Global** tab, click **Edit**.

    <img src="../../../../../images/rs/screenshots/databases/active-active-databases/global-config-tab.png" alt="The global configuration tab is selected.">

1. Make your configuration changes.

1. Click **Save** to apply the changes globally to all participating clusters.

-tab-sep-

To change the global configuration from the command line, use [`crdb-cli crdb update`]({{< relref "/operate/rs/references/cli-utilities/crdb-cli/crdb/update" >}}):

```sh
crdb-cli crdb update --crdb-guid <guid> --<setting-name> <setting-value>
```

Replace the placeholders `<placeholder>` with your own values.

{{< /multitabs >}}

### Change local configuration

Local configuration changes override global configuration settings and are applied only to the database instance on the current cluster.

To apply changes to a local Active-Active database instance, use one of the following methods:

{{< multitabs id="change-local-config-methods"
tab1="Cluster Manager UI"
tab2="rladmin" >}}

To change the local configuration in the Cluster Manager UI:

1. Select the Active-Active database from the **Databases** list and go to its **Configuration** screen.

1. Go to the **Local** tab.

    <img src="../../../../../images/rs/screenshots/databases/active-active-databases/local-config-tab.png" alt="The local configuration tab is selected.">

1. Click **Edit**, then make your configuration changes.

1. Click **Save** to apply the changes to the current database instance only.

-tab-sep-

To change the local configuration from the command line, use [`rladmin tune db`]({{< relref "/operate/rs/references/cli-utilities/rladmin/tune#tune-db" >}}):

```sh
rladmin tune db { db:<id> | <name> } <setting-name> <setting-value>
```

Replace the placeholders `<placeholder>` with your own values.

{{< /multitabs >}}

### View differences between global and local configuration

In the Cluster Manager UI, an Active-Active database's **Global** configuration tab indicates when a local configuration differs from the global configuration:

{{<image filename="images/rs/screenshots/databases/active-active-databases/local-config-warning.png" alt="On the global configuration tab, a warning is visible that says: 'This Active Active mesh contains local configurations which will not be affected by the global settings'." >}}

If a warning symbol appears next to a setting on the **Global** configuration tab, point to the warning symbol to show details about the local configuration differences:

{{<image filename="images/rs/screenshots/databases/active-active-databases/local-config-warning-details.png" alt="An example that shows memory eviction is set to noeviction globally but allkeys-lru locally." >}}

On the **Local** configuration tab, any locally configured settings that differ from the global settings are marked with a **Local configuration** label:

{{<image filename="images/rs/screenshots/databases/active-active-databases/local-config-tag.png" alt="A local configuration label appears next to Memory eviction allkeys-lru." >}}

## Participating clusters

You can add and remove participating clusters of an Active-Active database to change the topology.
To manage the changes to Active-Active topology, use [`crdb-cli`]({{< relref "/operate/rs/references/cli-utilities/crdb-cli/" >}}) or the participating clusters list in the Cluster Manager UI.

### Add participating clusters

All existing participating clusters must be online and in a syncing state when you add new participating clusters.

New participating clusters create the Active-Active database instance based on the global Active-Active database configuration.
After you add new participating clusters to an existing Active-Active database,
the new database instance can accept connections and read operations.
The new instance does not accept write operations until it is in the syncing state.

{{<note>}}
If an Active-Active database [runs on flash memory]({{<relref "/operate/rs/databases/flash">}}), you cannot add participating clusters that run on RAM only.
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


