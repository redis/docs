---
acl_categories:
- '@read'
- '@sortedset'
- '@slow'
arguments:
- display_text: numkeys
  name: numkeys
  type: integer
- display_text: key
  key_spec_index: 0
  multiple: true
  name: key
  type: key
- display_text: limit
  name: limit
  optional: true
  token: LIMIT
  type: integer
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
- movablekeys
complexity: O(N*K) worst case with N being the smallest input sorted set, K being
  the number of input sorted sets.
description: Returns the number of members of the intersect of multiple sorted sets.
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
      firstkey: 1
      keynumidx: 0
      keystep: 1
    type: keynum
linkTitle: ZINTERCARD
since: 7.0.0
summary: Returns the number of members of the intersect of multiple sorted sets.
syntax_fmt: "ZINTERCARD numkeys key [key ...] [LIMIT\_limit]"
syntax_str: "key [key ...] [LIMIT\_limit]"
title: ZINTERCARD
---
This command is similar to [`ZINTER`]({{< relref "/commands/zinter" >}}), but instead of returning the result set, it returns just the cardinality of the result.

Keys that do not exist are considered to be empty sets.
With one of the keys being an empty set, the resulting set is also empty (since set intersection with an empty set always results in an empty set).

By default, the command calculates the cardinality of the intersection of all given sets.
When provided with the optional `LIMIT` argument (which defaults to 0 and means unlimited), if the intersection cardinality reaches limit partway through the computation, the algorithm will exit and yield limit as the cardinality.
Such implementation ensures a significant speedup for queries where the limit is lower than the actual intersection cardinality.

## Examples

{{% redis-cli %}}
ZADD zset1 1 "one"
ZADD zset1 2 "two"
ZADD zset2 1 "one"
ZADD zset2 2 "two"
ZADD zset2 3 "three"
ZINTER 2 zset1 zset2
ZINTERCARD 2 zset1 zset2
ZINTERCARD 2 zset1 zset2 LIMIT 1
{{% /redis-cli %}}

