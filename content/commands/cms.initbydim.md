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
- name: cell_size
  optional: true
  token: CELL_SIZE
  type: integer
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
description: Initializes a Count-Min Sketch to dimensions specified by user
group: cms
hidden: false
linkTitle: CMS.INITBYDIM
module: Bloom
railroad_diagram: /images/railroad/cms.initbydim.svg
since: 2.0.0
stack_path: docs/data-types/probabilistic
summary: Initializes a Count-Min Sketch to dimensions specified by user
syntax_fmt: "CMS.INITBYDIM key width depth [CELL_SIZE\_cell_size]"
title: CMS.INITBYDIM
---
Initializes a Count-Min Sketch to dimensions specified by user.

## Required arguments

<details open><summary><code>key</code></summary>

The name of the sketch.

</details>

<details open><summary><code>width</code></summary>

Number of counters in each array. Reduces the error size.

</details>

<details open><summary><code>depth</code></summary>

Number of counter-arrays. Reduces the probability for an error of a certain size (percentage of total count).

</details>

## Optional arguments

<details open><summary><code>CELL_SIZE cell_size</code></summary>

The size, in bytes, of each counter in the sketch. Valid values are `1`, `2`, `4`, or `8`. A smaller cell size reduces memory usage but lowers the maximum count a cell can hold before overflowing. A larger cell size supports higher counts at the cost of more memory. Default is `4`.

</details>

## Examples

```
redis> CMS.INITBYDIM test 2000 5
OK
redis> CMS.INITBYDIM test2 2000 5 CELL_SIZE 1
OK
```

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
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