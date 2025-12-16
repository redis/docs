---
acl_categories:
- '@write'
- '@list'
- '@slow'
arguments:
- display_text: source
  key_spec_index: 0
  name: source
  type: key
- display_text: destination
  key_spec_index: 1
  name: destination
  type: key
arity: 3
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
complexity: O(1)
deprecated_since: 6.2.0
description: Returns the last element of a list after removing and pushing it to another
  list. Deletes the list if the last element was popped.
doc_flags:
- deprecated
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
linkTitle: RPOPLPUSH
railroad_diagram: /images/railroad/rpoplpush.svg
replaced_by: '`LMOVE` with the `RIGHT` and `LEFT` arguments'
since: 1.2.0
summary: Returns the last element of a list after removing and pushing it to another
  list. Deletes the list if the last element was popped.
syntax_fmt: RPOPLPUSH source destination
title: RPOPLPUSH
---
Atomically returns and removes the last element (tail) of the list stored at
`source`, and pushes the element at the first element (head) of the list stored
at `destination`.

For example: consider `source` holding the list `a,b,c`, and `destination`
holding the list `x,y,z`.
Executing `RPOPLPUSH` results in `source` holding `a,b` and `destination`
holding `c,x,y,z`.

If `source` does not exist, the value `nil` is returned and no operation is
performed.
If `source` and `destination` are the same, the operation is equivalent to
removing the last element from the list and pushing it as first element of the
list, so it can be considered as a list rotation command.

## Examples

{{% redis-cli %}}
RPUSH mylist "one"
RPUSH mylist "two"
RPUSH mylist "three"
RPOPLPUSH mylist myotherlist
LRANGE mylist 0 -1
LRANGE myotherlist 0 -1
{{% /redis-cli %}}

## Pattern: Reliable queue

Redis is often used as a messaging server to implement processing of background
jobs or other kinds of messaging tasks.
A simple form of queue is often obtained pushing values into a list in the
producer side, and waiting for this values in the consumer side using [`RPOP`]({{< relref "/commands/rpop" >}})
(using polling), or [`BRPOP`]({{< relref "/commands/brpop" >}}) if the client is better served by a blocking
operation.

However in this context the obtained queue is not _reliable_ as messages can
be lost, for example in the case there is a network problem or if the consumer
crashes just after the message is received but before it can be processed.

`RPOPLPUSH` (or [`BRPOPLPUSH`]({{< relref "/commands/brpoplpush" >}}) for the blocking variant) offers a way to avoid
this problem: the consumer fetches the message and at the same time pushes it
into a _processing_ list.
It will use the [`LREM`]({{< relref "/commands/lrem" >}}) command in order to remove the message from the
_processing_ list once the message has been processed.

An additional client may monitor the _processing_ list for items that remain
there for too much time, pushing timed out items into the queue
again if needed.

## Pattern: Circular list

Using `RPOPLPUSH` with the same source and destination key, a client can visit
all the elements of an N-elements list, one after the other, in O(N) without
transferring the full list from the server to the client using a single [`LRANGE`]({{< relref "/commands/lrange" >}})
operation.

The above pattern works even if one or both of the following conditions occur:

* There are multiple clients rotating the list: they'll fetch different 
  elements, until all the elements of the list are visited, and the process 
  restarts.
* Other clients are actively pushing new items at the end of the list.

The above makes it very simple to implement a system where a set of items must
be processed by N workers continuously as fast as possible.
An example is a monitoring system that must check that a set of web sites are
reachable, with the smallest delay possible, using a number of parallel workers.

Note that this implementation of workers is trivially scalable and reliable,
because even if a message is lost the item is still in the queue and will be
processed at the next iteration.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | Deprecated as of Redis v6.2.0. |

## Return information

{{< multitabs id="rpoplpush-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): the element being popped and pushed.
* [Nil reply](../../develop/reference/protocol-spec#bulk-strings): if the source list is empty.

-tab-sep-

One of the following:
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): the element being popped and pushed.
* [Null reply](../../develop/reference/protocol-spec#nulls): if the source list is empty.

{{< /multitabs >}}
