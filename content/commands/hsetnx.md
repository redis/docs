---
acl_categories:
- '@write'
- '@hash'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: field
  name: field
  type: string
- display_text: value
  name: value
  type: string
arity: 4
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- kubernetes
- clients
command_flags:
- write
- denyoom
- fast
complexity: O(1)
description: Sets the value of a field in a hash only when the field doesn't exist.
group: hash
hidden: false
key_specs:
- RW: true
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
  insert: true
linkTitle: HSETNX
since: 2.0.0
summary: Sets the value of a field in a hash only when the field doesn't exist.
syntax_fmt: HSETNX key field value
syntax_str: field value
title: HSETNX
---
Sets `field` in the hash stored at `key` to `value`, only if `field` does not
yet exist.
If `key` does not exist, a new key holding a hash is created.
If `field` already exists, this operation has no effect.

## Examples

{{% redis-cli %}}
HSETNX myhash field "Hello"
HSETNX myhash field "World"
HGET myhash field
{{% /redis-cli %}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="hsetnx-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Integer reply](../../develop/reference/protocol-spec#integers): `0` if the field already exists in the hash and no operation was performed.
* [Integer reply](../../develop/reference/protocol-spec#integers): `1` if the field is a new field in the hash and the value was set.

-tab-sep-

One of the following:
* [Integer reply](../../develop/reference/protocol-spec#integers): `0` if the field already exists in the hash and no operation was performed.
* [Integer reply](../../develop/reference/protocol-spec#integers): `1` if the field is a new field in the hash and the value was set.

{{< /multitabs >}}
