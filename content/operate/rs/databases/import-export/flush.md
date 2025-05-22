---
Title: Flush database data
alwaysopen: false
categories:
- docs
- operate
- rs
description: To delete the data in a database without deleting the database, you can
  use Redis CLI to flush it from the database. Learn how to flush data from standard databases,
  OSS Cluster API databases, and Active-Active databases using Redis CLI, the Cluster Manager UI, 
  and the Redis Software REST API.
linkTitle: Flush database
weight: 40
---
To delete the data in a database without deleting the database configuration,
you can flush the data from the database.

You can use the Cluster Manager UI to flush data from Active-Active databases.

{{< warning title="Data Loss Warning" >}}
The flush command deletes ALL in-memory and persistence data in the database.
We recommend that you [back up your database]({{< relref "/operate/rs/databases/import-export/schedule-backups.md" >}}) before you flush the data.
{{< /warning >}}

## Flush data from a database

From the command line, you can flush a database with the redis-cli command or with your favorite Redis client.

To flush data from a database with the redis-cli, run:

```sh
redis-cli -h <hostname> -p <portnumber> -a <password> flushall
```

Example:

```sh
redis-cli -h redis-12345.cluster.local -p 9443 -a xyz flushall
```

{{< note >}}
Port 9443 is the default [port configuration]({{< relref "/operate/rs/networking/port-configurations#https://docs.redis.com/latest/rs/networking/port-configurations#ports-and-port-ranges-used-by-redis-enterprise-software" >}}).
{{< /note >}}

## Flush data from an OSS Cluster API database

When using the OSS Cluster API, the `FLUSHDB` command only flushes the keys of the shard you're connected to, not all keys in the database. To flush all data from an OSS Cluster API database, you need to connect to each endpoint IP address and execute the flush command.

Follow these steps to flush all data from an OSS Cluster API database:

1. Find all IP addresses associated with the database endpoint using the `dig` command:

   ```sh
   dig +noall +answer <database-endpoint>
   ```

2. Connect to each IP address using redis-cli and execute the `FLUSHDB` command:

   ```sh
   redis-cli -h <ip-address> -p <port> flushdb
   ```

### Example

1. Find all IP addresses for the database endpoint:

   ```sh
   $ dig +noall +answer redis-19674.test2f4e15b0.cs.redislabs.com
   redis-19674.test2f4e15b0.cs.redislabs.com. 5 IN A 52.200.243.146
   redis-19674.test2f4e15b0.cs.redislabs.com. 5 IN A 54.235.52.171
   ```

2. Connect to each IP address and flush the data:

   ```sh
   $ redis-cli -h 52.200.243.146 -p 19674 flushdb
   OK
   $ redis-cli -h 54.235.52.171 -p 19674 flushdb
   OK
   ```

This ensures that all shards in the OSS Cluster API database are flushed properly.


## Flush data from an Active-Active database

When you flush an Active-Active database (formerly known as CRDB), all of the replicas flush their data at the same time.

To flush data from an Active-Active database, use one of the following methods:

- Cluster Manager UI

    1. On the **Databases** screen, select the database from the list, then click **Configuration**.

    1. Click {{< image filename="/images/rs/buttons/button-toggle-actions-vertical.png#no-click" alt="Toggle actions button" width="22px" class="inline" >}} to open a list of additional actions.

    1. Select **Flush database**.

    1. Enter the name of the Active-Active database to confirm that you want to flush the data.

    1. Click **Flush**.

- Command line

    1. To find the ID of the Active-Active database, run:

        ```sh
        crdb-cli crdb list
        ```

        For example:

        ```sh
        $ crdb-cli crdb list
        CRDB-GUID                                NAME                 REPL-ID CLUSTER-FQDN
        a16fe643-4a7b-4380-a5b2-96109d2e8bca     crdb1                1       cluster1.local
        a16fe643-4a7b-4380-a5b2-96109d2e8bca     crdb1                2       cluster2.local
        a16fe643-4a7b-4380-a5b2-96109d2e8bca     crdb1                3       cluster3.local
        ```

    1. To flush the Active-Active database, run:

        ```sh
        crdb-cli crdb flush --crdb-guid <CRDB-GUID>
        ```

        The command output contains the task ID of the flush task, for example:

        ```sh
        $ crdb-cli crdb flush --crdb-guid a16fe643-4a7b-4380-a5b2-96109d2e8bca
        Task 63239280-d060-4639-9bba-fc6a242c19fc created
        ---> Status changed: queued -> started
        ```

    1. To check the status of the flush task, run:

        ```sh
        crdb-cli task status --task-id <Task-ID>
        ```

        For example:

        ```sh
        $ crdb-cli task status --task-id 63239280-d060-4639-9bba-fc6a242c19fc
        Task-ID: 63239280-d060-4639-9bba-fc6a242c19fc
        CRDB-GUID: -
        Status: finished
        ```

- REST API

    1. To find the ID of the Active-Active database, use [`GET /v1/crdbs`]({{< relref "/operate/rs/references/rest-api/requests/crdbs#get-all-crdbs" >}}):

        ```sh
        GET https://[host][:port]/v1/crdbs
        ```

    1. To flush the Active-Active database, use [`PUT /v1/crdbs/{guid}/flush`]({{< relref "/operate/rs/references/rest-api/requests/crdbs/flush#put-crdbs-flush" >}}):

        ```sh
        PUT https://[host][:port]/v1/crdbs/<guid>/flush
        ```

        The command output contains the task ID of the flush task.

    1. To check the status of the flush task, use [`GET /v1/crdb_tasks`]({{< relref "/operate/rs/references/rest-api/requests/crdb_tasks#get-crdb_task" >}}):

        ```sh
        GET https://[host][:port]/v1/crdb_tasks/<task-id>
        ```
