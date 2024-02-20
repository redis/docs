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
  type: double
- display_text: max
  name: max
  type: double
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
description: Removes members in a sorted set within a range of scores. Deletes the
  sorted set if all members were removed.
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
linkTitle: ZREMRANGEBYSCORE
since: 1.2.0
summary: Removes members in a sorted set within a range of scores. Deletes the sorted
  set if all members were removed.
syntax_fmt: ZREMRANGEBYSCORE key min max
syntax_str: min max
title: ZREMRANGEBYSCORE
---
Removes all elements in the sorted set stored at `key` with a score between
`min` and `max` (inclusive).

## Examples

{{% redis-cli %}}
ZADD myzset 1 "one"
ZADD myzset 2 "two"
ZADD myzset 3 "three"
ZREMRANGEBYSCORE myzset -inf (2
ZRANGE myzset 0 -1 WITHSCORES
{{% /redis-cli %}}

