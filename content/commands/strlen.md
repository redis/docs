---
acl_categories:
- '@read'
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
- readonly
- fast
complexity: O(1)
description: Returns the length of a string value.
group: string
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
linkTitle: STRLEN
since: 2.2.0
summary: Returns the length of a string value.
syntax_fmt: STRLEN key
syntax_str: ''
title: STRLEN
---
Returns the length of the string value stored at `key`.
An error is returned when `key` holds a non-string value.

## Examples

{{% redis-cli %}}
SET mykey "Hello world"
STRLEN mykey
STRLEN nonexisting
{{% /redis-cli %}}

