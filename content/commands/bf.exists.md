---
acl_categories:
- '@bloom'
- '@read'
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
description: Checks whether an item exists in a Bloom Filter
group: bf
hidden: false
linkTitle: BF.EXISTS
module: Bloom
since: 1.0.0
stack_path: docs/data-types/probabilistic
summary: Checks whether an item exists in a Bloom Filter
syntax_fmt: BF.EXISTS key item
syntax_str: item
title: BF.EXISTS
---
Determines whether a given item was added to a Bloom filter.

This command is similar to [`BF.MEXISTS`]({{< relref "commands/bf.mexists/" >}}), except that only one item can be checked.

## Required arguments

<details open><summary><code>key</code></summary>

is key name for a Bloom filter.

</details>

<details open><summary><code>item</code></summary>

is an item to check.
</details>

## Examples

{{< highlight bash >}}
redis> BF.ADD bf item1
(integer) 1
redis> BF.EXISTS bf item1
(integer) 1
redis> BF.EXISTS bf item2
(integer) 0
{{< / highlight >}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

{{< multitabs id="bf-exists-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): `1` means that, with high probability, `item` was already added to the filter, and `0` means that either the `key` does not exist or that the `item` had not been added to the filter.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) if invalid arguments are passed.

-tab-sep-

One of the following:
* [Boolean reply]({{< relref "/develop/reference/protocol-spec#booleans" >}}): `true` means that, with high probability, `item` was already added to the filter, and `false` means that either `key` does not exist or that `item` had not been added to the filter.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) if invalid arguments are passed or `key` is not of the correct type.

{{< /multitabs >}}