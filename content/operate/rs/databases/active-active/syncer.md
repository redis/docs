---
Title: Syncer process
alwaysopen: false
categories:
- docs
- operate
- rs
description: Detailed information about the syncer process and its role in distributed
  databases.
linktitle: Syncer process
weight: 90
---

## Syncer process

Each node in a cluster containing an instance of an Active-Active database hosts a process called the syncer.
The syncer process:

1. Connects to the proxy on another participating cluster
1. Reads data from that database instance
1. Writes the data to the local cluster's primary(master) shard

Some replication capabilities are also included in [Redis Open Source]({{< relref "/operate/oss_and_stack/management/replication" >}}).

The primary (also known as master) shard at the top of the primary-replica tree creates a replication ID.
This replication ID is identical for all replicas in that tree.
When a new primary is appointed, the replication ID changes, but a partial sync from the previous ID is still possible.


In a partial sync, the backlog of operations since the offset are transferred as raw operations.
In a full sync, the data from the primary is transferred to the replica as an RDB file which is followed by a partial sync.

Partial synchronization requires a backlog large enough to store the data operations until connection is restored. See [replication backlog]({{< relref "/operate/rs/databases/active-active/manage#replication-backlog" >}}) for more info on changing the replication backlog size.

### Syncer in Active-Active replication

In the case of an Active-Active database:

- Multiple past replication IDs and offsets are stored to allow for multiple syncs
- The [Active-Active replication backlog]({{< relref "/operate/rs/databases/active-active/manage#replication-backlog" >}}) is also sent to the replica during a full sync.

{{< warning >}}
Full sync triggers heavy data transfers between geo-replicated instances of an Active-Active database.
{{< /warning >}}

An Active-Active database uses partial synchronization in the following situations:

- Failover of primary shard to replica shard
- Restart or crash of replica shard that requires sync from primary
- Migrate replica shard to another node
- Migrate primary shard to another node as a replica using failover and replica migration
- Migrate primary shard and preserve roles using failover, replica migration, and second failover to return shard to primary

{{< note >}}
Synchronization of data from the primary shard to the replica shard is always a full synchronization.
{{< /note >}}

## Troubleshooting syncer errors

### Unrecoverable syncer errors

Some syncer errors are unrecoverable and cause the syncer to exit with exit code 4. When this occurs, the Data Management Controller (DMC) automatically sets the `crdt_sync` or `replica_sync` value to `stopped`.

#### Restart syncer for regular databases

To restart a regular database's syncer after an unrecoverable error, [update the database configuration]({{<relref "/operate/rs/references/rest-api/requests/bdbs#put-bdbs">}}) with the REST API to enable `sync`:


```sh
curl -v -k -u <username>:<password> -X PUT \
  -H "Content-Type: application/json" \
  -d '{"sync": "enabled"}' \
  https://<host>:<port>/v1/bdbs/<database-id>
```

#### Restart syncer for Active-Active databases

To restart an Active-Active database's syncer after an unrecoverable error, use one of the following methods.

-  For each participating cluster, [update the database configuration]({{<relref "/operate/rs/references/rest-api/requests/bdbs#put-bdbs">}}) with the REST API to enable `sync`:

   ```sh
   curl -v -k -u <username>:<password> -X PUT \
     -H "Content-Type: application/json" \
     -d '{"sync": "enabled"}' \
     https://<host>:<port>/v1/bdbs/<database-id>
   ```

- Run [`crdb-cli crdb update`]({{<relref "/operate/rs/references/cli-utilities/crdb-cli/crdb/update">}}):

   ```sh
   crdb-cli crdb update --crdb-guid <crdb-guid> --force
   ```

{{< note >}}
Replace `<username>`, `<password>`, `<host>`, `<port>`, `<database-id>`, and `<crdb-guid>` with your actual values.
{{< /note >}}