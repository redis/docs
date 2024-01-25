---
acl_categories:
- '@read'
- '@string'
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
complexity: O(N) where N is the number of keys to retrieve.
description: Atomically returns the string values of one or more keys.
group: string
hidden: false
hints:
- request_policy:multi_shard
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
      lastkey: -1
      limit: 0
    type: range
linkTitle: MGET
since: 1.0.0
summary: Atomically returns the string values of one or more keys.
syntax_fmt: MGET key [key ...]
syntax_str: ''
title: MGET
---
Returns the values of all specified keys.
For every key that does not hold a string value or does not exist, the special
value `nil` is returned.
Because of this, the operation never fails.

## Examples

{{% redis-cli %}}
SET key1 "Hello"
SET key2 "World"
MGET key1 key2 nonexisting
{{% /redis-cli %}}

