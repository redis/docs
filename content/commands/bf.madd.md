---
acl_categories:
- '@bloom'
- '@write'
- '@slow'
arguments:
- name: key
  type: key
- multiple: true
  name: item
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
complexity: O(k * n), where k is the number of hash functions and n is the number
  of items
description: Adds one or more items to a Bloom Filter. A filter will be created if
  it does not exist
group: bf
hidden: false
linkTitle: BF.MADD
module: Bloom
railroad_diagram: /images/railroad/bf.madd.svg
since: 1.0.0
stack_path: docs/data-types/probabilistic
summary: Adds one or more items to a Bloom Filter. A filter will be created if it
  does not exist
syntax_fmt: BF.MADD key item [item ...]
title: BF.MADD
---
Adds one or more items to a Bloom filter.

This command is similar to [`BF.ADD`]({{< relref "commands/bf.add/" >}}), except that you can add more than one item.

This command is similar to [`BF.INSERT`]({{< relref "commands/bf.insert/" >}}), except that the error rate, capacity, and expansion cannot be specified.

## Required arguments

<details open><summary><code>key</code></summary>

is key name for a Bloom filter to add the items to.

If `key` does not exist - a new Bloom filter is created with default error rate, capacity, and expansion (see [`BF.RESERVE`]({{< relref "commands/bf.reserve/" >}})).
</details>

<details open><summary><code>item...</code></summary>

One or more items to add.
</details>

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |

## Return information

Returns one of these replies:

- [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) where each element is either
  - [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) - where "1" means that the item has been added successfully, and "0" means that such item was already added to the filter (which could be wrong)
  - [] when the item cannot be added because the filter is full
- [] on error (invalid arguments, wrong key type, etc.)

## Examples

{{< highlight bash >}}
redis> BF.MADD bf item1 item2 item2
1) (integer) 1
2) (integer) 1
3) (integer) 0
{{< / highlight >}}

## Return information

{{< multitabs id="bf-madd-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) where each element is either
  * an [integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}), where `1` means that the item has been added successfully, and `0` means there's a probability that the item was already added to the filter.
  * a [simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) when the item cannot be added because the filter is full.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid arguments, key not found, wrong key type, or when the filter is full.

-tab-sep-

One of the following:
* [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) where each element is either
  * a [boolean reply]({{< relref "/develop/reference/protocol-spec#booleans" >}}), where `true` means that the item has been added successfully, and `false` means there's a probability that the item was already added to the filter.
  * a [simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) when the item cannot be added because the filter is full.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid arguments, key not found, wrong key type, or when the filter is full.

{{< /multitabs >}}