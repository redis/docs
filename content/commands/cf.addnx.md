---
acl_categories:
- '@cuckoo'
- '@write'
- '@slow'
arguments:
- name: key
  type: key
- name: item
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
complexity: O(k + i), where k is the number of sub-filters and i is maxIterations
description: Adds an item to a Cuckoo Filter if the item did not exist previously.
group: cf
hidden: false
linkTitle: CF.ADDNX
module: Bloom
railroad_diagram: /images/railroad/cf.addnx.svg
since: 1.0.0
stack_path: docs/data-types/probabilistic
summary: Adds an item to a Cuckoo Filter if the item did not exist previously.
syntax_fmt: CF.ADDNX key item
syntax_str: item
title: CF.ADDNX
---
Adds an item to a cuckoo filter if the item does not exist.

This command is similar to the combination of [`CF.EXISTS`]({{< relref "commands/cf.exists/" >}}) and [`CF.ADD`]({{< relref "commands/cf.add/" >}}). It does not add an item into the filter if its fingerprint already exists.

<note><b>Notes:</b>

- This command is slower than [`CF.ADD`]({{< relref "commands/cf.add/" >}}) because it first checks whether the item exists.
- Since [`CF.EXISTS`]({{< relref "commands/cf.exists/" >}}) can result in false positive, `CF.ADDNX` may not add an item because it is supposedly already exist, which may be wrong.

</note>

## Required arguments

<details open><summary><code>key</code></summary>

is key name for a cuckoo filter to add items to.

If `key` does not exist - a new cuckoo filter is created.
</details>

<details open><summary><code>item</code></summary>

is an item to add.
</details>

## Examples

{{< highlight bash >}}
redis> CF.ADDNX cf item
(integer) 1
redis> CF.ADDNX cf item
(integer) 0
{{< / highlight >}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

{{< multitabs id="cf-addnx-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): `1` for successfully adding an item to the filter or `0` if the item's fingerprint already exists in the filter.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid arguments, wrong key type, or when the filter is full.

-tab-sep-

One of the following:
* [Boolean reply]({{< relref "/develop/reference/protocol-spec#booleans" >}}): `true` for successfully adding an item to the filter or `false` if the item's fingerprint already exists in the filter.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid arguments, wrong key type, or when the filter is full.

{{< /multitabs >}}
