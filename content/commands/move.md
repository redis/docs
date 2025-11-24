---
acl_categories:
- '@keyspace'
- '@write'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: db
  name: db
  type: integer
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
- fast
complexity: O(1)
description: Moves a key to another database.
group: generic
hidden: false
key_specs:
- RW: true
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
  update: true
linkTitle: MOVE
since: 1.0.0
summary: Moves a key to another database.
syntax_fmt: MOVE key db
syntax_str: db
title: MOVE
---
Move `key` from the currently selected database (see [`SELECT`]({{< relref "/commands/select" >}})) to the specified
destination database.
When `key` already exists in the destination database, or it does not exist in
the source database, it does nothing.
It is possible to use `MOVE` as a locking primitive because of this.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | Redis Enterprise does not support shared databases due to potential negative performance impacts and blocks any related commands. |

## Return information

{{< multitabs id="move-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Integer reply](../../develop/reference/protocol-spec#integers): `1` if _key_ was moved.
* [Integer reply](../../develop/reference/protocol-spec#integers): `0` if _key_ wasn't moved.

-tab-sep-

One of the following:
* [Integer reply](../../develop/reference/protocol-spec#integers): `1` if _key_ was moved.
* [Integer reply](../../develop/reference/protocol-spec#integers): `0` if _key_ wasn't moved.

{{< /multitabs >}}
