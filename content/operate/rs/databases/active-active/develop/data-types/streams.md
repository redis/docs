---
Title: Streams in Active-Active databases
alwaysopen: false
categories:
- docs
- operate
- rs
- rc
description: Information about using streams with an Active-Active database.
linkTitle: Streams
weight: $weight
---
A [Redis Stream]({{< relref "/develop/data-types/streams" >}}) is a data structure that acts like an append-only log.
Each stream entry consists of:

- A unique, monotonically increasing ID
- A payload consisting of a series key-value pairs

You add entries to a stream with the XADD command. You access stream entries using the XRANGE, XREADGROUP, and XREAD commands (however, see the caveat about XREAD below).

## Streams and Active-Active

Active-Active databases allow you to write to the same logical stream from more than one region.
Streams are synchronized across the regions of an Active-Active database.

In the example below, we write to a stream concurrently from two regions. Notice that after syncing, both regions have identical streams:

<table style='width: auto;'>
<thead>
<tr>
<th>Time</th>
<th>Region 1</th>
<th>Region 2</th>
</tr>
</thead>

<tbody>
<tr>
<td><em>t1</em></td>
<td><code>XADD messages * text hello</code></td>
<td><code>XADD messages * text goodbye</code></td>
</tr>

<tr>
<td><em>t2</em></td>
<td><code>XRANGE messages - +</code> <br/><strong>→ [1589929244828-1]</strong></td>
<td><code>XRANGE messages - +</code> <br/><strong>→ [1589929246795-2]</strong></td>
</tr>

<tr>
<td><em>t3</em></td>
<td><em>— Sync —</em></td>
<td><em>— Sync —</em></td>
</tr>

<tr>
<td><em>t4</em></td>
<td><code>XRANGE messages - +</code> <br/><strong>→ [1589929244828-1, 1589929246795-2]</strong></td>
<td><code>XRANGE messages - +</code> <br/><strong>→ [1589929244828-1, 1589929246795-2]</strong></td>
</tr>
</tbody>
</table>

Notice also that the synchronized streams contain no duplicate IDs. As long as you allow the database to generate your stream IDs, you'll never have more than one stream entry with the same ID.

{{< note >}}
Redis Open Source uses one radix tree (referred to as `rax` in the code base) to implement each stream. However, Active-Active databases implement a single logical stream using one `rax` per region.
Each region adds entries only to its associated `rax` (but can remove entries from all `rax` trees).
This means that XREAD and XREADGROUP iterate simultaneously over all `rax` trees and return the appropriate entry by comparing the entry IDs from each `rax`.
{{< /note >}}

### Conflict resolution

Active-Active databases use an "observed-remove" approach to automatically resolve potential conflicts.

With this approach, a delete only affects the locally observable data.

In the example below, a stream, `x`, is created at _t1_. At _t3_, the stream exists in two regions.

<table style='width: 100%;'>
<thead>
<tr>
<th>Time</th>
<th>Region 1</th>
<th>Region 2</th>
</tr>
</thead>

<tbody>
<tr>
<td><em>t1</em></td>
<td><code>XADD messages * text hello</code></td>
<td></td>
</tr>

<tr>
<td><em>t2</em></td>
<td><em>— Sync —</em></td>
<td><em>— Sync —</em></td>
</tr>

<tr>
<td><em>t3</em></td>
<td><code>XRANGE messages - +</code> <br/><strong>→ [1589929244828-1]</strong></code></td>
<td><code>XRANGE messages - +</code> <br/><strong>→ [1589929244828-1]</strong></code></td>
</tr>


<tr>
<td><em>t4</em></td>
<td><code>DEL messages</code></strong></td>
<td><code>XADD messages * text goodbye</code></td>
</tr>

<tr>
<td><em>t5</em></td>
<td><em>— Sync —</em></td>
<td><em>— Sync —</em></td>
</tr>


<tr>
<td><em>t6</em></td>
<td><code>XRANGE messages - +</code> <br/><strong>→ [1589929246795-2]</strong></code></td>
<td><code>XRANGE messages - +</code> <br/><strong>→ [1589929246795-2]</strong></code></td>
</tr>


</tbody>
</table>

