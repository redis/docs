---
acl_categories:
- '@cms'
- '@write'
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
complexity: O(n) where n is the number of items
description: Increases the count of one or more items by increment
group: cms
hidden: false
linkTitle: CMS.INCRBY
module: Bloom
since: 2.0.0
stack_path: docs/data-types/probabilistic
summary: Increases the count of one or more items by increment
syntax_fmt: CMS.INCRBY key item increment [item increment ...]
syntax_str: item increment [item increment ...]
title: CMS.INCRBY
---

Increases the count of item by increment. Multiple items can be increased with one call. 

### Parameters:

* **key**: The name of the sketch.
* **item**: The item which counter is to be increased.
* **increment**: Amount by which the item counter is to be increased.

## Return


[Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) with an updated min-count of each of the items in the sketch.

Count of each item after increment.

## Examples

```
redis> CMS.INCRBY test foo 10 bar 42
1) (integer) 10
2) (integer) 42
```
