---
acl_categories:
- '@cuckoo'
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
complexity: O(k), where k is the number of sub-filters
description: Checks whether one or more items exist in a Cuckoo Filter
group: cf
hidden: false
linkTitle: CF.EXISTS
module: Bloom
since: 1.0.0
stack_path: docs/data-types/probabilistic
summary: Checks whether one or more items exist in a Cuckoo Filter
syntax_fmt: CF.EXISTS key item
syntax_str: item
title: CF.EXISTS
---
Determines whether a given item was added to a cuckoo filter.

This command is similar to [`CF.MEXISTS`]({{< relref "commands/cf.mexists/" >}}), except that only one item can be checked.

## Required arguments

<details open><summary><code>key</code></summary>

is key name for a cuckoo filter.

</details>

<details open><summary><code>item</code></summary>

is an item to check.
</details>

## Return value

Returns one of these replies:

- [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}), where `1` means that, with high probability, `item` had already been added to the filter, and `0` means that `key` does not exist or that `item` had not been added to the filter. See note in [`CF.DEL`]({{< relref "commands/cf.del/" >}}).
- [] on error (invalid arguments, wrong key type, and so on)

## Examples

{{< highlight bash >}}
redis> CF.ADD cf item1
(integer) 1
redis> CF.EXISTS cf item1
(integer) 1
redis> CF.EXISTS cf item2
(integer) 0
{{< / highlight >}}
