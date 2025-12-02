---
acl_categories:
- '@write'
- '@list'
- '@slow'
- '@blocking'
arguments:
- display_text: source
  key_spec_index: 0
  name: source
  type: key
- display_text: destination
  key_spec_index: 1
  name: destination
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
  name: wherefrom
  type: oneof
- arguments:
  - display_text: left
    name: left
    token: LEFT
    type: pure-token
  - display_text: right
    name: right
    token: RIGHT
    type: pure-token
  name: whereto
  type: oneof
- display_text: timeout
  name: timeout
  type: double
arity: 6
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
- blocking
complexity: O(1)
description: Pops an element from a list, pushes it to another list and returns it.
  Blocks until an element is available otherwise. Deletes the list if the last element
  was moved.
group: list
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
- RW: true
  begin_search:
    spec:
      index: 2
    type: index
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
  insert: true
linkTitle: BLMOVE
since: 6.2.0
summary: Pops an element from a list, pushes it to another list and returns it. Blocks
  until an element is available otherwise. Deletes the list if the last element was
  moved.
syntax_fmt: BLMOVE source destination <LEFT | RIGHT> <LEFT | RIGHT> timeout
syntax_str: destination <LEFT | RIGHT> <LEFT | RIGHT> timeout
title: BLMOVE
---
`BLMOVE` is the blocking variant of [`LMOVE`]({{< relref "/commands/lmove" >}}).
When `source` contains elements, this command behaves exactly like [`LMOVE`]({{< relref "/commands/lmove" >}}).
When used inside a [`MULTI`]({{< relref "/commands/multi" >}})/[`EXEC`]({{< relref "/commands/exec" >}}) block or a Lua script, this command behaves exactly like [`LMOVE`]({{< relref "/commands/lmove" >}}).
When `source` is empty, Redis will block the connection until another client
pushes to it or until `timeout` (a double value specifying the maximum number of seconds to block) is reached.
A `timeout` of zero can be used to block indefinitely.

This command comes in place of the now deprecated [`BRPOPLPUSH`]({{< relref "/commands/brpoplpush" >}}). Doing
`BLMOVE RIGHT LEFT` is equivalent.

See [`LMOVE`]({{< relref "/commands/lmove" >}}) for more information.

## Pattern: Reliable queue

Please see the pattern description in the [`LMOVE`]({{< relref "/commands/lmove" >}}) documentation.

## Pattern: Circular list

Please see the pattern description in the [`LMOVE`]({{< relref "/commands/lmove" >}}) documentation.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="blmove-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): the element being popped from the _source_ and pushed to the _destination_.
* [Nil reply](../../develop/reference/protocol-spec#bulk-strings): the operation timed-out

-tab-sep-

One of the following:
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): the element being popped from the _source_ and pushed to the _destination_.
* [Null reply](../../develop/reference/protocol-spec#nulls): the operation timed-out

{{< /multitabs >}}
