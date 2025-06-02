---
acl_categories:
- '@read'
- '@string'
- '@slow'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: start
  name: start
  type: integer
- display_text: end
  name: end
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
- readonly
complexity: O(N) where N is the length of the returned string. The complexity is ultimately
  determined by the returned length, but because creating a substring from an existing
  string is very cheap, it can be considered O(1) for small strings.
deprecated_since: 2.0.0
description: Returns a substring from a string value.
doc_flags:
- deprecated
group: string
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
linkTitle: SUBSTR
replaced_by: '[`GETRANGE`]({{< relref "/commands/getrange" >}})'
since: 1.0.0
summary: Returns a substring from a string value.
syntax_fmt: SUBSTR key start end
syntax_str: start end
title: SUBSTR
---
Returns the substring of the string value stored at `key`, determined by the
offsets `start` and `end` (both are inclusive).
Negative offsets can be used in order to provide an offset starting from the end
of the string.
So -1 means the last character, -2 the penultimate and so forth.

The function handles out of range requests by limiting the resulting range to
the actual length of the string.

## Examples

{{% redis-cli %}}
SET mykey "This is a string"
GETRANGE mykey 0 3
GETRANGE mykey -3 -1
GETRANGE mykey 0 -1
GETRANGE mykey 10 100
{{% /redis-cli %}}

