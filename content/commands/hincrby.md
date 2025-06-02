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
- display_text: increment
  name: increment
  type: integer
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
description: Increments the integer value of a field in a hash by a number. Uses 0
  as initial value if the field doesn't exist.
group: hash
hidden: false
key_specs:
- RW: true
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
  update: true
linkTitle: HINCRBY
since: 2.0.0
summary: Increments the integer value of a field in a hash by a number. Uses 0 as
  initial value if the field doesn't exist.
syntax_fmt: HINCRBY key field increment
syntax_str: field increment
title: HINCRBY
---
Increments the number stored at `field` in the hash stored at `key` by
`increment`.
If `key` does not exist, a new key holding a hash is created.
If `field` does not exist the value is set to `0` before the operation is
performed.

The range of values supported by `HINCRBY` is limited to 64 bit signed integers.

## Examples

Since the `increment` argument is signed, both increment and decrement
operations can be performed:

{{% redis-cli %}}
HSET myhash field 5
HINCRBY myhash field 1
HINCRBY myhash field -1
HINCRBY myhash field -10
{{% /redis-cli %}}

