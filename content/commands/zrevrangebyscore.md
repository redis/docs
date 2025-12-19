---
acl_categories:
- '@read'
- '@sortedset'
- '@slow'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: max
  name: max
  type: double
- display_text: min
  name: min
  type: double
- display_text: withscores
  name: withscores
  optional: true
  token: WITHSCORES
  type: pure-token
- arguments:
  - display_text: offset
    name: offset
    type: integer
  - display_text: count
    name: count
    type: integer
  name: limit
  optional: true
  token: LIMIT
  type: block
arity: -4
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
complexity: O(log(N)+M) with N being the number of elements in the sorted set and
  M the number of elements being returned. If M is constant (e.g. always asking for
  the first 10 elements with LIMIT), you can consider it O(log(N)).
deprecated_since: 6.2.0
description: Returns members in a sorted set within a range of scores in reverse order.
doc_flags:
- deprecated
group: sorted-set
hidden: false
history:
- - 2.1.6
  - '`min` and `max` can be exclusive.'
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
linkTitle: ZREVRANGEBYSCORE
railroad_diagram: /images/railroad/zrevrangebyscore.svg
replaced_by: '`ZRANGE` with the `REV` and `BYSCORE` arguments'
since: 2.2.0
summary: Returns members in a sorted set within a range of scores in reverse order.
syntax_fmt: "ZREVRANGEBYSCORE key max min [WITHSCORES] [LIMIT\_offset count]"
title: ZREVRANGEBYSCORE
---
Returns all the elements in the sorted set at `key` with a score between `max`
and `min` (including elements with score equal to `max` or `min`).
In contrary to the default ordering of sorted sets, for this command the
elements are considered to be ordered from high to low scores.

The elements having the same score are returned in reverse lexicographical
order.

Apart from the reversed ordering, `ZREVRANGEBYSCORE` is similar to
[`ZRANGEBYSCORE`]({{< relref "/commands/zrangebyscore" >}}).

## Examples

{{% redis-cli %}}
ZADD myzset 1 "one"
ZADD myzset 2 "two"
ZADD myzset 3 "three"
ZREVRANGEBYSCORE myzset +inf -inf
ZREVRANGEBYSCORE myzset 2 1
ZREVRANGEBYSCORE myzset 2 (1
ZREVRANGEBYSCORE myzset (2 (1
{{% /redis-cli %}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | Deprecated as of Redis v6.2.0. |

## Return information

{{< multitabs id="zrevrangebyscore-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

* [Array reply](../../develop/reference/protocol-spec#arrays): a list of the members and, optionally, their scores in the specified score range.

-tab-sep-

* [Array reply](../../develop/reference/protocol-spec#arrays): a list of the members and, optionally, their scores in the specified score range.

{{< /multitabs >}}
