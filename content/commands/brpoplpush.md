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
- display_text: timeout
  name: timeout
  type: double
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
- blocking
complexity: O(1)
deprecated_since: 6.2.0
description: Pops an element from a list, pushes it to another list and returns it.
  Block until an element is available otherwise. Deletes the list if the last element
  was popped.
doc_flags:
- deprecated
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
linkTitle: BRPOPLPUSH
replaced_by: '[`BLMOVE`]({{< relref "/commands/blmove" >}}) with the `RIGHT` and `LEFT`
  arguments'
since: 2.2.0
summary: Pops an element from a list, pushes it to another list and returns it. Block
  until an element is available otherwise. Deletes the list if the last element was
  popped.
syntax_fmt: BRPOPLPUSH source destination timeout
syntax_str: destination timeout
title: BRPOPLPUSH
---
`BRPOPLPUSH` is the blocking variant of [`RPOPLPUSH`]({{< relref "/commands/rpoplpush" >}}).
When `source` contains elements, this command behaves exactly like [`RPOPLPUSH`]({{< relref "/commands/rpoplpush" >}}).
When used inside a [`MULTI`]({{< relref "/commands/multi" >}})/[`EXEC`]({{< relref "/commands/exec" >}}) block, this command behaves exactly like [`RPOPLPUSH`]({{< relref "/commands/rpoplpush" >}}).
When `source` is empty, Redis will block the connection until another client
pushes to it or until `timeout` is reached.
A `timeout` of zero can be used to block indefinitely.

See [`RPOPLPUSH`]({{< relref "/commands/rpoplpush" >}}) for more information.

## Pattern: Reliable queue

Please see the pattern description in the [`RPOPLPUSH`]({{< relref "/commands/rpoplpush" >}}) documentation.

## Pattern: Circular list

Please see the pattern description in the [`RPOPLPUSH`]({{< relref "/commands/rpoplpush" >}}) documentation.

## Return information

{{< multitabs id="brpoplpush-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): the element being popped from _source_ and pushed to _destination_.
* [Nil reply](../../develop/reference/protocol-spec#bulk-strings): the timeout is reached.

-tab-sep-

One of the following:
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): the element being popped from _source_ and pushed to _destination_.
* [Null reply](../../develop/reference/protocol-spec#nulls): the timeout is reached.

{{< /multitabs >}}
