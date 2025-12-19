---
acl_categories:
- '@write'
- '@sortedset'
- '@fast'
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
- fast
complexity: O(log(N)) with N being the number of elements in the sorted set.
description: Removes and returns the member with the highest score from one or more
  sorted sets. Blocks until a member available otherwise.  Deletes the sorted set
  if the last element was popped.
group: sorted-set
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
linkTitle: BZPOPMAX
railroad_diagram: /images/railroad/bzpopmax.svg
since: 5.0.0
summary: Removes and returns the member with the highest score from one or more sorted
  sets. Blocks until a member available otherwise.  Deletes the sorted set if the
  last element was popped.
syntax_fmt: BZPOPMAX key [key ...] timeout
title: BZPOPMAX
---
`BZPOPMAX` is the blocking variant of the sorted set [`ZPOPMAX`]({{< relref "/commands/zpopmax" >}}) primitive.

It is the blocking version because it blocks the connection when there are no
members to pop from any of the given sorted sets.
A member with the highest score is popped from first sorted set that is
non-empty, with the given keys being checked in the order that they are given.

The `timeout` argument is interpreted as a double value specifying the maximum
number of seconds to block. A timeout of zero can be used to block indefinitely.

See the [BZPOPMIN documentation][cb] for the exact semantics, since `BZPOPMAX`
is identical to [`BZPOPMIN`]({{< relref "/commands/bzpopmin" >}}) with the only difference being that it pops members
with the highest scores instead of popping the ones with the lowest scores.

[cb]: /commands/bzpopmin

## Examples

```
redis> DEL zset1 zset2
(integer) 0
redis> ZADD zset1 0 a 1 b 2 c
(integer) 3
redis> BZPOPMAX zset1 zset2 0
1) "zset1"
2) "c"
3) "2"
```

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="bzpopmax-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Nil reply](../../develop/reference/protocol-spec#bulk-strings): when no element could be popped and the _timeout_ expired.
* [Array reply](../../develop/reference/protocol-spec#arrays): the keyname, popped member, and its score.

-tab-sep-

One of the following:
* [Null reply](../../develop/reference/protocol-spec#nulls): when no element could be popped and the _timeout_ expired.
* [Array reply](../../develop/reference/protocol-spec#arrays): the keyname, popped member, and its score.

{{< /multitabs >}}
