---
acl_categories:
- '@cms'
- '@write'
arguments:
- name: destination
  type: key
- name: numKeys
  type: integer
- multiple: true
  name: source
  type: key
- arguments:
  - name: weights
    token: WEIGHTS
    type: pure-token
  - multiple: true
    name: weight
    type: double
  name: weight
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
complexity: O(n) where n is the number of sketches
description: Merges several sketches into one sketch
group: cms
hidden: false
linkTitle: CMS.MERGE
module: Bloom
since: 2.0.0
stack_path: docs/data-types/probabilistic
summary: Merges several sketches into one sketch
syntax_fmt: "CMS.MERGE destination numKeys source [source ...] [WEIGHTS weight\n \
  \ [weight ...]]"
syntax_str: numKeys source [source ...] [WEIGHTS weight [weight ...]]
title: CMS.MERGE
---
Merges several sketches into one sketch. All sketches must have identical width and depth. Weights can be used to multiply certain sketches. Default weight is 1. 

### Parameters:

* **dest**: The name of destination sketch. Must be initialized. 
* **numKeys**: Number of sketches to be merged.
* **src**: Names of source sketches to be merged.
* **weight**: Multiple of each sketch. Default =1.

## Examples

```
redis> CMS.MERGE dest 2 test1 test2 WEIGHTS 1 3
OK
```

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

{{< multitabs id="cms-merge-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:

* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) `OK` if executed correctly.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: non-existent key or destination key is not of the same width and/or depth.

-tab-sep-

One of the following:

* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) `OK` if executed correctly.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: non-existent key or destination key is not of the same width and/or depth.

{{< /multitabs >}}