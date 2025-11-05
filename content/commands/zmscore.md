---
acl_categories:
- '@read'
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
- readonly
- fast
complexity: O(N) where N is the number of members being requested.
description: Returns the score of one or more members in a sorted set.
group: sorted-set
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
linkTitle: ZMSCORE
since: 6.2.0
summary: Returns the score of one or more members in a sorted set.
syntax_fmt: ZMSCORE key member [member ...]
syntax_str: member [member ...]
title: ZMSCORE
---
Returns the scores associated with the specified `members` in the sorted set stored at `key`.

For every `member` that does not exist in the sorted set, a `nil` value is returned.

## Examples

{{% redis-cli %}}
ZADD myzset 1 "one"
ZADD myzset 2 "two"
ZMSCORE myzset "one" "two" "nofield"
{{% /redis-cli %}}

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="zmscore-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Nil reply](../../develop/reference/protocol-spec#bulk-strings): if the member does not exist in the sorted set.
* [Array reply](../../develop/reference/protocol-spec#arrays): a list of [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings) _member_ scores as double-precision floating point numbers.

-tab-sep-

One of the following:
* [Null reply](../../develop/reference/protocol-spec#nulls): if the member does not exist in the sorted set.
* [Array reply](../../develop/reference/protocol-spec#arrays): a list of [Double reply](../../develop/reference/protocol-spec#doubles) _member_ scores as double-precision floating point numbers.

{{< /multitabs >}}
