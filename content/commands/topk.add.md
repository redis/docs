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
description: Adds an item to a Top-k sketch. Multiple items can be added at the same time.
group: topk
hidden: false
linkTitle: TOPK.ADD
module: Bloom
since: 2.0.0
stack_path: docs/data-types/probabilistic
summary: Adds an item to a Top-k sketch. Multiple items can be added at the same time.
syntax_fmt: TOPK.ADD key items [items ...]
syntax_str: items [items ...]
title: TOPK.ADD
---

Adds an item to a Top-k sketch. 
Multiple items can be added at the same time.
If an item enters the Top-K sketch, the item that is expelled (if any) is returned.
This allows dynamic heavy-hitter detection of items being entered or expelled from Top-K sketch. 

## Parameters

* **key**: the name of the sketch where items are added.
* **item**: the items to be added.

## Example

```
redis> TOPK.ADD topk foo bar 42
1) (nil)
2) baz
3) (nil)
```

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported"><nobr>&#x2705; Flexible & Annual</nobr></span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

{{< multitabs id="topk-add-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:

* [Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [bulk string replies]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) containing either dropped elements or [nil (null bulk string)]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}).
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: incorrect number of arguments or non-existant key.

-tab-sep-

One of the following:

* [Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [bulk string replies]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) containing either dropped elements or [null]({{< relref "/develop/reference/protocol-spec#nulls" >}}).
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: incorrect number of arguments, non-existant key, or key of the incorrect type.

{{< /multitabs >}}