At _t4_, the stream is deleted from Region 1. At the same time, an entry with ID ending in `3700` is added to the same stream at Region 2. After the sync, at _t6_, the entry with ID ending in `3700` exists in both regions. This is because that entry was not visible when the local stream was deleted at _t4_.

### ID generation modes

Usually, you should allow Redis streams generate its own stream entry IDs. You do this by specifying `*` as the ID in calls to XADD. However, you _can_ provide your own custom ID when adding entries to a stream.

Because Active-Active databases replicate asynchronously, providing your own IDs can create streams with duplicate IDs. This can occur when you write to the same stream from multiple regions.

| Time | Region 1                      | Region 2                      |
| ---- | ------------------------------- | ------------------------------- |
| _t1_   | `XADD x 100-1 f1 v1`              | `XADD x 100-1 f1 v1`              |
| _t2_   | _— Sync —_                    | _— Sync —_                    |
| _t3_   | `XRANGE x - +`<br/> **→ [100-1, 100-1]** | `XRANGE x - +`<br/> **→ [100-1, 100-1]** |

In this scenario, two entries with the ID `100-1` are added at _t1_. After syncing, the stream `x` contains two entries with the same ID.

{{< note >}}
Stream IDs in Redis Open Source consist of two integers separated by a dash ('-'). When the server generates the ID, the first integer is the current time in milliseconds, and the second integer is a sequence number. So, the format for stream IDs is MS-SEQ.
{{< /note >}}

To prevent duplicate IDs and to comply with the original Redis streams design, Active-Active databases provide three ID modes for XADD:

1. **Strict**: In _strict_ mode, XADD allows server-generated IDs (using the '`*`' ID specifier) or IDs consisting only of the millisecond (MS) portion. When the millisecond portion of the ID is provided, the ID's sequence number is calculated using the database's region ID. This prevents duplicate IDs in the stream. Strict mode rejects full IDs (that is, IDs containing both milliseconds and a sequence number).
1. **Semi-strict**: _Semi-strict_ mode is just like _strict_ mode except that it allows full IDs (MS-SEQ). Because it allows full IDs, duplicate IDs are possible in this mode.
1. **Liberal**: XADD allows any monotonically ascending ID. When given the millisecond portion of the ID, the sequence number will be set to `0`. This mode may also lead to duplicate IDs.

The default and recommended mode is _strict_, which prevents duplicate IDs.

{{% warning %}}
Why do you want to prevent duplicate IDs? First, XDEL, XCLAIM, and other commands can affect more than one entry when duplicate IDs are present in a stream. Second, duplicate entries may be removed if a database is exported or renamed.
{{% /warning %}}

To change XADD's ID generation mode, use the `rladmin` command-line utility:

Set _strict_ mode:
```sh
rladmin tune db crdb crdt_xadd_id_uniqueness_mode strict
```

Set _semi-strict_ mode:
```sh
rladmin tune db crdb crdt_xadd_id_uniqueness_mode semi-strict
```

Set _liberal_ mode:
```sh
rladmin tune db crdb crdt_xadd_id_uniqueness_mode liberal
```

### Iterating a stream with XREAD

In Redis Open Source and in non-Active-Active databases, you can use XREAD to iterate over the entries in a Redis Stream. However, with an Active-Active database, XREAD may skip entries. This can happen when multiple regions write to the same stream.

In the example below, XREAD skips entry `115-2`.

| Time | Region 1                                         | Region 2                                         |
| ---- | -------------------------------------------------- | -------------------------------------------------- |
| _t1_   | `XADD x 110 f1 v1`                                   | `XADD x 115 f1 v1`                                   |
| _t2_   | `XADD x 120 f1 v1`                                   |                                                    |
| _t3_   | `XADD x 130 f1 v1`                                   |                                                    |
| _t4_   | `XREAD COUNT 2 STREAMS x 0` <br/>**→ [110-1, 120-1]**       |                                                    |
| _t5_   | _— Sync —_                                       | _— Sync —_                                       |
| _t6_   | `XREAD COUNT 2 STREAMS x 120-1` <br/>**→ [130-1]**            |                                                    |
| _t7_   | `XREAD STREAMS x 0` <br/>**→[110-1, 115-2, 120-1, 130-1]** | `XREAD STREAMS x 0` <br/>**→[110-1, 115-2, 120-1, 130-1]** |


