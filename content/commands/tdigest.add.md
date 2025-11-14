---
acl_categories:
- '@tdigest'
- '@write'
- '@slow'
arguments:
- name: key
  type: key
- arguments:
  - name: value
    type: double
  multiple: true
  name: values
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
complexity: O(N), where N is the number of samples to add
description: Adds one or more observations to a t-digest sketch
group: tdigest
hidden: false
linkTitle: TDIGEST.ADD
module: Bloom
since: 2.4.0
stack_path: docs/data-types/probabilistic
summary: Adds one or more observations to a t-digest sketch
syntax_fmt: TDIGEST.ADD key value [value ...]
syntax_str: value [value ...]
title: TDIGEST.ADD
---
Adds one or more observations to a t-digest sketch.

## Required arguments

<details open><summary><code>key</code></summary> 

is the key name for an existing t-digest sketch.
</details>

<details open><summary><code>value</code></summary> 

is the floating-point value of an observation.
</details>

## Examples

{{< highlight bash >}}
redis> TDIGEST.ADD t 1 2 3
OK
{{< / highlight >}}

{{< highlight bash >}}
redis> TDIGEST.ADD t string
(error) ERR T-Digest: error parsing val parameter
{{< / highlight >}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported"><nobr>&#x2705; Flexible & Annual</nobr></span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

{{< multitabs id="tdigest-add-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:

* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) `OK` if executed correctly.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: the given key does not exist or the value parameter is of the incorrect type.

-tab-sep-

One of the following:

* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) `OK` if executed correctly.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: the given key does not exist or the value parameter is of the incorrect type.

{{< /multitabs >}}
