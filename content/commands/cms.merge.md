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
railroad_diagram: /images/railroad/cms.merge.svg
since: 2.0.0
stack_path: docs/data-types/probabilistic
summary: Merges several sketches into one sketch
syntax_fmt: "CMS.MERGE destination numKeys source [source ...] [WEIGHTS weight\n \
  \ [weight ...]]"
title: CMS.MERGE
---
{{< note >}}
This command's behavior varies in clustered Redis environments. See the [multi-key operations]({{< relref "/develop/using-commands/multi-key-operations" >}}) page for more information.
{{< /note >}}


Merges several sketches into one sketch. All sketches must have identical width and depth. Weights can be used to multiply certain sketches. Default weight is 1. 

## Required arguments

<details open><summary><code>destination</code></summary>

The name of the destination sketch. Must be initialized.

</details>

<details open><summary><code>numKeys</code></summary>

Number of sketches to be merged.

</details>

<details open><summary><code>source [source ...]</code></summary>

Names of source sketches to be merged.

</details>

## Optional arguments

<details open><summary><code>WEIGHTS weight [weight ...]</code></summary>

Multiple of each sketch. Default is 1.

</details>

## Examples

```
redis> CMS.MERGE dest 2 test1 test2 WEIGHTS 1 3
OK
```

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
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