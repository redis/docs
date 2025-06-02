---
acl_categories:
- '@keyspace'
- '@read'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  multiple: true
  name: key
  type: key
arity: -2
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
complexity: O(N) where N is the number of keys to check.
description: Determines whether one or more keys exist.
group: generic
hidden: false
hints:
- request_policy:multi_shard
- response_policy:agg_sum
history:
- - 3.0.3
  - Accepts multiple `key` arguments.
key_specs:
- RO: true
  begin_search:
    spec:
      index: 1
    type: index
  find_keys:
    spec:
      keystep: 1
      lastkey: -1
      limit: 0
    type: range
linkTitle: EXISTS
since: 1.0.0
summary: Determines whether one or more keys exist.
syntax_fmt: EXISTS key [key ...]
syntax_str: ''
title: EXISTS
---
Returns if `key` exists.

The user should be aware that if the same existing key is mentioned in the arguments multiple times, it will be counted multiple times. So if `somekey` exists, `EXISTS somekey somekey` will return 2.

## Examples

{{% redis-cli %}}
SET key1 "Hello"
EXISTS key1
EXISTS nosuchkey
SET key2 "World"
EXISTS key1 key2 nosuchkey
{{% /redis-cli %}}

