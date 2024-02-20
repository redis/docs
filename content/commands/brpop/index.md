---
acl_categories:
- '@write'
- '@list'
- '@slow'
- '@blocking'
arguments:
- display_text: key
  key_spec_index: 0
  multiple: true
  name: key
  type: key
- display_text: timeout
  name: timeout
  type: double
arity: -3
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
- blocking
complexity: O(N) where N is the number of provided keys.
description: Removes and returns the last element in a list. Blocks until an element
  is available otherwise. Deletes the list if the last element was popped.
group: list
hidden: false
history:
- - 6.0.0
  - '`timeout` is interpreted as a double instead of an integer.'
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
      lastkey: -2
      limit: 0
    type: range
linkTitle: BRPOP
since: 2.0.0
summary: Removes and returns the last element in a list. Blocks until an element is
  available otherwise. Deletes the list if the last element was popped.
syntax_fmt: BRPOP key [key ...] timeout
syntax_str: timeout
title: BRPOP
---
`BRPOP` is a blocking list pop primitive.
It is the blocking version of [`RPOP`]({{< relref "/commands/rpop" >}}) because it blocks the connection when there
are no elements to pop from any of the given lists.
An element is popped from the tail of the first list that is non-empty, with the
given keys being checked in the order that they are given.

See the [BLPOP documentation][cb] for the exact semantics, since `BRPOP` is
identical to [`BLPOP`]({{< relref "/commands/blpop" >}}) with the only difference being that it pops elements from
the tail of a list instead of popping from the head.

[cb]: /commands/blpop

## Examples

```
redis> DEL list1 list2
(integer) 0
redis> RPUSH list1 a b c
(integer) 3
redis> BRPOP list1 list2 0
1) "list1"
2) "c"
```
