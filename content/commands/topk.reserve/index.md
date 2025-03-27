---
acl_categories:
- '@topk'
- '@write'
- '@fast'
arguments:
- name: key
  type: key
- name: topk
  type: integer
- arguments:
  - name: width
    type: integer
  - name: depth
    type: integer
  - name: decay
    type: double
  name: params
  optional: true
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
complexity: O(1)
description: Initializes a TopK with specified parameters
group: topk
hidden: false
linkTitle: TOPK.RESERVE
module: Bloom
since: 2.0.0
stack_path: docs/data-types/probabilistic
summary: Initializes a TopK with specified parameters
syntax_fmt: TOPK.RESERVE key topk [width depth decay]
syntax_str: topk [width depth decay]
title: TOPK.RESERVE
---
Initializes a TopK with specified parameters.

### Parameters

* **key**: Key under which the sketch is to be found.
* **topk**: Number of top occurring items to keep.

Optional parameters
* **width**: Number of counters kept in each array. (Default 8)
* **depth**: Number of arrays. (Default 7)
* **decay**: The probability of reducing a counter in an occupied bucket. It is raised to power of it's counter (decay ^ bucket[i].counter). Therefore, as the counter gets higher, the chance of a reduction is being reduced. (Default 0.9)

## Return

[Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) - `OK` if executed correctly, or [] otherwise.

## Examples

```
redis> TOPK.RESERVE topk 50 2000 7 0.925
OK
```
