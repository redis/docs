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
complexity: O(N) where N is the number of fields being set.
deprecated_since: 4.0.0
description: Sets the values of multiple fields.
doc_flags:
- deprecated
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
  update: true
linkTitle: HMSET
replaced_by: '[`HSET`]({{< relref "/commands/hset" >}}) with multiple field-value
  pairs'
since: 2.0.0
summary: Sets the values of multiple fields.
syntax_fmt: HMSET key field value [field value ...]
syntax_str: field value [field value ...]
title: HMSET
---
Sets the specified fields to their respective values in the hash stored at
`key`.
This command overwrites any specified fields already existing in the hash.
If `key` does not exist, a new key holding a hash is created.

## Examples

{{% redis-cli %}}
HMSET myhash field1 "Hello" field2 "World"
HGET myhash field1
HGET myhash field2
{{% /redis-cli %}}

