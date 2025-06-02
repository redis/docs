---
acl_categories:
- '@write'
- '@sortedset'
- '@slow'
arguments:
- display_text: destination
  key_spec_index: 0
  name: destination
  type: key
- display_text: numkeys
  name: numkeys
  type: integer
- display_text: key
  key_spec_index: 1
  multiple: true
  name: key
  type: key
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
- write
- denyoom
- movablekeys
complexity: O(L + (N-K)log(N)) worst case where L is the total number of elements
  in all the sets, N is the size of the first set, and K is the size of the result
  set.
description: Stores the difference of multiple sorted sets in a key.
group: sorted-set
hidden: false
key_specs:
- OW: true
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
  update: true
- RO: true
  access: true
  begin_search:
    spec:
      index: 2
    type: index
  find_keys:
    spec:
      firstkey: 1
      keynumidx: 0
      keystep: 1
    type: keynum
linkTitle: ZDIFFSTORE
since: 6.2.0
summary: Stores the difference of multiple sorted sets in a key.
syntax_fmt: ZDIFFSTORE destination numkeys key [key ...]
syntax_str: numkeys key [key ...]
title: ZDIFFSTORE
---
Computes the difference between the first and all successive input sorted sets
and stores the result in `destination`. The total number of input keys is
specified by `numkeys`.

Keys that do not exist are considered to be empty sets.

If `destination` already exists, it is overwritten.

## Examples

{{% redis-cli %}}
ZADD zset1 1 "one"
ZADD zset1 2 "two"
ZADD zset1 3 "three"
ZADD zset2 1 "one"
ZADD zset2 2 "two"
ZDIFFSTORE out 2 zset1 zset2
ZRANGE out 0 -1 WITHSCORES
{{% /redis-cli %}}

