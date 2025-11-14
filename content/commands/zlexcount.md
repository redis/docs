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
- display_text: min
  name: min
  type: string
- display_text: max
  name: max
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
- readonly
- fast
complexity: O(log(N)) with N being the number of elements in the sorted set.
description: Returns the number of members in a sorted set within a lexicographical
  range.
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
linkTitle: ZLEXCOUNT
since: 2.8.9
summary: Returns the number of members in a sorted set within a lexicographical range.
syntax_fmt: ZLEXCOUNT key min max
syntax_str: min max
title: ZLEXCOUNT
---
When all the elements in a sorted set are inserted with the same score, in order to force lexicographical ordering, this command returns the number of elements in the sorted set at `key` with a value between `min` and `max`.

The `min` and `max` arguments have the same meaning as described for
[`ZRANGEBYLEX`]({{< relref "/commands/zrangebylex" >}}).

Note: the command has a complexity of just O(log(N)) because it uses elements ranks (see [`ZRANK`]({{< relref "/commands/zrank" >}})) to get an idea of the range. Because of this there is no need to do a work proportional to the size of the range.

## Examples

{{% redis-cli %}}
ZADD myzset 0 a 0 b 0 c 0 d 0 e
ZADD myzset 0 f 0 g
ZLEXCOUNT myzset - +
ZLEXCOUNT myzset [b [f
{{% /redis-cli %}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="zlexcount-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the number of members in the specified score range.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): the number of members in the specified score range.

{{< /multitabs >}}
