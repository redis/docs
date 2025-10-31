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

## Upgrade an Active-Active database

To upgrade an [Active-Active (CRDB) database]({{< relref "/operate/rs/databases/active-active" >}}):

1. [Upgrade Redis Enterprise Software]({{< relref "/operate/rs/installing-upgrading/upgrading/upgrade-cluster" >}}) on each node in the clusters where the Active-Active instances are located.

1. [Check the status](#check-database-status) of all Active-Active database instances.

1. [Upgrade all Active-Active database instances](#upgrade-database-instances) to a later version of Redis.

1. If the status indicates `OLD CRDB FEATURESET VERSION`, [upgrade the featureset version](#upgrade-featureset-version). See [Feature version guidelines](#feature-version-guidelines) for more information.

1. If your Active-Active database uses modules, [update module information](#update-module-information). To check if your database uses modules, run [`rladmin status modules`]({{<relref "/operate/rs/references/cli-utilities/rladmin/status#status-modules">}}):

    ```sh
    rladmin status modules db { db:<ID> | <database-name> }
    ```

## Check database status

To check the status of an Active-Active database instance, run [`rladmin status`]({{<relref "/operate/rs/references/cli-utilities/rladmin/status">}}):

```sh
  rladmin status
```

{{< image filename="/images/rs/crdb-upgrade-node.png" >}}

The statuses of the Active-Active instances on the node can indicate:

- `OLD REDIS VERSION`: The database instance is running a Redis version that is outdated or not fully compatible with the current Redis Enterprise Software cluster version. You should [upgrade the database](#upgrade-database-instances) to a later version of Redis bundled with the cluster's current Redis Enterprise Software version.

- `OLD CRDB PROTOCOL VERSION`: This instance uses an older CRDB protocol. Redis Enterprise Software versions 5.4.2 and later use CRDB protocol version 1. You can upgrade the CRDB protocol version when you [upgrade the Active-Active database instances](#upgrade-database-instances). See [CRDB protocol version guidelines](#crdb-protocol-version-guidelines) for more information.

- `OLD CRDB FEATURESET VERSION`: The database feature set version is outdated. After all [Active-Active database instances are upgraded](#upgrade-database-instances), [upgrade the feature set version](#upgrade-featureset-version). See [Feature version guidelines](#feature-version-guidelines) for more information.

## Upgrade database instances

For each Active-Active database instance:

1. Upgrade the Redis database version and enabled modules with [`rladmin upgrade db`]({{<relref "/operate/rs/references/cli-utilities/rladmin/upgrade#upgrade-db">}}):

    ```sh
    rladmin upgrade db { db:<ID> | <database-name> }
    ```

1. If the CRDB protocol version is old, read the warning message carefully and confirm that you want to update the CRDB protocol. See [CRDB protocol version guidelines](#crdb-protocol-version-guidelines) for more information.

    {{< image filename="/images/rs/crdb-upgrade-protocol.png" >}}

    After confirmation, the Active-Active instance will use the new Redis version and CRDB protocol version.

    {{<note>}}
You can use the `keep_crdt_protocol_version` option to upgrade the database version without upgrading the CRDB protocol version. However, you must upgrade the CRDB protocol before you update the CRDB feature set version.

If you use `keep_crdt_protocol_version`, make sure that you upgrade the CRDB protocol soon after with the [`rladmin upgrade db`]({{< relref "/operate/rs/references/cli-utilities/rladmin/upgrade#upgrade-db" >}}) command.
    {{</note>}}

### CRDB protocol version guidelines

Redis Enterprise Software versions 5.4.2 and later use CRDB protocol version 1 to help support Active-Active features.

CRDB protocol version 1 is backward compatible, which means Redis Enterprise v5.4.2 CRDB instances can understand write operations from instances using the earlier CRDB protocol version 0.

After you upgrade one instance's CRDB protocol to version 1:

- Any instances that use CRDB protocol version 1 can receive updates from both version 1 and version 0 instances.

- However, instances that still use CRDB protocol version 0 cannot receive write updates from version 1 instances.

- After you upgrade an instance from CRDB protocol version 0 to version 1, it automatically receives any missing write operations.

Follow these upgrade guidelines:

- Upgrade all instances of a specific CRDB within a reasonable time frame to avoid temporary inconsistencies between the instances.

- Make sure that you upgrade all instances of a specific CRDB before you perform global operations on the CRDB, such as removing instances and adding new instances.

- As of v6.0.20, protocol version 0 is deprecated and support will be removed in a future version.

- To avoid upgrade failures, update all Active-Active databases to protocol version 1 _before_ upgrading Redis Enterprise Software to v6.0.20 or later.

## Upgrade featureset version

If the feature set version is old, as indicated by the `OLD CRDB FEATURESET VERSION` status:

1. [Upgrade all Active-Active database instances](#upgrade-database-instances) and make sure the CRDB protocol is not outdated.

1. Find the `<CRDB-GUID>` of your Active-Active database.

    You can use the [`crdb-cli crdb list`]({{<relref "/operate/rs/references/cli-utilities/crdb-cli/crdb/list">}}) command:

    ```sh
    crdb-cli crdb list
    ```

    Look for the fully qualified domain name (`CLUSTER-FDQN`) of your cluster and use the associated `GUID`:

    ```sh
    CRDB-GUID                             NAME    REPL-ID  CLUSTER-FQDN
    700140c5-478e-49d7-ad3c-64d517ddc486  aatest  1        aatest1.example.com
    700140c5-478e-49d7-ad3c-64d517ddc486  aatest  2        aatest2.example.com
    ```

1. Update the feature set for each Active-Active database. See [Feature version guidelines](#feature-version-guidelines) for more information.

    ```sh
    crdb-cli crdb update --crdb-guid <CRDB-GUID> --featureset-version yes
    ```

### Feature version guidelines

Starting with version 5.6.0, a new feature version (also called a _feature set version_) helps support new Active-Active features.

The featureset version is an internal version of the Active-Active feature that enables new capabilities and improvements across participating Active-Active clusters. When you update the feature version for an Active-Active database, the feature version is updated for all database instances.
    
Follow these upgrade guidelines:

- As of v6.0.20, feature version 0 is deprecated and support will be removed in a future version.

- To avoid upgrade failures, make sure all your Active-Active databases are configured with the latest feature set version before upgrading to Redis Enterprise Software 6.0.20 or later.

## Update module information

If your Active-Active database uses modules:

1. Update module information in the CRDB configuration using the following command syntax:

    ```sh
    crdb-cli crdb update --crdb-guid <CRDB-GUID> --update-db-config-modules true
    ```

1. `crdb-cli` will ask you to verify all Active-Active database instances and their modules have been updated before you enter `y` to continue:

    ```
    Verify that all CRDB database instances and their modules have been updated.
    Do you want to continue? (y/n): y
    ```
