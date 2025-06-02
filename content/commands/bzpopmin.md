---
acl_categories:
- '@write'
- '@sortedset'
- '@fast'
- '@blocking'
arguments:
- display_text: key
  key_spec_index: 0
  multiple: true
  name: key
  type: key
- display_text: timeout
  name: timeout
  type: double
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
- write
- blocking
- fast
complexity: O(log(N)) with N being the number of elements in the sorted set.
description: Removes and returns the member with the lowest score from one or more
  sorted sets. Blocks until a member is available otherwise. Deletes the sorted set
  if the last element was popped.
group: sorted-set
hidden: false
history:
- - 6.0.0
  - '`timeout` is interpreted as a double instead of an integer.'
key_specs:
- RW: true
  access: true
  begin_search:
    spec:
      index: 1
    type: index
  delete: true
  find_keys:
    spec:
      keystep: 1
      lastkey: -2
      limit: 0
    type: range
linkTitle: BZPOPMIN
since: 5.0.0
summary: Removes and returns the member with the lowest score from one or more sorted
  sets. Blocks until a member is available otherwise. Deletes the sorted set if the
  last element was popped.
syntax_fmt: BZPOPMIN key [key ...] timeout
syntax_str: timeout
title: BZPOPMIN
---
`BZPOPMIN` is the blocking variant of the sorted set [`ZPOPMIN`]({{< relref "/commands/zpopmin" >}}) primitive.

It is the blocking version because it blocks the connection when there are no
members to pop from any of the given sorted sets.
A member with the lowest score is popped from first sorted set that is
non-empty, with the given keys being checked in the order that they are given.

The `timeout` argument is interpreted as a double value specifying the maximum
number of seconds to block. A timeout of zero can be used to block indefinitely.

See the [BLPOP documentation][cl] for the exact semantics, since `BZPOPMIN` is
identical to [`BLPOP`]({{< relref "/commands/blpop" >}}) with the only difference being the data structure being
popped from.

[cl]: /commands/blpop

## Examples

```
redis> DEL zset1 zset2
(integer) 0
redis> ZADD zset1 0 a 1 b 2 c
(integer) 3
redis> BZPOPMIN zset1 zset2 0
1) "zset1"
2) "a"
3) "0"
```
