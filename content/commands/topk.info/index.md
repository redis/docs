---
acl_categories:
- '@topk'
- '@read'
- '@fast'
arguments:
- name: key
  type: key
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
complexity: O(1)
description: Returns information about a sketch
group: topk
hidden: false
linkTitle: TOPK.INFO
module: Bloom
since: 2.0.0
stack_path: docs/data-types/probabilistic
summary: Returns information about a sketch
syntax_fmt: TOPK.INFO key
syntax_str: ''
title: TOPK.INFO
---
Returns number of required items (k), width, depth and decay values.

### Parameters

* **key**: Name of sketch.

## Return

[Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) with information of the filter.

## Examples

```
TOPK.INFO topk
1) k
2) (integer) 50
3) width
4) (integer) 2000
5) depth
6) (integer) 7
7) decay
8) "0.92500000000000004"
```
