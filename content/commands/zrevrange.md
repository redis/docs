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
- display_text: start
  name: start
  type: integer
- display_text: stop
  name: stop
  type: integer
- display_text: withscores
  name: withscores
  optional: true
  token: WITHSCORES
  type: pure-token
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
  M the number of elements returned.
deprecated_since: 6.2.0
description: Returns members in a sorted set within a range of indexes in reverse
  order.
doc_flags:
- deprecated
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
linkTitle: ZREVRANGE
railroad_diagram: /images/railroad/zrevrange.svg
replaced_by: '`ZRANGE` with the `REV` argument'
since: 1.2.0
summary: Returns members in a sorted set within a range of indexes in reverse order.
syntax_fmt: ZREVRANGE key start stop [WITHSCORES]
syntax_str: start stop [WITHSCORES]
title: ZREVRANGE
---
Returns the specified range of elements in the sorted set stored at `key`.
The elements are considered to be ordered from the highest to the lowest score.
Descending lexicographical order is used for elements with equal score.

Apart from the reversed ordering, `ZREVRANGE` is similar to [`ZRANGE`]({{< relref "/commands/zrange" >}}).

## Examples

{{% redis-cli %}}
ZADD myzset 1 "one"
ZADD myzset 2 "two"
ZADD myzset 3 "three"
ZREVRANGE myzset 0 -1
ZREVRANGE myzset 2 3
ZREVRANGE myzset -2 -1
{{% /redis-cli %}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | Deprecated as of Redis v6.2.0. |

## Return information

{{< multitabs id="zrevrange-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

* [Array reply](../../develop/reference/protocol-spec#arrays): a list of members in the specified range, optionally with their scores if _WITHSCORE_ was used.

-tab-sep-

* [Array reply](../../develop/reference/protocol-spec#arrays): a list of members in the specified range, optionally with their scores if _WITHSCORE_ was used.

{{< /multitabs >}}
