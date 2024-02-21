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
complexity: O(N) where N is the number of keys that will be touched.
description: Returns the number of existing keys out of those specified after updating
  the time they were last accessed.
group: generic
hidden: false
hints:
- request_policy:multi_shard
- response_policy:agg_sum
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
linkTitle: TOUCH
since: 3.2.1
summary: Returns the number of existing keys out of those specified after updating
  the time they were last accessed.
syntax_fmt: TOUCH key [key ...]
syntax_str: ''
title: TOUCH
---
Alters the last access time of a key(s).
A key is ignored if it does not exist.

## Examples

{{% redis-cli %}}
SET key1 "Hello"
SET key2 "World"
TOUCH key1 key2
{{% /redis-cli %}}

