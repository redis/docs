---
Title: Consistency during replication
alwaysopen: false
categories:
- docs
- operate
- rs
description: Explains the order write operations are communicated from app to proxy to shards for both non-blocking Redis write operations and blocking write operations on replication.
linkTitle: Consistency
weight: 20
url: '/operate/rs/7.22/databases/durability-ha/consistency/'
---
Redis Enterprise Software comes with the ability to replicate data
to another database instance for high availability and persist in-memory data on
disk permanently for durability. With the [`WAIT`]({{<relref "/commands/wait">}}) command, you can
control the consistency and durability guarantees for the replicated and
persisted database.

## Non-blocking Redis write operation

Any updates that are issued to the database are typically performed with the following flow:

1. The application issues a write.
2. The proxy communicates with the correct primary (also known as master) shard in the system that contains the given key.
3. The shard writes the data and sends an acknowledgment to the proxy.
4. The proxy sends the acknowledgment back to the application.
5. The write is communicated from the primary shard to the replica.
6. The replica acknowledges the write back to the primary shard.
7. The write to a replica is persisted to disk.
8. The write is acknowledged within the replica.

{{< image filename="/images/rs/weak-consistency.png" >}}

## Blocking write operation on replication

With the [`WAIT`]({{<relref "/commands/wait">}}) or [`WAITAOF`]({{<relref "/commands/waitaof">}}) commands, applications can ask to wait for
acknowledgments only after replication or persistence is confirmed on
the replica. The flow of a write operation with `WAIT` or `WAITAOF` is:

1. The application issues a write.
2. The proxy communicates with the correct primary shard in the system that contains the given key.
3. Replication communicates the update to the replica shard.
4. If using `WAITAOF` and the AOF every write setting, the replica persists the update to disk before sending the acknowledgment.
5. The acknowledgment is sent back from the replica all the way to the proxy with steps 5 to 8.

The application only gets the acknowledgment from the write after durability is achieved with replication to the replica for `WAIT` or `WAITAOF` and to the persistent storage for `WAITAOF` only.

{{< image filename="/images/rs/strong-consistency.png" >}}

The `WAIT` command always returns the number of replicas that acknowledged the write commands sent by the current client before the `WAIT` command, both in the case where the specified number of replicas are reached, or when the timeout is reached. In Redis Enterprise Software, the number of replicas for HA enabled databases is always 1.

See the [`WAITAOF`]({{<relref "/commands/waitaof">}}) command for details for enhanced data safety and durability capabilities introduced with Redis 7.2.
