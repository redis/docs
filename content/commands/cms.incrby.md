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

## Examples

```
redis> CMS.INCRBY test foo 10 bar 42
1) (integer) 10
2) (integer) 42
```

## Return information

{{< multitabs id=“cms-incrby-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:

* [Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [integer replies]({{< relref "/develop/reference/protocol-spec#integers" >}}) representing updated min-counts of each of the provided items in the sketch.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid arguments, missing key, overflow, or wrong key type.

-tab-sep-

One of the following:

* [Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [integer replies]({{< relref "/develop/reference/protocol-spec#integers" >}}) representing updated min-counts of each of the provided items in the sketch.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid arguments, missing key, overflow, or wrong key type.

{{< /multitabs >}}