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
- oss
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

## Return value

Returns one of these replies:

- [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}), where `1` means that, with high probability, `item` was already added to the filter, and `0` means that `key` does not exist or that `item` had not been added to the filter.
- [] on error (invalid arguments, wrong key type, etc.)

## Examples

{{< highlight bash >}}
redis> BF.ADD bf item1
(integer) 1
redis> BF.EXISTS bf item1
(integer) 1
redis> BF.EXISTS bf item2
(integer) 0
{{< / highlight >}}
