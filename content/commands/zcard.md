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
arity: 2
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
- fast
complexity: O(1)
description: Returns the number of members in a sorted set.
group: sorted-set
hidden: false
key_specs:
- RO: true
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
linkTitle: ZCARD
since: 1.2.0
summary: Returns the number of members in a sorted set.
syntax_fmt: ZCARD key
syntax_str: ''
title: ZCARD
---
Returns the sorted set cardinality (number of elements) of the sorted set stored
at `key`.

## Examples

{{% redis-cli %}}
ZADD myzset 1 "one"
ZADD myzset 2 "two"
ZCARD myzset
{{% /redis-cli %}}

