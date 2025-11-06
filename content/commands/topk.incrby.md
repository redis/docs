---
acl_categories:
- '@topk'
- '@write'
- '@slow'
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
complexity: O(n * k * incr) where n is the number of items, k is the depth and incr
  is the increment
description: Increases the count of one or more items by increment
group: topk
hidden: false
linkTitle: TOPK.INCRBY
module: Bloom
since: 2.0.0
stack_path: docs/data-types/probabilistic
summary: Increases the count of one or more items by increment
syntax_fmt: TOPK.INCRBY key item increment [item increment ...]
syntax_str: item increment [item increment ...]
title: TOPK.INCRBY
---
Increase the score of an item in the data structure by `increment`. 
Multiple items' scores can be increased at once.
If an item enters the Top-K list, the item that is expelled (if any) is returned.

### Parameters

* **key**: the name of the sketch.
* **item**: the items to be incremented.
* **increment**: the value by which items will be incremented. The `increment` must be greater or equal to 1 and less than or equal to 100,000 to avoid server freeze.

## Return

[Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) - if an element was dropped from the TopK list, [Nil reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) otherwise..

## Example

```
redis> TOPK.INCRBY topk foo 3 bar 2 42 30
1) (nil)
2) (nil)
3) foo
```

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

{{< multitabs id="topk-incrby-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:

* [Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [bulk string replies]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) containing either dropped elements or [nil (null bulk string)]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}).
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: incorrect number of arguments, non-existant key, key of the incorrect type, or an incorrect increment (less than 0 or greater than 100,000).

-tab-sep-

One of the following:

* [Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [bulk string replies]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) containing either dropped elements or [null]({{< relref "/develop/reference/protocol-spec#nulls" >}}).
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: incorrect number of arguments, non-existant key, key of the incorrect type, or an incorrect increment (less than 0 or greater than 100,000).

{{< /multitabs >}}