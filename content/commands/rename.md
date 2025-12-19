---
acl_categories:
- '@keyspace'
- '@write'
- '@slow'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: newkey
  key_spec_index: 1
  name: newkey
  type: key
arity: 3
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
complexity: O(1)
description: Renames a key and overwrites the destination.
group: generic
hidden: false
key_specs:
- RW: true
  access: true
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
- OW: true
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
  update: true
linkTitle: RENAME
railroad_diagram: /images/railroad/rename.svg
since: 1.0.0
summary: Renames a key and overwrites the destination.
syntax_fmt: RENAME key newkey
title: RENAME
---
Renames `key` to `newkey`.
It returns an error when `key` does not exist.
If `newkey` already exists it is overwritten, when this happens `RENAME` executes an implicit [`DEL`]({{< relref "/commands/del" >}}) operation, so if the deleted key contains a very big value it may cause high latency even if `RENAME` itself is usually a constant-time operation.

In Cluster mode, both `key` and `newkey` must be in the same **hash slot**, meaning that in practice only keys that have the same hash tag can be reliably renamed in cluster.

## Examples

{{% redis-cli %}}
SET mykey "Hello"
RENAME mykey myotherkey
GET myotherkey
{{% /redis-cli %}}

## Behavior change history

*   `>= 3.2.0`: The command no longer returns an error when source and destination names are the same.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active\*</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active\*</nobr></span> | For Active-Active or clustered databases, the original key and new key must be in the same hash slot.<br /><br />\*Not supported for stream consumer group info. |

## Return information

{{< multitabs id="rename-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}
