---
acl_categories:
- '@read'
- '@stream'
- '@slow'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- arguments:
  - display_text: full
    name: full
    token: FULL
    type: pure-token
  - display_text: count
    name: count
    optional: true
    token: COUNT
    type: integer
  name: full-block
  optional: true
  type: block
arity: -3
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- oss
- kubernetes
- clients
command_flags:
- readonly
complexity: O(1)
description: Returns information about a stream.
group: stream
hidden: false
history:
- - 6.0.0
  - Added the `FULL` modifier.
- - 7.0.0
  - Added the `max-deleted-entry-id`, `entries-added`, `recorded-first-entry-id`,
    `entries-read` and `lag` fields
- - 7.2.0
  - Added the `active-time` field, and changed the meaning of `seen-time`.
key_specs:
- RO: true
  access: true
  begin_search:
    spec:
      index: 2
    type: index
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
linkTitle: XINFO STREAM
since: 5.0.0
summary: Returns information about a stream.
syntax_fmt: "XINFO STREAM key [FULL [COUNT\_count]]"
syntax_str: "[FULL [COUNT\_count]]"
title: XINFO STREAM
---
This command returns information about the stream stored at `<key>`.

The informative details provided by this command are:

* **length**: the number of entries in the stream (see [`XLEN`]({{< relref "/commands/xlen" >}}))
* **radix-tree-keys**: the number of keys in the underlying radix data structure
* **radix-tree-nodes**: the number of nodes in the underlying radix data structure
* **groups**: the number of consumer groups defined for the stream
* **last-generated-id**: the ID of the least-recently entry that was added to the stream
* **max-deleted-entry-id**: the maximal entry ID that was deleted from the stream
* **entries-added**: the count of all entries added to the stream during its lifetime
* **first-entry**: the ID and field-value tuples of the first entry in the stream
* **last-entry**: the ID and field-value tuples of the last entry in the stream

### The `FULL` modifier

The optional `FULL` modifier provides a more verbose reply.
When provided, the `FULL` reply includes an **entries** array that consists of the stream entries (ID and field-value tuples) in ascending order.
Furthermore, **groups** is also an array, and for each of the consumer groups it consists of the information reported by [`XINFO GROUPS`]({{< relref "/commands/xinfo-groups" >}}) and [`XINFO CONSUMERS`]({{< relref "/commands/xinfo-consumers" >}}).

The following information is provided for each of the groups:

* **name**: the consumer group's name
* **last-delivered-id**: the ID of the last entry delivered to the group's consumers
* **entries-read**: the logical "read counter" of the last entry delivered to the group's consumers
* **lag**: the number of entries in the stream that are still waiting to be delivered to the group's consumers, or a NULL when that number can't be determined.
* **pel-count**: the length of the group's pending entries list (PEL), which are messages that were delivered but are yet to be acknowledged
* **pending**: an array with pending entries information (see below)
* **consumers**: an array with consumers information (see below)

The following information is provided for each pending entry:

1. The ID of the message.
2. The name of the consumer that fetched the message and has still to acknowledge it. We call it the current *owner* of the message.
3. The UNIX timestamp of when the message was delivered to this consumer.
4. The number of times this message was delivered.

The following information is provided for each consumer:

* **name**: the consumer's name
* **seen-time**: the UNIX timestamp of the last attempted interaction (Examples: [`XREADGROUP`]({{< relref "/commands/xreadgroup" >}}), [`XCLAIM`]({{< relref "/commands/xclaim" >}}), [`XAUTOCLAIM`]({{< relref "/commands/xautoclaim" >}}))
* **active-time**: the UNIX timestamp of the last successful interaction (Examples: [`XREADGROUP`]({{< relref "/commands/xreadgroup" >}}) that actually read some entries into the PEL, [`XCLAIM`]({{< relref "/commands/xclaim" >}})/[`XAUTOCLAIM`]({{< relref "/commands/xautoclaim" >}}) that actually claimed some entries)
* **pel-count**: the number of entries in the PEL: pending messages for the consumer, which are messages that were delivered but are yet to be acknowledged
* **pending**: an array with pending entries information, has the same structure as described above, except the consumer name is omitted (redundant, since anyway we are in a specific consumer context)

Note that before Redis 7.2.0, **seen-time** used to denote the last successful interaction.
In 7.2.0, **active-time** was added and **seen-time** was changed to denote the last attempted interaction.

The `COUNT` option can be used to limit the number of stream and PEL entries that are returned (The first `<count>` entries are returned).
The default `COUNT` is 10 and a `COUNT` of 0 means that all entries will be returned (execution time may be long if the stream has a lot of entries).

## Examples

Default reply:

```
> XINFO STREAM mystream
 1) "length"
 2) (integer) 2
 3) "radix-tree-keys"
 4) (integer) 1
 5) "radix-tree-nodes"
 6) (integer) 2
 7) "last-generated-id"
 8) "1638125141232-0"
 9) "max-deleted-entry-id"
10) "0-0"
11) "entries-added"
12) (integer) 2
13) "recorded-first-entry-id"
14) "1719505260513-0"
15) "groups"
16) (integer) 1
17) "first-entry"
18) 1) "1638125133432-0"
    2) 1) "message"
       2) "apple"
19) "last-entry"
20) 1) "1638125141232-0"
    2) 1) "message"
       2) "banana"
```

Full reply:

```
> XADD mystream * foo bar
"1638125133432-0"
> XADD mystream * foo bar2
"1638125141232-0"
> XGROUP CREATE mystream mygroup 0-0
OK
> XREADGROUP GROUP mygroup Alice COUNT 1 STREAMS mystream >
1) 1) "mystream"
   2) 1) 1) "1638125133432-0"
         2) 1) "foo"
            2) "bar"
> XINFO STREAM mystream FULL
 1) "length"
 2) (integer) 2
 3) "radix-tree-keys"
 4) (integer) 1
 5) "radix-tree-nodes"
 6) (integer) 2
 7) "last-generated-id"
 8) "1638125141232-0"
 9) "max-deleted-entry-id"
10) "0-0"
11) "entries-added"
12) (integer) 2
13) "recorded-first-entry-id"
14) "1719505260513-0"
15) "entries"
16) 1) 1) "1638125133432-0"
       2) 1) "foo"
          2) "bar"
    2) 1) "1638125141232-0"
       2) 1) "foo"
          2) "bar2"
17) "groups"
18) 1)  1) "name"
        2) "mygroup"
        3) "last-delivered-id"
        4) "1638125133432-0"
        5) "entries-read"
        6) (integer) 1
        7) "lag"
        8) (integer) 1
        9) "pel-count"
       10) (integer) 1
       11) "pending"
       12) 1) 1) "1638125133432-0"
              2) "Alice"
              3) (integer) 1638125153423
              4) (integer) 1
       13) "consumers"
       14) 1) 1) "name"
              2) "Alice"
              3) "seen-time"
              4) (integer) 1638125133422
              5) "active-time"
              6) (integer) 1638125133432
              7) "pel-count"
              8) (integer) 1
              9) "pending"
              10) 1) 1) "1638125133432-0"
                     2) (integer) 1638125133432
                     3) (integer) 1
```
