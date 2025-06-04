---
acl_categories:
- '@read'
- '@set'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: member
  name: member
  type: string
arity: 3
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
description: Determines whether a member belongs to a set.
group: set
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
linkTitle: SISMEMBER
since: 1.0.0
summary: Determines whether a member belongs to a set.
syntax_fmt: SISMEMBER key member
syntax_str: member
title: SISMEMBER
---
Returns if `member` is a member of the set stored at `key`.

## Examples

{{% redis-cli %}}
SADD myset "one"
SISMEMBER myset "one"
SISMEMBER myset "two"
{{% /redis-cli %}}

