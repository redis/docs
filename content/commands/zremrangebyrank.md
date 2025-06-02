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
- display_text: start
  name: start
  type: integer
- display_text: stop
  name: stop
  type: integer
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
description: Removes members in a sorted set within a range of indexes. Deletes the
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
linkTitle: ZREMRANGEBYRANK
since: 2.0.0
summary: Removes members in a sorted set within a range of indexes. Deletes the sorted
  set if all members were removed.
syntax_fmt: ZREMRANGEBYRANK key start stop
syntax_str: start stop
title: ZREMRANGEBYRANK
---
Removes all elements in the sorted set stored at `key` with rank between `start`
and `stop`.
Both `start` and `stop` are `0` -based indexes with `0` being the element with
the lowest score.
These indexes can be negative numbers, where they indicate offsets starting at
the element with the highest score.
For example: `-1` is the element with the highest score, `-2` the element with
the second highest score and so forth.

## Examples

{{% redis-cli %}}
ZADD myzset 1 "one"
ZADD myzset 2 "two"
ZADD myzset 3 "three"
ZREMRANGEBYRANK myzset 0 1
ZRANGE myzset 0 -1 WITHSCORES
{{% /redis-cli %}}

