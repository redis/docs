---
acl_categories:
- '@bloom'
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
- kubernetes
- clients
complexity: O(k), where k is the number of hash functions used by the last sub-filter
description: Adds an item to a Bloom Filter
group: bf
hidden: false
linkTitle: BF.ADD
module: Bloom
since: 1.0.0
stack_path: docs/data-types/probabilistic
summary: Adds an item to a Bloom Filter
syntax_fmt: BF.ADD key item
syntax_str: item
title: BF.ADD
---
Adds an item to a Bloom filter.

This command is similar to [`BF.MADD`]({{< relref "commands/bf.madd/" >}}), except that only one item can be added.

## Required arguments

<details open><summary><code>key</code></summary>

is key name for a Bloom filter to add the item to.

If `key` does not exist - a new Bloom filter is created with default error rate, capacity, and expansion (see [`BF.RESERVE`]({{< relref "commands/bf.reserve/" >}})).
</details>

<details open><summary><code>item</code></summary>

is an item to add.
</details>

## Examples

{{< highlight bash >}}
redis> BF.ADD bf item1
(integer) 1
redis> BF.ADD bf item1
(integer) 0
{{< / highlight >}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported"><nobr>&#x2705; Flexible & Annual</nobr></span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

{{< multitabs id="bf-add-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): `1` for successfully adding an item, or `0` if there's a probability that the item was already added to the filter.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid arguments, wrong key type, or when the filter is full.

-tab-sep-

One of the following:
* [Boolean reply]({{< relref "/develop/reference/protocol-spec#booleans" >}}): `true` for successfully adding an item, or `false` if there's a probability that the item was already added to the filter.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid arguments, wrong key type, or when the filter is full.

{{< /multitabs >}}