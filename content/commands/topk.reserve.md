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
description: Initializes a Top-K sketch with specified parameters
group: topk
hidden: false
linkTitle: TOPK.RESERVE
module: Bloom
since: 2.0.0
stack_path: docs/data-types/probabilistic
summary: Initializes a Top-K sketch with specified parameters
syntax_fmt: TOPK.RESERVE key topk [width depth decay]
syntax_str: topk [width depth decay]
title: TOPK.RESERVE
---
Initializes a Top-K sketch with specified parameters.

## Parameters

* **key**: the name of the Top-k sketch.
* **topk**: the number of top (k) occurring items to keep.

Optional parameters
* **width**: Number of counters kept in each array. (Default 8)
* **depth**: Number of arrays. (Default 7)
* **decay**: The probability of reducing a counter in an occupied bucket (decay ^ bucket[i].counter). As the counter gets higher, the likelihood of a reduction is lower. (Default 0.9)

## Example

```
redis> TOPK.RESERVE topk 50 2000 7 0.925
OK
```

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

{{< multitabs id="topk-reserve-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:

* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) `OK` if executed correctly.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: incorrect number of arguments, invalid decay value, or key already exists.

-tab-sep-

One of the following:

* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) `OK` if executed correctly.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: incorrect number of arguments, invalid decay value, or key already exists.

{{< /multitabs >}}