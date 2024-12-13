---
acl_categories:
- '@topk'
- '@write'
- '@slow'
arguments:
- name: key
  type: key
- multiple: true
  name: items
  type: string
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
complexity: O(n * k) where n is the number of items and k is the depth
description: Increases the count of one or more items by increment
group: topk
hidden: false
linkTitle: TOPK.ADD
module: Bloom
since: 2.0.0
stack_path: docs/data-types/probabilistic
summary: Increases the count of one or more items by increment
syntax_fmt: TOPK.ADD key items [items ...]
syntax_str: items [items ...]
title: TOPK.ADD
---

Adds an item to the data structure. 
Multiple items can be added at once.
If an item enters the Top-K list, the item which is expelled is returned.
This allows dynamic heavy-hitter detection of items being entered or expelled from Top-K list. 

### Parameters

* **key**: Name of sketch where item is added.
* **item**: Item/s to be added.

### Return

[Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) - if an element was dropped from the TopK list, [Nil reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) otherwise..

#### Example

```
redis> TOPK.ADD topk foo bar 42
1) (nil)
2) baz
3) (nil)
```