---
acl_categories:
- '@topk'
- '@read'
- '@slow'
arguments:
- name: key
  type: key
- multiple: true
  name: item
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
complexity: O(n) where n is the number of items
description: Checks whether one or more items are in a sketch
group: topk
hidden: false
linkTitle: TOPK.QUERY
module: Bloom
since: 2.0.0
stack_path: docs/data-types/probabilistic
summary: Checks whether one or more items are in a sketch
syntax_fmt: TOPK.QUERY key item [item ...]
syntax_str: item [item ...]
title: TOPK.QUERY
---
Checks whether an item is one of Top-K items.
Multiple items can be checked at once.

### Parameters

* **key**: Name of sketch where item is queried.
* **item**: Item/s to be queried.

## Return

[Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) - "1" if item is in Top-K, otherwise "0".

## Examples

```
redis> TOPK.QUERY topk 42 nonexist
1) (integer) 1
2) (integer) 0
```