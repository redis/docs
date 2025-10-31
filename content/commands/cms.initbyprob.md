---
acl_categories:
- '@cms'
- '@write'
- '@fast'
arguments:
- name: key
  type: key
- name: error
  type: double
- name: probability
  type: double
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
description: Initializes a Count-Min Sketch to accommodate requested tolerances.
group: cms
hidden: false
linkTitle: CMS.INITBYPROB
module: Bloom
since: 2.0.0
stack_path: docs/data-types/probabilistic
summary: Initializes a Count-Min Sketch to accommodate requested tolerances.
syntax_fmt: CMS.INITBYPROB key error probability
syntax_str: error probability
title: CMS.INITBYPROB
---
Initializes a Count-Min Sketch to accommodate requested tolerances.

### Parameters:

* **key**: The name of the sketch.
* **error**: Estimate size of error. The error is a percent of total counted
    items. This effects the width of the sketch.
* **probability**: The desired probability for inflated count. This should
    be a decimal value between 0 and 1. This effects the depth of the sketch.
    For example, for a desired false positive rate of 0.1% (1 in 1000),
    error_rate should be set to 0.001. The closer this number is to zero, the
    greater the memory consumption per item and the more CPU usage per operation.

## Examples

```
redis> CMS.INITBYPROB test 0.001 0.01
OK
```

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

{{< multitabs id="cms-initbyprob-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:

* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) `OK` if executed correctly.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) if the given key already exists.

-tab-sep-

One of the following:

* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) `OK` if executed correctly.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) if the given key already exists.

{{< /multitabs >}}