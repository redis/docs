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
- arguments:
  - display_text: before
    name: before
    token: BEFORE
    type: pure-token
  - display_text: after
    name: after
    token: AFTER
    type: pure-token
  name: where
  type: oneof
- display_text: pivot
  name: pivot
  type: string
- display_text: element
  name: element
  type: string
arity: 5
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
complexity: O(N) where N is the number of elements to traverse before seeing the value
  pivot. This means that inserting somewhere on the left end on the list (head) can
  be considered O(1) and inserting somewhere on the right end (tail) is O(N).
description: Inserts an element before or after another element in a list.
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
  insert: true
linkTitle: LINSERT
since: 2.2.0
summary: Inserts an element before or after another element in a list.
syntax_fmt: LINSERT key <BEFORE | AFTER> pivot element
syntax_str: <BEFORE | AFTER> pivot element
title: LINSERT
---
Inserts `element` in the list stored at `key` either before or after the reference
value `pivot`.

When `key` does not exist, it is considered an empty list and no operation is
performed.

An error is returned when `key` exists but does not hold a list value.

## Examples

{{% redis-cli %}}
RPUSH mylist "Hello"
RPUSH mylist "World"
LINSERT mylist BEFORE "World" "There"
LRANGE mylist 0 -1
{{% /redis-cli %}}

