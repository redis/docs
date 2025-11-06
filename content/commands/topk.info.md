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
railroad_diagram: /images/railroad/topk.info.svg
since: 2.0.0
stack_path: docs/data-types/probabilistic
summary: Returns information about a sketch
syntax_fmt: TOPK.INFO key
syntax_str: ''
title: TOPK.INFO
---
Returns number of required items (k), width, depth, and decay values of a given sketch.

## Parameters

* **key**: the name of the sketch.

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

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

{{< multitabs id="topk-info-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:

* [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [simple string]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) and [integer]({{< relref "/develop/reference/protocol-spec#integers" >}}) pairs. For decay, a [simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) is used to represent the floating point value.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: incorrect number of arguments, non-existant key, or key of the incorrect type.

-tab-sep-

One of the following:

* [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [simple string]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) and [integer]({{< relref "/develop/reference/protocol-spec#integers" >}}) pairs. For decay, a [double reply]({{< relref "/develop/reference/protocol-spec#doubles" >}}) is used to represent the floating point value.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: incorrect number of arguments, non-existant key, or key of the incorrect type.

{{< /multitabs >}}