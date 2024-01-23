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
replaced_by: '[`ZRANGE`]({{< relref "/commands/zrange" >}}) with the `REV` argument'
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

