---
acl_categories:
- '@write'
- '@sortedset'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: count
  name: count
  optional: true
  type: integer
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
- write
- fast
complexity: O(log(N)*M) with N being the number of elements in the sorted set, and
  M being the number of elements popped.
description: Returns the highest-scoring members from a sorted set after removing
  them. Deletes the sorted set if the last member was popped.
group: sorted-set
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
linkTitle: ZPOPMAX
since: 5.0.0
summary: Returns the highest-scoring members from a sorted set after removing them.
  Deletes the sorted set if the last member was popped.
syntax_fmt: ZPOPMAX key [count]
syntax_str: '[count]'
title: ZPOPMAX
---
Removes and returns up to `count` members with the highest scores in the sorted
set stored at `key`.

When left unspecified, the default value for `count` is 1. Specifying a `count`
value that is higher than the sorted set's cardinality will not produce an
error. When returning multiple elements, the one with the highest score will
be the first, followed by the elements with lower scores.

## Examples

{{% redis-cli %}}
ZADD myzset 1 "one"
ZADD myzset 2 "two"
ZADD myzset 3 "three"
ZPOPMAX myzset
{{% /redis-cli %}}

## Return information

{{< multitabs id="zpopmax-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

* [Array reply](../../develop/reference/protocol-spec#arrays): a list of popped elements and scores.

-tab-sep-

* [Array reply](../../develop/reference/protocol-spec#arrays): a list of popped elements and scores.

{{< /multitabs >}}
