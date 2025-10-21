---
Title: Configure database persistence
alwaysopen: false
categories:
- docs
- operate
- rs
description: How to configure database persistence with either an append-only file
  (AOF) or snapshots.
linktitle: Persistence
weight: 30
url: '/operate/rs/7.22/databases/configure/atabase-persistence/'
---

Data is stored in RAM or a combination of RAM and flash memory ([Auto Tiering]({{< relref "/operate/rs/7.22/databases/auto-tiering/" >}})), which risks data loss during process or server failures. Redis Enterprise Software supports multiple methods to persist data to disk on a per-database basis to ensure data durability.

You can configure [persistence](https://redis.com/redis-enterprise/technology/durable-redis/) during database creation or by editing an existing database. Although the persistence model can be changed dynamically, the switch can take time depending on the database size and the models being switched.

## Configure database persistence

You can configure persistence when you [create a database]({{< relref "/operate/rs/7.22/databases/create" >}}), or you can edit an existing database's configuration:

1. From the **Databases** list, select the database, then select **Configuration**.

1. Select **Edit**.

1. Expand the **Durability** section.

1. For **Persistence**, select an [option](#data-persistence-options) from the list.

1. Select **Save**.

## Data persistence options

There are six options for persistence in Redis Enterprise Software:

|  **Options** | **Description** |
|  ------ | ------ |
|  None | Data is not persisted to disk at all. |
|  Append-only file (AOF) - fsync every write | Data is fsynced to disk with every write. |
|  Append-only file (AOF) - fsync every 1 sec | Data is fsynced to disk every second. |
|  Snapshot, every 1 hour | A snapshot of the database is created every hour. |
|  Snapshot, every 6 hours | A snapshot of the database is created every 6 hours. |
|  Snapshot, every 12 hours | A snapshot of the database is created every 12 hours. |

## Select a persistence strategy

When selecting your persistence strategy, you should take into account your tolerance for data loss and performance needs. There will always be tradeoffs between the two.
The fsync() system call syncs data from file buffers to disk. You can configure how often Redis performs an fsync() to most effectively make tradeoffs between performance and durability for your use case.
Redis supports three fsync policies: every write, every second, and disabled.

Redis also allows snapshots through RDB files for persistence. Within Redis Enterprise, you can configure both snapshots and fsync policies.

For any high availability needs, use replication to further reduce the risk of data loss.

**For use cases where data loss has a high cost:**

Append-only file (AOF) - fsync every write - Redis Enterprise sets the Redis directive `appendfsyncalways`.  With this policy, Redis will wait for the write and the fsync to complete prior to sending an acknowledgement to the client that the data has written. This introduces the performance overhead of the fsync in addition to the execution of the command. The fsync policy always favors durability over performance and should be used when there is a high cost for data loss.

**For use cases where data loss is tolerable only limitedly:**

Append-only file (AOF) - fsync every 1 sec - Redis will fsync any newly written data every second. This policy balances performance and durability and should be used when minimal data loss is acceptable in the event of a failure. This is the default Redis policy. This policy could result in between 1 and 2 seconds worth of data loss but on average this will be closer to one second.

{{< note >}}
If you use AOF for persistence, enable replication to improve performance. When both features are enabled for a database, the replica handles persistence, which prevents any performance impact on the master.
{{< /note >}}

**For use cases where data loss is tolerable or recoverable for extended periods of time:**

- Snapshot, every 1 hour - Performs a full backup every hour.
- Snapshot, every 6 hour - Performs a full backup every 6 hours.
- Snapshot, every 12 hour - Performs a full backup every 12 hours.
- None - Does not back up or persist data at all.

## Append-only file (AOF) vs snapshot (RDB)

Now that you know the available options, to assist in making a decision
on which option is right for your use case, here is a table about the
two:

|  **Append-only File (AOF)** | **Snapshot (RDB)** |
|------------|-----------------|
|  More resource intensive | Less resource intensive |
|  Provides better durability (recover the latest point in time) | Less durable |
|  Slower time to recover (Larger files) | Faster recovery time |
|  More disk space required (files tend to grow large and require compaction) | Requires less resources (I/O once every several hours and no compaction required) |

## Active-Active data persistence 

Active-Active databases support AOF persistence only.  Snapshot persistence is not supported for Active-Active databases.

If an Active-Active database is using snapshot persistence, use `crdb-cli` to switch to AOF persistence:

```text
crdb-cli crdb update --crdb-guid <CRDB_GUID> --default-db-config \
   '{"data_persistence": "aof", "aof_policy":"appendfsync-every-sec"}'
```

## Auto Tiering data persistence

Auto Tiering flash storage is not considered persistent storage.

Flash-based databases are expected to hold larger datasets, and shard repair times can take longer after node failures. To better protect the database against node failures with longer repair times, consider enabling master and replica dual data persistence.

However, dual data persistence with replication adds some processor
and network overhead, especially for cloud configurations
with network-attached persistent storage, such as EBS-backed
volumes in AWS.

There may be times when performance is critical for your use case and
you don't want to risk data persistence adding latency.

You can enable or turn off data persistence on the master shards using the
following `rladmin` command:

```sh
rladmin tune db <database_ID_or_name> master_persistence <disabled | enabled>
```
