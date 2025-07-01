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
arity: -5
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
complexity: O(1) for each single item to delete in the stream, regardless of the stream
  size.
description: Deletes one or multiple entries from the stream.
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
linkTitle: XDELEX
since: 8.2.0
summary: Deletes one or multiple entries from the stream.
syntax_fmt: "XDELEX key [KEEPREF | DELREF | ACKED] IDS\_numids id [id ...]"
syntax_str: "[KEEPREF | DELREF | ACKED] IDS\_numids id [id ...]"
title: XDELEX
---

Deletes one or multiple entries from the stream at the specified `key`.

`XDELEX` is an extension of the Redis Streams [`XDEL`]({{< relref "/commands/xdel" >}}) command that provides more control over how message entries are deleted concerning consumer groups.

## Required arguments

<details open>
<summary><code>key</code></summary>

The name of the stream key.
</details>

<details open>
<summary><code>IDS numids id [id ...]</code></summary>

The IDS block specifying which entries to delete:
- `numids`: The number of IDs that follow
- `id [id ...]`: One or more stream entry IDs to delete

Note: The IDS block can be at any position in the command, same as other commands.
</details>

## Optional arguments

<details open>
<summary><code>KEEPREF | DELREF | ACKED</code></summary>

Specifies how to handle consumer group references when deleting entries. Available since Redis 8.2.0. If no option is specified, `KEEPREF` is used by default:

- `KEEPREF` (default): Deletes the specified entries from the stream, but preserves existing references to these entries in all consumer groups' PEL (Pending Entries List). This behavior is similar to [`XDEL`]({{< relref "/commands/xdel" >}}).
- `DELREF`: Deletes the specified entries from the stream and also removes all references to these entries from all consumer groups' pending entry lists, effectively cleaning up all traces of the messages.
- `ACKED`: Only deletes entries that were read and acknowledged by all consumer groups.
</details>

The command provides fine-grained control over stream entry deletion, particularly useful when working with consumer groups where you need to manage pending entry references carefully.

## Examples

{{% redis-cli %}}
XADD mystream * field1 value1
XADD mystream * field2 value2
XADD mystream * field3 value3
XRANGE mystream - +
XDELEX mystream KEEPREF IDS 2 1526919030474-55 1526919030474-56
XRANGE mystream - +
{{% /redis-cli %}}

## Return information

{{< multitabs id="xdelex-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): For each ID:
* [Integer reply](../../develop/reference/protocol-spec#integers): -1 if no such ID exists in the provided stream key.
* [Integer reply](../../develop/reference/protocol-spec#integers): 1 if the entry was deleted from the stream.
* [Integer reply](../../develop/reference/protocol-spec#integers): 2 if the entry was not deleted, but there are still dangling references (ACKED option).

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): For each ID:
* [Integer reply](../../develop/reference/protocol-spec#integers): -1 if no such ID exists in the provided stream key.
* [Integer reply](../../develop/reference/protocol-spec#integers): 1 if the entry was deleted from the stream.
* [Integer reply](../../develop/reference/protocol-spec#integers): 2 if the entry was not deleted, but there are still dangling references (ACKED option).

{{< /multitabs >}}
