---
Title: "Upgrade a database to Search\_2.x"
alwaysopen: false
categories:
- docs
- operate
- stack
description: "Upgrade a database from Search 1.x to Search\_2.x."
linkTitle: Upgrade a database
module: RediSearch
weight: 30
---
RediSearch 2.x includes some significant architectural changes that improve functionality.
The main change is that RediSearch 2.x stores indexes outside of the Redis database that contains the data.
This makes commands more efficient and improves replication between clusters because the index changes are managed by the participating clusters rather than being synchronized with the data.

This change allows databases with RediSearch to support:

- [Active-Active databases]({{< relref "/operate/oss_and_stack/stack-with-enterprise/search/search-active-active" >}})
- Database cluster re-sharding
- Replica Of to a sharded destination database
- [EXPIRE]({{< relref "/commands/ttl" >}}) of documents reflected in the index

In addition, RediSearch 2.x indexes data that already existed in the database at the time that the index was created.

To upgrade a Redis Enterprise Software database with RediSearch 1.x to RediSearch 2.x, you have to set up a new database with RediSearch 2.x and use the `RediSearch_Syncer.py` script to replicate the data from the old database into the new database.

{{< note >}}
After you create the database or after you replicate the data, [create an index]({{< relref "commands/ft.create" >}}) with a prefix or filter that defines the keys that you want to index.
{{< /note >}}

## Prerequisites

Install Python 3 on the host where you plan to run the synchronization script:

```sh
sudo apt install python3
```

## Limitations

- Suggestions (`FT.SUG` APIs) and spell check dictionaries are not replicated from the source database. You need to add them manually.
- If there are multiple indexes on the source and the documents do not have prefixes that identify them with an index, RediSearch 2.x can't index the documents in their respective indexes.
- The `NOSAVE` option is no longer supported. Indexes created with the `NOSAVE` option can't be upgraded.
- Databases that contain temporary indexes can't be upgraded.
- Any attempt to add, delete, or modify an index during the upgrade will cause the replication process to fail. During the upgrade, the source database can only receive `FT.ADD` and `FT.DEL` commands.

## Replicate data from RediSearch 1.x to RediSearch 2.x

To replicate a RediSearch 1.x database to a RediSearch 2.x database:

1. Sign in to the admin console of the Redis Enterprise cluster where you want to host the new RediSearch 2.x database.

1. [Add the RediSearch 2.x module](#add-new-module) to the cluster.

1. [Create a new database](#create-db) with RediSearch 2.x.

1. [Migrate data](#migrate-data) to the RediSearch 2.x database.

### Add RediSearch 2.x to the cluster {#add-new-module}

1. Download the RediSearch 2.x module package from the [Redis Download Center](https://redis.io/downloads).

1. In the Redis Enterprise admin console, select **settings**.

1. In **redis modules**, select the **Add module** button.

    {{< image filename="/images/rs/upgrade_module.png" >}}

1. Use the file browser to select the module package and upload it to the cluster.

### Create a RediSearch 2.x database {#create-db}

1. [Create a database]({{< relref "/operate/rs/databases/create" >}}) and configure its settings.

1. In the **Redis Modules** section:

    1. Select the **Add** button:
    
        {{<image filename="images/rs/icon_add.png" width="30px" alt="The Add icon">}}
    
    1. Select **RediSearch 2** from the dropdown list.

    1. Select the **OK** button to confirm:

        {{<image filename="images/rs/icon_save.png" width="30px" alt="The Save icon">}}

1. Select the **Activate** button to create the database.

### Migrate data {#migrate-data}

1. Download the RediSearch_Syncer package for your operating system:

    - [RedHat Enterprise Linux 7](http://redismodules.s3.amazonaws.com/redisearch/RediSearchSyncer/RediSearchSyncer-rhel7.zip)
    - [Ubuntu 18.04](http://redismodules.s3.amazonaws.com/redisearch/RediSearchSyncer/RediSearchSyncer-bionic.zip)
    - [Ubuntu 16.04](http://redismodules.s3.amazonaws.com/redisearch/RediSearchSyncer/RediSearchSyncer-xenial.zip)
    - [Ubuntu 14.04](http://redismodules.s3.amazonaws.com/redisearch/RediSearchSyncer/RediSearchSyncer-trusty.zip)

1. Extract the package: 

    ```sh
    unzip <package_name>
    ```

1. In the extracted directory, run the RediSearch_Syncer.py script:

    ```sh
    python3 RediSearch_Syncer.py -d <destination_url> -s <source_url> [--add-prefix <prefix>]
    ```

    Replace the following variables with your own values:

    - `destination url` - The replication URL of the RediSearch 2.x database. To find this value, go to the database configuration screen in the admin console and select **Get Replica of source URL**.

    - `source url` - The replication URL of the RediSearch 1.x database. To find this value, go to the database configuration screen in the admin console and select **Get Replica of source URL**.

    - `--add-prefix <prefix>` (optional) - Adds a prefix to all of the hashes that are replicated to the new database.

        {{<note>}}
Only use the `add-prefix` option if you want to index all of the hashes in the same index in the source database.
        {{</note>}}

    The script shows a table with the progress of the replication process.
    Press **F5** to see the updated status.

    For example:

    ```sh
    python RediSearch_Syncer.py -d redis://admin:IBrS0xaL6rShfB1wKTtUkcQG1g3UWAlTd53AotPdTcQvGIVP@redis-19472.cluster1.local:19472 -s redis://admin:1GjFuUbBqTSPDbRfaxEPLSoXpFmRdFxmBKMD0BuxwMJ2DEaO@redis-19636.cluster1.local:19636
    ```

1. Stop the processes that are sending requests to the source database so all of the data gets synchronized to the destination database.

1. Run `FT.INFO` on both source and destination databases and compare the number of indexed documents. The replication process is complete when the number of indexed documents is the same in both databases.

1. When the status field is `st_in_sync`, you can press **Ctrl-C** to cancel the synchronization process.

1. Press **Q** to quit the `RediSearch_Syncer.py`.

You can now redirect your database connections to the RediSearch 2.x database.
