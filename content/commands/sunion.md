---
acl_categories:
- '@read'
- '@set'
- '@slow'
arguments:
- display_text: key
  key_spec_index: 0
  multiple: true
  name: key
  type: key
arity: -2
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
complexity: O(N) where N is the total number of elements in all given sets.
description: Returns the union of multiple sets.
group: set
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
      lastkey: -1
      limit: 0
    type: range
linkTitle: SUNION
since: 1.0.0
summary: Returns the union of multiple sets.
syntax_fmt: SUNION key [key ...]
syntax_str: ''
title: SUNION
---
Returns the members of the set resulting from the union of all the given sets.

For example:

```
key1 = {a,b,c,d}
key2 = {c}
key3 = {a,c,e}
SUNION key1 key2 key3 = {a,b,c,d,e}
```

Keys that do not exist are considered to be empty sets.

## Examples

{{% redis-cli %}}
SADD key1 "a"
SADD key1 "b"
SADD key1 "c"
SADD key2 "c"
SADD key2 "d"
SADD key2 "e"
SUNION key1 key2
{{% /redis-cli %}}

