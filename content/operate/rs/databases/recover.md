---
Title: Recover a failed database
alwaysopen: false
categories:
- docs
- operate
- rs
- kubernetes
description: Recover a database after the cluster fails or the database is corrupted.
linktitle: Recover
weight: 35
---
When a cluster fails or a database is corrupted, you must:

1. [Restore the cluster configuration]({{< relref "/operate/rs/clusters/cluster-recovery.md" >}}) from the CCS files
1. Recover the databases with their previous configuration and data

To restore data to databases in the new cluster,
you must restore the database persistence files (backup, AOF, or snapshot files) to the databases.
These files are stored in the [persistence storage location]({{< relref "/operate/rs/installing-upgrading/install/plan-deployment/persistent-ephemeral-storage" >}}).

The database recovery process includes:

1. If the cluster failed, [recover the cluster]({{< relref "/operate/rs/clusters/cluster-recovery.md" >}}).
1. Identify recoverable databases.
1. Restore the database data.
1. Verify that the databases are active.

## Prerequisites

- Before you start database recovery, make sure that the cluster that hosts the database is healthy.
    In the case of a cluster failure,
    you must [recover the cluster]({{< relref "/operate/rs/clusters/cluster-recovery.md" >}}) before you recover the databases.

- We recommend that you allocate new persistent storage drives for the new cluster nodes.
    If you use the original storage drives,
    make sure to back up all files on the old persistent storage drives to another location.

## Recover databases

After you prepare the cluster that hosts the database,
you can run the recovery process from the [`rladmin`]({{< relref "/operate/rs/references/cli-utilities/rladmin" >}})
command-line interface (CLI).

To recover the database:

1. Mount the persistent storage drives with the recovery files to the new nodes.
    These drives must contain the cluster configuration backup files and database persistence files.

    {{< note >}}
Make sure that the user `redislabs` has permissions to access the storage location
of the configuration and persistence files on each of the nodes.
    {{< /note >}}

    If you use local persistent storage, place all of the recovery files on each of the cluster nodes.

1. To see which databases are recoverable, run [`rladmin recover list`]({{<relref "/operate/rs/references/cli-utilities/rladmin/recover#recover-list">}}):

    ```sh
    rladmin recover list
    ```

    The status for each database can be either ready for recovery or missing files.
    An indication of missing files in any of the databases can result from:

    - The storage location is not found - Make sure the recovery path is set correctly on all nodes in the cluster.
    - Files are not found in the storage location - Move the files to the storage location.
    - No permission to read the files - Change the file permissions so that redislabs:redislabs has 640 permissions.
    - Files are corrupted - Locate copies of the files that are not corrupted.

    If you cannot resolve the issues, contact [Redis support](https://redis.com/company/support/).

1. Recover the database using one of the following [`rladmin recover`]({{< relref "/operate/rs/references/cli-utilities/rladmin/recover" >}}) commands:

    - Recover all databases from the persistence files located in the persistent storage drives:
    
        ```sh
        rladmin recover all
        ```

    - Recover a single database from the persistence files located in the persistent storage drives:
    
        - By database ID:

            ```sh
            rladmin recover db db:<id>
            ```

        - By database name:
        
            ```sh
            rladmin recover db <name>
            ```

    - Recover only the database configuration for a single database (without the data):
    
        ```sh
        rladmin recover db <name> only_configuration
        ```

    {{< note >}}
- If persistence was not configured for the database, the database is restored empty.
- For Active-Active databases that still have live instances, we recommend that you recover the configuration for the failed instances and let the  data update from the other instances.
- For Active-Active databases where all instances need to be recovered, we recommend you recover one instance with the data and only recover the configuration for the other instances.
   The empty instances then update from the recovered data.
- If the persistence files of the databases from the old cluster are not stored in the persistent storage location of the new node,
   you must first map the recovery path of each node to the location of the old persistence files.
   To do this, run the `node <id> recovery_path set` command in rladmin.
   The persistence files for each database are located in the persistent storage path of the nodes from the old cluster, usually under `/var/opt/redislabs/persist/redis`.
    {{< /note >}}  

1. To verify that the recovered databases are now active, run: 

    ```sh
    rladmin status
    ```

After the databases are recovered, make sure your Redis clients can successfully connect to the databases.

## Configure automatic recovery

If you enable the automatic recovery cluster policy, Redis Enterprise tries to quickly recover as much data as possible from before the disaster.

To enable automatic recovery, [update the cluster policy]({{< relref "/operate/rs/references/rest-api/requests/cluster/policy#put-cluster-policy" >}}) using the REST API:

```sh
PUT /v1/cluster/policy
{
  "auto_recovery": true
}
```

Redis Enterprise tries to recover databases from the best existing persistence files. If a persistence file isn't available, which can happen if its host node is down, the automatic recovery process waits for it to become available.

For each database, you can set the `recovery_wait_time` to define how many seconds the database waits for a persistence file to become available before recovery. After the wait time elapses, the recovery process continues, which can result in partial or full data loss. The default value is `-1`, which means to wait forever. Short wait times can increase the risk of potential data loss.

To change `recovery_wait_time` for an existing database using the REST API:

```sh
PUT /v1/bdbs/<bdb_uid>
{
  "recovery_wait_time": 3600
}
```

You can also set `recovery_wait_time` when you [create a database]({{< relref "/operate/rs/references/rest-api/requests/bdbs#post-bdbs-v1" >}}) using the REST API.
