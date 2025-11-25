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
  name: member
  type: string
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
- readonly
- fast
complexity: O(1)
description: Returns the score of a member in a sorted set.
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
linkTitle: ZSCORE
railroad_diagram: /images/railroad/zscore.svg
since: 1.2.0
summary: Returns the score of a member in a sorted set.
syntax_fmt: ZSCORE key member
syntax_str: member
title: ZSCORE
---
Returns the score of `member` in the sorted set at `key`.

If `member` does not exist in the sorted set, or `key` does not exist, `nil` is
returned.

## Examples

{{% redis-cli %}}
ZADD myzset 1 "one"
ZSCORE myzset "one"
{{% /redis-cli %}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="zscore-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): the score of the member (a double-precision floating point number), represented as a string.
* [Nil reply](../../develop/reference/protocol-spec#bulk-strings): if _member_ does not exist in the sorted set, or the key does not exist.

-tab-sep-

One of the following:
* [Double reply](../../develop/reference/protocol-spec#doubles): the score of the member (a double-precision floating point number).
* [Nil reply](../../develop/reference/protocol-spec#bulk-strings): if _member_ does not exist in the sorted set, or the key does not exist.

{{< /multitabs >}}
