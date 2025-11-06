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
description: Return the count for one or more items in a sketch
group: topk
hidden: false
linkTitle: TOPK.COUNT
module: Bloom
since: 2.0.0
stack_path: docs/data-types/probabilistic
summary: Return the count for one or more items in a sketch
syntax_fmt: TOPK.COUNT key item [item ...]
syntax_str: item [item ...]
title: TOPK.COUNT
---
Returns counts for each item present in the sketch. 
Multiple items can be requested at once.
Please note this number will never be higher than the real count and will likely be lower.

This command has been deprecated. The count value is not a representative of
the number of appearances of an item.

## Parameters

* **key**: the name of the sketch where items are to be counted.
* **item**: the items to be counted.

## Examples

```
redis> TOPK.COUNT topk foo 42 nonexist
1) (integer) 3
2) (integer) 1
3) (integer) 0
```

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

{{< multitabs id="topk-count-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:

* [Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [integer replies]({{< relref "/develop/reference/protocol-spec#integers" >}}) representing the count of each specified item. For non-existant items, `0` is returned.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: incorrect number of arguments, non-existant key, or key of the incorrect type.

-tab-sep-

One of the following:

* [Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [integer replies]({{< relref "/develop/reference/protocol-spec#integers" >}}) representing the count of each specified item. For non-existant items, `0` is returned.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: incorrect number of arguments, non-existant key, or key of the incorrect type.

{{< /multitabs >}}