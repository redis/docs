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
- fast
complexity: O(1)
description: Renames a key only when the target key name doesn't exist.
group: generic
hidden: false
history:
- - 3.2.0
  - The command no longer returns an error when source and destination names are the
    same.
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
  insert: true
linkTitle: RENAMENX
since: 1.0.0
summary: Renames a key only when the target key name doesn't exist.
syntax_fmt: RENAMENX key newkey
syntax_str: newkey
title: RENAMENX
---
Renames `key` to `newkey` if `newkey` does not yet exist.
It returns an error when `key` does not exist.

In Cluster mode, both `key` and `newkey` must be in the same **hash slot**, meaning that in practice only keys that have the same hash tag can be reliably renamed in cluster.

## Examples

{{% redis-cli %}}
SET mykey "Hello"
SET myotherkey "World"
RENAMENX mykey myotherkey
GET myotherkey
{{% /redis-cli %}}

## Return information

{{< multitabs id="renamenx-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Integer reply](../../develop/reference/protocol-spec#integers): `1` if _key_ was renamed to _newkey_.
* [Integer reply](../../develop/reference/protocol-spec#integers): `0` if _newkey_ already exists.

-tab-sep-

One of the following:
* [Integer reply](../../develop/reference/protocol-spec#integers): `1` if _key_ was renamed to _newkey_.
* [Integer reply](../../develop/reference/protocol-spec#integers): `0` if _newkey_ already exists.

{{< /multitabs >}}