You can use XREAD to reliably consume a stream only if all writes to the stream originate from a single region. Otherwise, you should use XREADGROUP, which always guarantees reliable stream consumption.

## Consumer groups

Active-Active databases fully support consumer groups with Redis Streams. Here is an example of creating two consumer groups concurrently:

| Time | Region 1                  | Region 2                  |
| ---- | --------------------------- | --------------------------- |
| _t1_   | `XGROUP CREATE x group1 0`        | `XGROUP CREATE x group2 0`        |
| _t2_   | `XINFO GROUPS x` <br/>**→ [group1]**     | `XINFO GROUPS x` <br/>**→ [group2]**     |
| _t3_   | _— Sync —_                | — Sync —                |
| _t4_   | `XINFO GROUPS x` <br/>**→ [group1, group2]** | `XINFO GROUPS x` <br/>**→ [group1, group2]** |


{{< note >}}
Redis Open Source uses one radix tree (`rax`) to hold the global pending entries list and another `rax` for each consumer's PEL.
The global PEL is a unification of all consumer PELs, which are disjoint.

An Active-Active database stream maintains a global PEL and a per-consumer PEL for each region.

When given an ID different from the special ">" ID, XREADGROUP iterates simultaneously over all of the PELs for all consumers.
It returns the next entry by comparing entry IDs from the different PELs.
{{< /note >}}

### Conflict resolution

The "delete wins" approach is a way to automatically resolve conflicts with consumer groups.
In case of concurrent consumer group operations, a delete will "win" over other concurrent operations on the same group.

In this example, the DEL at _t4_ deletes both the observed `group1` and the non-observed `group2`:

| Time | Region 1              | Region 2              |
| ---- | ----------------------- | ----------------------- |
| _t1_   | `XGROUP CREATE x group1 0`    |                         |
| _t2_   | _— Sync —_            | _— Sync —_            |
| _t3_   | `XINFO GROUPS x` <br/>**→ [group1]** | `XINFO GROUPS x` <br/>**→ [group1]** |
| _t4_   | `DEL x`                   | `XGROUP CREATE x group2 0`    |
| _t5_   | _— Sync —_            | _— Sync —_            |
| _t6_   | `EXISTS x` <br/>**→ 0** | `EXISTS x` <br/>**→  0**          |

In this example, the XGROUP DESTROY at _t4_ affects both the observed `group1` created in Region 1 and the non-observed `group1` created in Region 3:

| time | Region 1              | Region 2              | Region 3            |
| ---- | ----------------------- | ----------------------- | --------------------- |
| _t1_   | `XGROUP CREATE x group1 0`    |                         |                       |
| _t2_   | _— Sync —_            | _— Sync —_            |                       |
| _t3_   | `XINFO GROUPS x` <br/>**→ [group1]** | `XINFO GROUPS x` <br/>**→  [group1]** | `XINFO GROUPS x` <br/>**→  []** |
| _t4_   |                         | `XGROUP DESTROY x group1`     | `XGROUP CREATE x group1 0` |
| _t5_   | _— Sync —_            | _— Sync —            | — Sync —          |
| _t6_   | `EXISTS x` <br/>**→  0**          | `EXISTS x` <br/>**→ 0**          | `EXISTS x` <br/>**→  0**    |

### Group replication

Calls to XREADGROUP and XACK change the state of a consumer group or consumer. However, it's not efficient to replicate every change to a consumer or consumer group.

To maintain consumer groups in Active-Active databases with optimal performance:

1. Group existence (CREATE/DESTROY) is replicated.
1. Most XACK operations are replicated.
1. Other operations, such as XGROUP, SETID, DELCONSUMER, are not replicated.

For example:

| Time | Region 1                                        | Region 2               |
| ---- | ------------------------------------------------- | ------------------------ |
| _t1_   | `XADD messages 110 text hello`                                |                          |
| _t2_   | `XGROUP CREATE messages group1 0`                              |                          |
| _t3_   | `XREADGROUP GROUP group1 Alice STREAMS messages >` <br/>**→ [110-1]** |                          |
| _t4_   | _— Sync —_                                      | _— Sync —_             |
| _t5_   | `XRANGE messages - +` <br/>**→ [110-1]**                          | XRANGE messages - + <br/>**→ [110-1]** |
| _t6_   | `XINFO GROUPS messages` <br/>**→ [group1]**                            | XINFO GROUPS messages <br/>**→ [group1]**   |
| _t7_   | `XINFO CONSUMERS messages group1` <br/>**→ [Alice]**                      | XINFO CONSUMERS messages group1 <br/>**→ []**  |
| _t8_   | `XPENDING messages group1 - + 1` <br/>**→ [110-1]**                     | XPENDING messages group1 - + 1<br/>**→ []** |

