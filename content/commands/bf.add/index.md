---
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

## Return value

Returns one of these replies:

- [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) - where "1" means that the item has been added successfully, and "0" means that such item was already added to the filter (which could be wrong)
- [] on error (invalid arguments, wrong key type, etc.) and also when the filter is full

## Examples

{{< highlight bash >}}
redis> BF.ADD bf item1
(integer) 1
redis> BF.ADD bf item1
(integer) 0
{{< / highlight >}}
