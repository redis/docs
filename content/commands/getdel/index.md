---
acl_categories:
- '@write'
- '@string'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
arity: 2
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
- fast
complexity: O(1)
description: Returns the string value of a key after deleting the key.
group: string
hidden: false
key_specs:
- RW: true
  access: true
  begin_search:
    spec:
      index: 1
    type: index
  delete: true
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
linkTitle: GETDEL
since: 6.2.0
summary: Returns the string value of a key after deleting the key.
syntax_fmt: GETDEL key
syntax_str: ''
title: GETDEL
---
Get the value of `key` and delete the key.
This command is similar to [`GET`]({{< relref "/commands/get" >}}), except for the fact that it also deletes the key on success (if and only if the key's value type is a string).

## Examples

{{% redis-cli %}}
SET mykey "Hello"
GETDEL mykey
GET mykey
{{% /redis-cli %}}

