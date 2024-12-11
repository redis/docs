---
acl_categories:
- '@topk'
- '@write'
- '@slow'
arguments:
- name: key
  type: key
- arguments:
  - name: item
    type: string
  - name: increment
    type: integer
  multiple: true
  name: items
  type: block
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
complexity: O(n * k * incr) where n is the number of items, k is the depth and incr
  is the increment
description: Increases the count of one or more items by increment
group: topk
hidden: false
linkTitle: TOPK.INCRBY
module: Bloom
since: 2.0.0
stack_path: docs/data-types/probabilistic
summary: Increases the count of one or more items by increment
syntax_fmt: TOPK.INCRBY key item increment [item increment ...]
syntax_str: item increment [item increment ...]
title: TOPK.INCRBY
---
Increase the score of an item in the data structure by increment. 
Multiple items' score can be increased at once.
If an item enters the Top-K list, the item which is expelled is returned.

### Parameters

* **key**: Name of sketch where item is added.
* **item**: Item/s to be added.
* **increment**: increment to current item score. Increment must be greater or equal to 1. Increment is limited to 100,000 to avoid server freeze.

## Return

[Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) - if an element was dropped from the TopK list, [Nil reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) otherwise..

@example

```
redis> TOPK.INCRBY topk foo 3 bar 2 42 30
1) (nil)
2) (nil)
3) foo
```