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
deprecated_since: '2.4'
description: Return the count for one or more items are in a sketch
group: topk
hidden: false
linkTitle: TOPK.COUNT
module: Bloom
since: 2.0.0
stack_path: docs/data-types/probabilistic
summary: Return the count for one or more items are in a sketch
syntax_fmt: TOPK.COUNT key item [item ...]
syntax_str: item [item ...]
title: TOPK.COUNT
---
Returns count for an item. 
Multiple items can be requested at once.
Please note this number will never be higher than the real count and likely to be lower.

This command has been deprecated. The count value is not a representative of
the number of appearances of an item.

### Parameters

* **key**: Name of sketch where item is counted.
* **item**: Item/s to be counted.

## Return

[Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) - count for responding item.

## Examples

```
redis> TOPK.COUNT topk foo 42 nonexist
1) (integer) 3
2) (integer) 1
3) (integer) 0
```
