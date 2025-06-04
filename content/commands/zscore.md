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
description: Returns the score of a member in a sorted set.
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
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
linkTitle: ZSCORE
since: 1.2.0
summary: Returns the score of a member in a sorted set.
syntax_fmt: ZSCORE key member
syntax_str: member
title: ZSCORE
---
Returns the score of `member` in the sorted set at `key`.

If `member` does not exist in the sorted set, or `key` does not exist, `nil` is
returned.

## Examples

{{% redis-cli %}}
ZADD myzset 1 "one"
ZSCORE myzset "one"
{{% /redis-cli %}}

