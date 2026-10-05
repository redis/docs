---
Title: Upgrade an Active-Active database
alwaysopen: false
categories:
- docs
- operate
- rs
description: How to upgrade an Active-Active database.
linkTitle: Active-Active databases
weight: 70
---

To upgrade an [Active-Active database]({{< relref "/operate/rs/databases/active-active" >}}) (formerly known as CRDB), send a single upgrade request with `crdb-cli` or the REST API. The request upgrades the database on each participating cluster in the Active-Active database, so you don't need to upgrade each one separately.

The Active-Active database upgrade:

- Upgrades the Redis version and modules of the database on all participating clusters.

- Updates the module information in the Active-Active database configuration to match the upgraded databases.

- Upgrades the CRDB feature set version after the database is upgraded on all participating clusters.

## Default Redis database versions {#default-db-versions}

When you upgrade an Active-Active database, it uses the latest Redis version bundled with Redis Software unless you specify a different version.

For the default Redis database version of each Redis Software release, see [Default Redis database versions]({{< relref "/operate/rs/installing-upgrading/upgrading/upgrade-database#default-db-versions" >}}).

## Upgrade prerequisites

Before upgrading an Active-Active database:

- Review the relevant [release notes]({{< relref "/operate/rs/release-notes" >}}) for any preparation instructions.

- [Upgrade Redis Software]({{< relref "/operate/rs/installing-upgrading/upgrading/upgrade-cluster" >}}) on each node of every participating cluster in the Active-Active database. A coordinated upgrade requires Redis Software version 8.0.18 or later on all participating clusters.

- Verify that the target database version is [supported]({{< relref "/operate/rs/installing-upgrading/upgrading/upgrade-database#db-versions-table" >}}) by the Redis Software version of every participating cluster.

