---
acl_categories:
- '@cms'
- '@write'
- '@fast'
arguments:
- name: key
  type: key
- name: width
  type: integer
- name: depth
  type: integer
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- kubernetes
- clients
complexity: O(1)
description: Initializes a Count-Min Sketch to dimensions specified by user
group: cms
hidden: false
linkTitle: CMS.INITBYDIM
module: Bloom
since: 2.0.0
stack_path: docs/data-types/probabilistic
summary: Initializes a Count-Min Sketch to dimensions specified by user
syntax_fmt: CMS.INITBYDIM key width depth
syntax_str: width depth
title: CMS.INITBYDIM
---
Initializes a Count-Min Sketch to dimensions specified by user.

### Parameters:

* **key**: The name of the sketch.
* **width**: Number of counters in each array. Reduces the error size.
* **depth**: Number of counter-arrays. Reduces the probability for an
    error of a certain size (percentage of total count).

## Examples

```
redis> CMS.INITBYDIM test 2000 5
OK
```

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

{{< multitabs id="cms-initbydim-return-info" 
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