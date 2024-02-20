---
Title: Consistency during replication
alwaysopen: false
categories:
- docs
- operate
- rs
description: Explains the order write operations are communicated from app to proxy
  to shards for both the weak consistency model and the strong consistency model.
linkTitle: Consistency
weight: 20
---
Redis Enterprise Software comes with the ability to replicate data
to another database instance for high availability and persist in-memory data on
disk permanently for durability. With the WAIT command, you can
control the consistency and durability guarantees for the replicated and
persisted database.

Any updates that are issued to the database are typically performed with
the following flow shown below;

1. Application issues a write
2. Proxy communicates with the correct primary (also known as master) "shard" in the system that contains the given key
3. The shard writes the data and sends an acknowledgment to the proxy
4. The proxy sends the acknowledgment back to the application
5. The write is communicated from master to replica
6. Replica acknowledges the write back to the master
7. The write to a replica is persisted to disk
8. The write is acknowledged within the replica

{{< image filename="/images/rs/weak-consistency.png" >}}

With the WAIT command, applications can ask to wait for
acknowledgments only after replication or persistence is confirmed on
the replica. The flow of a write operation with the WAIT command is
shown below:

1. Application issues a write,
2. Proxy communicates with the correct master "shard" in the system that contains the given key,
3. Replication communicated the update to the replica shard.
4. Replica persists the update to disk (assuming AOF every write setting is selected).
5-8. The acknowledgment is sent back from the replica all the way to the proxy with steps 5 to 8.

With this flow, the application only gets the acknowledgment from the
write after durability is achieved with replication to the replica and to
the persistent storage.

{{< image filename="/images/rs/strong-consistency.png" >}}

With the WAIT command, applications can have a guarantee that even under
a node failure or node restart, an acknowledged write is recorded.

See the WAIT command for details on the new durability and
consistency options.
