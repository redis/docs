---
acl_categories:
- '@write'
- '@list'
- '@slow'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: index
  name: index
  type: integer
- display_text: element
  name: element
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
complexity: O(N) where N is the length of the list. Setting either the first or the
  last element of the list is O(1).
description: Sets the value of an element in a list by its index.
group: list
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
linkTitle: LSET
since: 1.0.0
summary: Sets the value of an element in a list by its index.
syntax_fmt: LSET key index element
syntax_str: index element
title: LSET
---
Sets the list element at `index` to `element`.
For more information on the `index` argument, see [`LINDEX`]({{< relref "/commands/lindex" >}}).

An error is returned for out of range indexes.

## Examples

{{% redis-cli %}}
RPUSH mylist "one"
RPUSH mylist "two"
RPUSH mylist "three"
LSET mylist 0 "four"
LSET mylist -2 "five"
LRANGE mylist 0 -1
{{% /redis-cli %}}

