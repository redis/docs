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
- arguments:
  - display_text: field
    name: field
    type: string
  - display_text: value
    name: value
    type: string
  multiple: true
  name: data
  type: block
arity: -4
command_flags:
- write
- denyoom
- fast
complexity: O(1) for each field/value pair added, so O(N) to add N field/value pairs
  when the command is called with multiple field/value pairs.
description: Creates or modifies the value of a field in a hash.
group: hash
hidden: false
history:
- - 4.0.0
  - Accepts multiple `field` and `value` arguments.
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
  update: true
linkTitle: HSET
since: 2.0.0
summary: Creates or modifies the value of a field in a hash.
syntax_fmt: HSET key field value [field value ...]
syntax_str: field value [field value ...]
title: HSET
---
Sets the specified fields to their respective values in the hash stored at `key`.

This command overwrites the values of specified fields that exist in the hash.
If `key` doesn't exist, a new key holding a hash is created.

## Examples

{{% redis-cli %}}
HSET myhash field1 "Hello"
HGET myhash field1
HSET myhash field2 "Hi" field3 "World"
HGET myhash field2
HGET myhash field3
HGETALL myhash
{{% /redis-cli %}}

