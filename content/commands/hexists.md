---
acl_categories:
- '@read'
- '@hash'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: field
  name: field
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
description: Determines whether a field exists in a hash.
group: hash
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
linkTitle: HEXISTS
since: 2.0.0
summary: Determines whether a field exists in a hash.
syntax_fmt: HEXISTS key field
syntax_str: field
title: HEXISTS
---
Returns if `field` is an existing field in the hash stored at `key`.

## Examples

{{% redis-cli %}}
HSET myhash field1 "foo"
HEXISTS myhash field1
HEXISTS myhash field2
{{% /redis-cli %}}

