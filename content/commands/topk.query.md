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
Checks whether one or more items are one of the Top-K items.

## Parameters

* **key**: the name of the sketch.
* **item**: the items to be queried.

## Example

```
redis> TOPK.QUERY topk 42 nonexist
1) (integer) 1
2) (integer) 0
```

## Return information

{{< multitabs id=“topk-query-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:

* [Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [integer replies]({{< relref "/develop/reference/protocol-spec#integers" >}}): `1` if an item is in the Top-K or `0` otherwise.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: non-existant key or key of the incorrect type.

-tab-sep-

* [Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [boolean replies]({{< relref "/develop/reference/protocol-spec#booleans" >}}): `true` if an item is in the Top-K or `false` otherwise.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: non-existant key or key of the incorrect type.

{{< /multitabs >}}