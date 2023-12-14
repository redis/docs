---
Title: Use the WAIT command for strong consistency
alwaysopen: false
categories:
- docs
- operate
- rs
description: Use the wait command to take full advantage of Redis Enterprise Software's
  replication based durability.
linkTitle: WAIT command
weight: $weight
---
Redis Enterprise Software comes with the ability to replicate data
to another replica for high availability and persist in-memory data on
disk permanently for durability. With the WAIT command, you can
control the consistency and durability guarantees for the replicated and
persisted database.

Any updates that are issued to the database are typically performed with
the following flow shown below;

1. Application issues a write,
1. Proxy communicates with the correct master "shard" in the system
    that contains the given key,
1. The acknowledgment is sent to proxy once the write operation
    completes
1. The proxy sends the acknowledgment back to the application.

Independently, the write is communicated from master to replica and
replication acknowledges the write back to the master. These are steps 5
and 6.

Independently, the write to a replica is also persisted to disk and
acknowledged within the replica. These are steps 7 and 8.

![Weak Consistency](/images/rs/weak-consistency.png)

With the WAIT command, applications can ask to wait for
acknowledgments only after replication or persistence is confirmed on
the replica. The flow of a write operation with the WAIT command is
shown below:

1. Application issues a write,
1. Proxy communicates with the correct master "shard" in the system
    that contains the given key,
1. Replication communicated the update to the replica shard.
1. Replica persists the update to disk (assuming AOF every write setting
    is selected).
1. The acknowledgment is sent back from the replica all the way to the
    proxy with steps 5 to 8.

With this flow, the application only gets the acknowledgment from the
write after durability is achieved with replication to the replica and to
the persistent storage.

![Strong Consistency](/images/rs/strong-consistency.png)

With the WAIT command, applications can have a guarantee that even under
a node failure or node restart, an acknowledged write is recorded.

See the WAIT command for details on the new durability and
consistency options.
