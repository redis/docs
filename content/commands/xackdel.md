---
acl_categories:
- '@write'
- '@stream'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: group
  name: group
  type: string
- arguments:
  - display_text: keepref
    name: keepref
    token: KEEPREF
    type: pure-token
  - display_text: delref
    name: delref
    token: DELREF
    type: pure-token
  - display_text: acked
    name: acked
    token: ACKED
    type: pure-token
  name: condition
  optional: true
  type: oneof
- arguments:
  - display_text: numids
    name: numids
    type: integer
  - display_text: id
    multiple: true
    name: id
    type: string
  name: ids
  token: IDS
  type: block
arity: -6
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
- write
- fast
complexity: O(1) for each message ID processed.
description: Acknowledges and deletes one or multiple messages for a stream consumer
  group.
group: stream
hidden: false
key_specs:
- RW: true
  begin_search:
    spec:
      index: 1
    type: index
  delete: true
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
  update: true
linkTitle: XACKDEL
since: 8.2.0
summary: Acknowledges and deletes one or multiple messages for a stream consumer group.
syntax_fmt: "XACKDEL key group [KEEPREF | DELREF | ACKED] IDS\_numids id [id ...]"
syntax_str: "group [KEEPREF | DELREF | ACKED] IDS\_numids id [id ...]"
title: XACKDEL
---

Acknowledges and deletes one or multiple messages for a stream consumer group at the specified `key`.

`XACKDEL` combines the functionality of [`XACK`]({{< relref "/commands/xack" >}}) and [`XDEL`]({{< relref "/commands/xdel" >}}) in Redis Streams. It acknowledges the specified message IDs in the given consumer group and simultaneously attempts to delete the corresponding entries from the stream.

## Required arguments

<details open>
<summary><code>key</code></summary>

The name of the stream key.
</details>

<details open>
<summary><code>group</code></summary>

The name of the consumer group.
</details>

<details open>
<summary><code>IDS numids id [id ...]</code></summary>

The IDS block specifying which entries to acknowledge and delete:
- `numids`: The number of IDs that follow
- `id [id ...]`: One or more stream entry IDs to acknowledge and delete
</details>

## Optional arguments

<details open>
<summary><code>KEEPREF | DELREF | ACKED</code></summary>

Specifies how to handle consumer group references when acknowledging and deleting entries. Available since Redis 8.2.0. If no option is specified, `KEEPREF` is used by default:

- `KEEPREF` (default): Acknowledges the messages in the specified consumer group and deletes the entries from the stream, but preserves existing references to these entries in all consumer groups' PEL (Pending Entries List).
- `DELREF`: Acknowledges the messages in the specified consumer group, deletes the entries from the stream, and also removes all references to these entries from all consumer groups' pending entry lists, effectively cleaning up all traces of the messages.
- `ACKED`: Acknowledges the messages in the specified consumer group and only deletes entries that were read and acknowledged by all consumer groups.
</details>

This command is particularly useful when you want to both acknowledge message processing and clean up the stream in a single atomic operation, providing fine-grained control over how consumer group references are handled.

## Examples

{{% redis-cli %}}
XADD mystream * field1 value1
XADD mystream * field2 value2
XGROUP CREATE mystream mygroup 0
XREADGROUP GROUP mygroup consumer1 COUNT 2 STREAMS mystream >
XPENDING mystream mygroup
XACKDEL mystream mygroup KEEPREF IDS 2 1526919030474-55 1526919030474-56
XPENDING mystream mygroup
XRANGE mystream - +
{{% /redis-cli %}}

## Return information

{{< multitabs id="xackdel-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): For each ID:
* [Integer reply](../../develop/reference/protocol-spec#integers): -1 if no such ID exists in the provided stream key.
* [Integer reply](../../develop/reference/protocol-spec#integers): 1 if the entry was acknowledged and deleted from the stream.
* [Integer reply](../../develop/reference/protocol-spec#integers): 2 if the entry was acknowledged but not deleted, as there are still dangling references (ACKED option).

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): For each ID:
* [Integer reply](../../develop/reference/protocol-spec#integers): -1 if no such ID exists in the provided stream key.
* [Integer reply](../../develop/reference/protocol-spec#integers): 1 if the entry was acknowledged and deleted from the stream.
* [Integer reply](../../develop/reference/protocol-spec#integers): 2 if the entry was acknowledged but not deleted, as there are still dangling references (ACKED option).

{{< /multitabs >}}
