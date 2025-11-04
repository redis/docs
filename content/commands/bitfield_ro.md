---
acl_categories:
- '@read'
- '@bitmap'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- arguments:
  - display_text: encoding
    name: encoding
    type: string
  - display_text: offset
    name: offset
    type: integer
  multiple: true
  multiple_token: true
  name: get-block
  optional: true
  token: GET
  type: block
arity: -2
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
- fast
complexity: O(1) for each subcommand specified
description: Performs arbitrary read-only bitfield integer operations on strings.
group: bitmap
hidden: false
key_specs:
- RO: true
  access: true
  begin_search:
    spec:
      index: 1
    type: index
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
linkTitle: BITFIELD_RO
since: 6.0.0
summary: Performs arbitrary read-only bitfield integer operations on strings.
syntax_fmt: "BITFIELD_RO key [GET\_encoding offset [GET encoding offset ...]]"
syntax_str: "[GET\_encoding offset [GET encoding offset ...]]"
title: BITFIELD_RO
---
Read-only variant of the [`BITFIELD`]({{< relref "/commands/bitfield" >}}) command.
It is like the original [`BITFIELD`]({{< relref "/commands/bitfield" >}}) but only accepts `GET` subcommand and can safely be used in read-only replicas.

Since the original [`BITFIELD`]({{< relref "/commands/bitfield" >}}) has `SET` and `INCRBY` options it is technically flagged as a writing command in the Redis command table.
For this reason read-only replicas in a Redis Cluster will redirect it to the master instance even if the connection is in read-only mode (see the [`READONLY`]({{< relref "/commands/readonly" >}}) command of Redis Cluster).

Since Redis 6.2, the `BITFIELD_RO` variant was introduced in order to allow [`BITFIELD`]({{< relref "/commands/bitfield" >}}) behavior in read-only replicas without breaking compatibility on command flags.

See original [`BITFIELD`]({{< relref "/commands/bitfield" >}}) for more details.

## Examples

```
BITFIELD_RO hello GET i8 16
```

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="bitfield-ro-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): each entry being the corresponding result of the sub-command given at the same position.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): each entry being the corresponding result of the sub-command given at the same position.

{{< /multitabs >}}
