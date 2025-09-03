---
Title: Strings and bitfields in Active-Active databases
alwaysopen: false
categories:
- docs
- operate
- rs
- rc
description: Information about using strings and bitfields with an Active-Active database.
linkTitle: Strings and bitfields
weight: $weight
url: '/operate/rs/7.4/databases/active-active/develop/data-types/strings/'
---
Active-Active databases support both strings and bitfields.

{{<note>}}
Active-Active **bitfield** support was added in RS version 6.0.20.
{{</note>}}

Changes to both of these data structures will be replicated across Active-Active member databases.

## Replication semantics

Except in the case of [string counters]({{< relref "#string-counter-support" >}}) (see below), both strings and bitfields are replicated using a "last write wins" approach. The reason for this is that strings and bitfields are effectively binary objects. So, unlike with lists, sets, and hashes, the conflict resolution semantics of a given operation on a string or bitfield are undefined.

### How "last write wins" works

A wall-clock timestamp (OS time) is stored in the metadata of every string
and bitfield operation. If the replication syncer cannot determine the order of operations,
the value with the latest timestamp wins. This is the only case with Active-Active databases where OS time is used to resolve a conflict.

Here's an example where an update happening to the same key at a later
time (t2) wins over the update at t1.

|  **Time** | **Region 1** | **Region 2** |
|  :------: | :------: | :------: |
|  t1 | SET text "a" |  |
|  t2 |  | SET text "b" |
|  t3 | — Sync — | — Sync — |
|  t4 | SET text "c" |  |
|  t5 | — Sync — | — Sync — |
|  t6 |  | SET text "d" |

### String counter support

When you're using a string as counter (for instance, with the [INCR]({{< relref "/commands/incr" >}}) or [INCRBY]({{< relref "/commands/incrby" >}}) commands),
then conflicts will be resolved semantically.

On conflicting writes, counters accumulate the total counter operations
across all member Active-Active databases in each sync.

Here's an example of how counter
values works when synced between two member Active-Active databases. With
each sync, the counter value accumulates the private increment and
decrements of each site and maintain an accurate counter across
concurrent writes.

|  **Time** | **Region 1** | **Region 2** |
|  :------: | :------: | :------: |
|  t1 | INCRBY counter 7 |  |
|  t2 |  | INCRBY counter 3 |
|  t3 | GET counter<br/>7 | GET counter<br/>3 |
|  t4 | — Sync — | — Sync — |
|  t5 | GET counter<br/>10 | GET counter<br/>10 |
|  t6 | DECRBY counter 3 |  |
|  t7 |  | INCRBY counter 6 |
|  t8 | — Sync — | — Sync — |
|  t9 | GET counter<br/>13 | GET counter<br/>13 |

{{< note >}}
Active-Active databases support 59-bit counters.
This limitation is to protect from overflowing a counter in a concurrent operation.
{{< /note >}}