Using XREADGROUP across regions can result in regions reading the same entries.
This is due to the fact that Active-Active Streams is designed for at-least-once reads or a single consumer.
As shown in the previous example, Region 2 is not aware of any consumer group activity, so redirecting the XREADGROUP traffic from Region 1 to Region 2 results in reading entries that have already been read.

### Replication performance optimizations

Consumers acknowledge messages using the XACK command. Each ack effectively records the last consumed message. This can result in a lot of cross-region traffic. To reduce this traffic, we replicate XACK messages only when all of the read entries are acknowledged.

| Time | Region 1                                                      | Region 2   | Explanation                                                                                                     |
| ---- | --------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------- |
| _t1_   | `XADD x 110-0 f1 v1`                                              |              |                                                                                                                 |
| _t2_   | `XADD x 120-0 f1 v1`                                              |              |                                                                                                                 |
| _t3_   | `XADD x 130-0 f1 v1`                                              |              |                                                                                                                 |
| _t4_   | `XGROUP CREATE x group1 0`                                            |              |                                                                                                                 |
| _t5_   | `XREADGROUP GROUP group1 Alice STREAMS x >` <br/>**→ [110-0, 120-0, 130-0]** |              |                                                                                                                 |
| _t6_   | `XACK x group1 110-0`                                                   |              |                                                                                                                 |
| _t7_   | _— Sync —_                                                    | _— Sync —_ | 110-0 and its preceding entries (none) were acknowledged. We replicate an XACK effect for 110-0.                |
| _t8_   | `XACK x group1 130-0`                                                   |              |                                                                                                                 |
| _t9_   | _— Sync —_                                                    | _— Sync —_ | 130-0 was acknowledged, but not its preceding entries (120-0). We DO NOT replicate an XACK effect for 130-0     |
| _t10_  | `XACK x group1 120-0`                                                   |              |                                                                                                                 |
| _t11_  | _— Sync —_                                                    | _— Sync —_ | 120-0 and its preceding entries (110-0 through 130-0) were acknowledged. We replicate an XACK effect for 130-0. |

In this scenario, if we redirect the XREADGROUP traffic from Region 1 to Region 2 we do not re-read entries 110-0, 120-0 and 130-0.
This means that the XREADGROUP does not return already-acknowledged entries.

### Guarantees

Unlike XREAD, XREADGOUP will never skip stream entries.

In traffic redirection, XREADGROUP may return entries that have been read but not acknowledged. It may also even return entries that have already been acknowledged.

When entries are added from multiple regions, Redis guarantees ordered entries in the reply of a single read command (`XREAD`, `XREADGROUP`, or `XRANGE`). However, ordered IDs are not guaranteed for a sequence of read commands.
For example, two subsequent `XREADGROUP GROUP group consumer COUNT 1 STREAMS key >` commands may reply with decreasing IDs.

## Summary

With Active-Active streams, you can write to the same logical stream from multiple regions. As a result, the behavior of Active-Active streams differs somewhat from the behavior you get with Redis Open Source. This is summarized below:

### Stream commands

1. When using the _strict_ ID generation mode, XADD does not permit full stream entry IDs (that is, an ID containing both MS and SEQ).
1. XREAD may skip entries when iterating a stream that is concurrently written to from more than one region. For reliable stream iteration, use XREADGROUP instead.
1. XSETID fails when the new ID is less than current ID.

### Consumer group notes

The following consumer group operations are replicated:

1. Consecutive XACK operations
1. Consumer group creation and deletion (that is, XGROUP CREATE and XGROUP DESTROY)

All other consumer group metadata is not replicated.

A few other notes:

1. XGROUP SETID and DELCONSUMER are not replicated.
1. Consumers exist locally (XREADGROUP creates a consumer implicitly).
1. Renaming a stream (using RENAME) deletes all consumer group information.