- [Check the status](#check-database-status) of the Active-Active database on each participating cluster.

- Check that your client libraries are compatible with the new Redis database version. See the [database upgrade prerequisites]({{< relref "/operate/rs/installing-upgrading/upgrading/upgrade-database#upgrade-prerequisites" >}}) for details.

- To avoid data loss during the upgrade, [back up your data]({{< relref "/operate/rs/databases/import-export/schedule-backups" >}}).

## Upgrade an Active-Active database

To upgrade an Active-Active database:

{{< multitabs id="upgrade-active-active-db"
    tab1="crdb-cli"
    tab2="REST API" >}}

1. Complete all [prerequisites](#upgrade-prerequisites) before starting the upgrade.

1. Find the `<CRDB-GUID>` of your Active-Active database with the [`crdb-cli crdb list`]({{< relref "/operate/rs/references/cli-utilities/crdb-cli/crdb/list" >}}) command:

    ```sh
    crdb-cli crdb list
    ```

    Look for the fully qualified domain name (`CLUSTER-FQDN`) of your cluster and use the associated `GUID`:

    ```sh
    CRDB-GUID                             NAME    REPL-ID  CLUSTER-FQDN
    700140c5-478e-49d7-ad3c-64d517ddc486  aatest  1        aatest1.example.com
    700140c5-478e-49d7-ad3c-64d517ddc486  aatest  2        aatest2.example.com
    ```

1. Upgrade the Active-Active database with [`crdb-cli crdb upgrade`]({{< relref "/operate/rs/references/cli-utilities/crdb-cli/crdb/upgrade" >}}). Use the `--preserve-roles` option to keep the current primary shard placement and prevent the clusters from becoming unbalanced.

    ```sh
    crdb-cli crdb upgrade --crdb-guid <CRDB-GUID> --preserve-roles
    ```

    To upgrade the database to a version other than the default version, use the `--redis-version` option:

    ```sh
    crdb-cli crdb upgrade --crdb-guid <CRDB-GUID> --redis-version <version> --preserve-roles
    ```

    For additional options, see the [`crdb-cli crdb upgrade` parameters]({{< relref "/operate/rs/references/cli-utilities/crdb-cli/crdb/upgrade#parameters" >}}).

    By default, the command waits for the upgrade to finish and reports status changes:

    ```sh
    $ crdb-cli crdb upgrade --crdb-guid <CRDB-GUID> --preserve-roles
    Task <task-id> created
      ---> CRDB GUID Assigned: crdb:<CRDB-GUID>
      ---> Status changed: queued -> started
      ---> Status changed: started -> finished
    ```

    If you use `--no-wait`, check the upgrade's progress with [`crdb-cli task status`]({{< relref "/operate/rs/references/cli-utilities/crdb-cli/task/status" >}}):

    ```sh
    crdb-cli task status --task-id <task-id>
    ```

1. Use [`rladmin status databases extra all`]({{< relref "/operate/rs/references/cli-utilities/rladmin/status#status-databases" >}}) on each participating cluster to verify that the Redis version is set to the expected value.

    ```sh
    rladmin status databases extra all
    ```

-tab-sep-

1. Complete all [prerequisites](#upgrade-prerequisites) before starting the upgrade.

1. Find the `<crdb-guid>` of your Active-Active database with a [`GET /v1/crdbs`]({{< relref "/operate/rs/references/rest-api/requests/crdbs" >}}) REST API request or the [`crdb-cli crdb list`]({{< relref "/operate/rs/references/cli-utilities/crdb-cli/crdb/list" >}}) command.

1. Use an [upgrade Active-Active database]({{< relref "/operate/rs/references/rest-api/requests/crdbs/upgrade" >}}) REST API request. Use the `preserve_roles` option to keep the current primary shard placement and prevent the clusters from becoming unbalanced.

    ```sh
    POST https://<host>:<port>/v1/crdbs/<crdb-guid>/upgrade
    {
        "preserve_roles": true,
        // Additional fields
    }
    ```

    For additional options, see the [request body]({{< relref "/operate/rs/references/rest-api/requests/crdbs/upgrade#request-body" >}}) section of the Active-Active database upgrade requests reference.

1. Check the upgrade's progress with the ID of the [CRDB task]({{< relref "/operate/rs/references/rest-api/requests/crdb_tasks#get-crdb_task" >}}) returned by the upgrade request:

    ```sh
    GET https://<host>:<port>/v1/crdb_tasks/<task-id>
    ```

    The task's `status` is `finished` when the upgrade is complete.

{{< /multitabs >}}

## Check database status

To check the status of the Active-Active database on a participating cluster, run [`rladmin status`]({{< relref "/operate/rs/references/cli-utilities/rladmin/status" >}}) on a node of that cluster:

```sh
rladmin status
```

![](/images/rs/crdb-upgrade-node.png)

The statuses of the Active-Active database on the cluster can indicate:

- `OLD REDIS VERSION`: The database is running a Redis version that is outdated or not fully compatible with the current Redis Software cluster version. [Upgrade the Active-Active database](#upgrade-an-active-active-database) to a later version of Redis bundled with the cluster's current Redis Software version.

- `OLD CRDB PROTOCOL VERSION`: The database uses an older CRDB protocol. The upgrade updates the CRDB protocol version unless you use the `--keep-crdt-protocol-version` option (`keep_crdt_protocol_version` in the REST API). See [CRDB protocol version guidelines](#crdb-protocol-version-guidelines) for more information.

- `OLD CRDB FEATURESET VERSION`: The database feature set version is outdated. The upgrade updates the feature set version after the database is upgraded on all participating clusters, unless you use the `--keep-crdt-featureset-version` option (`keep_crdt_featureset_version` in the REST API). See [Feature set version guidelines](#feature-set-version-guidelines) for more information.

### CRDB protocol version guidelines

The CRDB protocol version determines how the database on each participating cluster replicates write operations to the others. By default, the upgrade updates the CRDB protocol version on all participating clusters.

If you use the `keep_crdt_protocol_version` option, the database is upgraded without updating the CRDB protocol version. In this case:

- You must upgrade the CRDB protocol version before the CRDB feature set version can be updated.

- Upgrade the CRDB protocol version soon after with another [upgrade request](#upgrade-an-active-active-database) without the `keep_crdt_protocol_version` option.

### Feature set version guidelines

The feature set version is an internal version of the Active-Active database that enables new capabilities and improvements across participating clusters. When the feature set version is updated, it is updated for the database on all participating clusters.

By default, the upgrade updates the feature set version after the database is upgraded on all participating clusters. If you use the `keep_crdt_featureset_version` option, the upgrade keeps the current feature set version.

## Upgrade limitations

- When upgrading an Active-Active database from Redis 7.4 or earlier to version 8.0 or later, if you add a module to the database during the upgrade, you cannot use that module's commands, such as [Redis Search](https://redis.io/docs/latest/commands/?group=search) and [JSON](https://redis.io/docs/latest/commands/?group=json) commands, until the database has been upgraded on all participating clusters. These commands are not blocked automatically, and running these commands before finishing the upgrade process can cause syncer crashes.

    This limitation applies only when you add modules to a database during the upgrade. If the database already had modules configured before the upgrade, this limitation does not apply.
