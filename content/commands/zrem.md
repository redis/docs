---
acl_categories:
- '@write'
- '@sortedset'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: member
  multiple: true
  name: member
  type: string
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
- write
- fast
complexity: O(M*log(N)) with N being the number of elements in the sorted set and
  M the number of elements to be removed.
description: Removes one or more members from a sorted set. Deletes the sorted set
  if all members were removed.
group: sorted-set
hidden: false
history:
- - 2.4.0
  - Accepts multiple elements.
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
linkTitle: ZREM
since: 1.2.0
summary: Removes one or more members from a sorted set. Deletes the sorted set if
  all members were removed.
syntax_fmt: ZREM key member [member ...]
syntax_str: member [member ...]
title: ZREM
---
Removes the specified members from the sorted set stored at `key`.
Non existing members are ignored.

An error is returned when `key` exists and does not hold a sorted set.

## Examples

{{% redis-cli %}}
ZADD myzset 1 "one"
ZADD myzset 2 "two"
ZADD myzset 3 "three"
ZREM myzset "two"
ZRANGE myzset 0 -1 WITHSCORES
{{% /redis-cli %}}

## Return information

{{< multitabs id="zrem-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the number of members removed from the sorted set, not including non-existing members.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): the number of members removed from the sorted set, not including non-existing members.

{{< /multitabs >}}
