---
acl_categories:
- '@write'
- '@list'
- '@slow'
- '@blocking'
arguments:
- display_text: timeout
  name: timeout
  type: double
- display_text: numkeys
  name: numkeys
  type: integer
- display_text: key
  key_spec_index: 0
  multiple: true
  name: key
  type: key
- arguments:
  - display_text: left
    name: left
    token: LEFT
    type: pure-token
  - display_text: right
    name: right
    token: RIGHT
    type: pure-token
  name: where
  type: oneof
- display_text: count
  name: count
  optional: true
  token: COUNT
  type: integer
arity: -5
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
- movablekeys
complexity: O(N+M) where N is the number of provided keys and M is the number of elements
  returned.
description: Pops the first element from one of multiple lists. Blocks until an element
  is available otherwise. Deletes the list if the last element was popped.
group: list
hidden: false
key_specs:
- RW: true
  access: true
  begin_search:
    spec:
      index: 2
    type: index
  delete: true
  find_keys:
    spec:
      firstkey: 1
      keynumidx: 0
      keystep: 1
    type: keynum
linkTitle: BLMPOP
since: 7.0.0
summary: Pops the first element from one of multiple lists. Blocks until an element
  is available otherwise. Deletes the list if the last element was popped.
syntax_fmt: "BLMPOP timeout numkeys key [key ...] <LEFT | RIGHT> [COUNT\_count]"
syntax_str: "numkeys key [key ...] <LEFT | RIGHT> [COUNT\_count]"
title: BLMPOP
---
`BLMPOP` is the blocking variant of [`LMPOP`]({{< relref "/commands/lmpop" >}}).

When any of the lists contains elements, this command behaves exactly like [`LMPOP`]({{< relref "/commands/lmpop" >}}).
When used inside a [`MULTI`]({{< relref "/commands/multi" >}})/[`EXEC`]({{< relref "/commands/exec" >}}) block, this command behaves exactly like [`LMPOP`]({{< relref "/commands/lmpop" >}}).
When all lists are empty, Redis will block the connection until another client pushes to it or until the `timeout` (a double value specifying the maximum number of seconds to block) elapses.
A `timeout` of zero can be used to block indefinitely.

See [`LMPOP`]({{< relref "/commands/lmpop" >}}) for more information.
