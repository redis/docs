---
acl_categories:
- '@read'
- '@hash'
- '@slow'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
arity: 2
command_flags:
- readonly
complexity: O(N) where N is the size of the hash.
description: Returns all values in a hash.
group: hash
hidden: false
hints:
- nondeterministic_output_order
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
linkTitle: HVALS
since: 2.0.0
summary: Returns all values in a hash.
syntax_fmt: HVALS key
syntax_str: ''
title: HVALS
---
Returns all values in the hash stored at `key`.

## Examples

{{% redis-cli %}}
HSET myhash field1 "Hello"
HSET myhash field2 "World"
HVALS myhash
{{% /redis-cli %}}

