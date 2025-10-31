---
acl_categories:
- '@write'
- '@sortedset'
- '@slow'
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
- oss
- kubernetes
- clients
command_flags:
- write
complexity: O(log(N)+M) with N being the number of elements in the sorted set and
  M the number of elements removed by the operation.
description: Removes members in a sorted set within a lexicographical range. Deletes
  the sorted set if all members were removed.
group: sorted-set
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
linkTitle: ZREMRANGEBYLEX
since: 2.8.9
summary: Removes members in a sorted set within a lexicographical range. Deletes the
  sorted set if all members were removed.
syntax_fmt: ZREMRANGEBYLEX key min max
syntax_str: min max
title: ZREMRANGEBYLEX
---
When all the elements in a sorted set are inserted with the same score, in order to force lexicographical ordering, this command removes all elements in the sorted set stored at `key` between the lexicographical range specified by `min` and `max`.

The meaning of `min` and `max` are the same of the [`ZRANGEBYLEX`]({{< relref "/commands/zrangebylex" >}}) command. Similarly, this command actually removes the same elements that [`ZRANGEBYLEX`]({{< relref "/commands/zrangebylex" >}}) would return if called with the same `min` and `max` arguments.

## Examples

{{% redis-cli %}}
ZADD myzset 0 aaaa 0 b 0 c 0 d 0 e
ZADD myzset 0 foo 0 zap 0 zip 0 ALPHA 0 alpha
ZRANGE myzset 0 -1
ZREMRANGEBYLEX myzset [alpha [omega
ZRANGE myzset 0 -1
{{% /redis-cli %}}

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="zremrangebylex-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the number of members removed.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): Number of members removed.

{{< /multitabs >}}
