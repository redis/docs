---
acl_categories:
- '@write'
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
- display_text: value
  name: value
  type: string
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
- denyoom
- fast
complexity: O(1)
description: Sets the value of a field in a hash only when the field doesn't exist.
group: hash
hidden: false
key_specs:
- RW: true
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
  insert: true
linkTitle: HSETNX
since: 2.0.0
summary: Sets the value of a field in a hash only when the field doesn't exist.
syntax_fmt: HSETNX key field value
syntax_str: field value
title: HSETNX
---
Sets `field` in the hash stored at `key` to `value`, only if `field` does not
yet exist.
If `key` does not exist, a new key holding a hash is created.
If `field` already exists, this operation has no effect.

## Examples

{{% redis-cli %}}
HSETNX myhash field "Hello"
HSETNX myhash field "World"
HGET myhash field
{{% /redis-cli %}}

