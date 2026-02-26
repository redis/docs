---
Title: Upgrade an Active-Active database
alwaysopen: false
categories:
- docs
- operate
- rs
description: Upgrade an Active-Active database.
linkTitle: Active-Active databases
weight: 70
url: '/operate/rs/7.4/installing-upgrading/upgrading/upgrade-active-active/'
---

When you upgrade an [Active-Active (CRDB) database]({{< relref "/operate/rs/7.4/databases/active-active" >}}), you can also upgrade the CRDB protocol version and feature version.

## CRDB protocol version guidelines

Redis Enterprise Software versions 5.4.2 and later use CRDB protocol version 1 to help support Active-Active features.

CRDB protocol version 1 is backward compatible, which means Redis Enterprise v5.4.2 CRDB instances can understand write operations from instances using the earlier CRDB protocol version 0.

After you upgrade one instance's CRDB protocol to version 1:

- Any instances that use CRDB protocol version 1 can receive updates from both version 1 and version 0 instances.

- However, instances that still use CRDB protocol version 0 cannot receive write updates from version 1 instances.

- After you upgrade an instance from CRDB protocol version 0 to version 1, it automatically receives any missing write operations.

Follow these upgrade guidelines:

- Upgrade all instances of a specific CRDB within a reasonable time frame to avoid temporary inconsistencies between the instances.

- Make sure that you upgrade all instances of a specific CRDB before you do global operations on the CRDB, such as removing instances and adding new instances.

- As of v6.0.20, protocol version 0 is deprecated and support will be removed in a future version.

- To avoid upgrade failures, update all Active-Active databases to protocol version 1 _before_ upgrading Redis Enterprise Software to v6.0.20 or later.

## Feature version guidelines

Starting with version 5.6.0, a new feature version (also called a _feature set version_) helps support new Active-Active features.

When you update the feature version for an Active-Active database, the feature version is updated for all database instances.
    
Follow these upgrade guidelines:

- As of v6.0.20, feature version 0 is deprecated and support will be removed in a future version.

- To avoid upgrade failures, update all Active-Active databases to protocol version 1 _before_ upgrading Redis Enterprise Software to v6.0.20 or later.

## Upgrade Active-Active database instance

To upgrade an Active-Active database (CRDB) instance:

1. [Upgrade Redis Enterprise Software]({{< relref "/operate/rs/7.4/installing-upgrading/upgrading/upgrade-cluster" >}}) on each node in the clusters where the Active-Active instances are located.

1. To see the status of your Active-Active instances, run: 

    ```sh
    rladmin status
    ```

    The statuses of the Active-Active instances on the node can indicate:

    - `OLD REDIS VERSION`
    - `OLD CRDB PROTOCOL VERSION`
    - `OLD CRBD FEATURESET VERSION`

    {{< image filename="/images/rs/crdb-upgrade-node.png" >}}

1. To upgrade each Active-Active instance, including the Redis version and CRDB protocol version, run:

    - To upgrade a database without modules:

        ```sh
        rladmin upgrade db <database_name | database_ID>
        ```
    
    - If the database has modules enabled and new module versions are available in the cluster, run `rladmin upgrade db` with additional parameters to upgrade the module versions when you upgrade the database. See [Upgrade modules]({{< relref "/operate/oss_and_stack/stack-with-enterprise/install/upgrade-module" >}}) for more details.

    If the protocol version is old, read the warning message carefully and confirm.

    {{< image filename="/images/rs/crdb-upgrade-protocol.png" >}}

    The Active-Active instance uses the new Redis version and CRDB protocol version.

    Use the `keep_crdt_protocol_version` option to upgrade the database feature version 
without upgrading the CRDB protocol version.

    If you use this option, make sure that you upgrade the CRDB protocol soon after with the [`rladmin upgrade db`]({{< relref "/operate/rs/7.4/references/cli-utilities/rladmin/upgrade#upgrade-db" >}}) command.

    You must upgrade the CRDB protocol before you update the CRDB feature set version.

1. If the feature set version is old, you must upgrade all of the Active-Active instances. Then, to update the feature set for each active-active database, run:

    ```sh
    crdb-cli crdb update --crdb-guid <CRDB-GUID> --featureset-version yes
    ```

    You can retrieve the `<CRDB-GUID>` with the following command:

    ```sh
    crdb-cli crdb list
    ```

    Look for the fully qualified domain name (CLUSTER-FQDN) of your cluster and use the associated GUID:

    ```sh
    CRDB-GUID                             NAME    REPL-ID  CLUSTER-FQDN
    700140c5-478e-49d7-ad3c-64d517ddc486  aatest  1        aatest1.example.com
    700140c5-478e-49d7-ad3c-64d517ddc486  aatest  2        aatest2.example.com
    ```

1. Update module information in the CRDB configuration using the following command syntax:

    ```sh
    crdb-cli crdb update --crdb-guid <guid> --default-db-config \
    '{ "module_list": 
      [
        { 
          "module_name": "<module1_name>",
          "semantic_version": "<module1_version>" 
        },
        { 
          "module_name": "<module2_name>",
          "semantic_version": "<module2_version>" 
        }
      ]}'
    ```

    For example:

    ```sh
    crdb-cli crdb update --crdb-guid 82a80988-f5fe-4fa5-bca0-aef2a0fd60db --default-db-config \
    '{ "module_list": 
      [
        {
          "module_name": "search",
          "semantic_version": "2.4.6"
        },
        {
          "module_name": "ReJSON",
          "semantic_version": "2.4.5"
        }
      ]}' 
    ```
