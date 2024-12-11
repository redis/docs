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
description: Adds an item to a Cuckoo Filter
group: cf
hidden: false
linkTitle: CF.ADD
module: Bloom
since: 1.0.0
stack_path: docs/data-types/probabilistic
summary: Adds an item to a Cuckoo Filter
syntax_fmt: CF.ADD key item
syntax_str: item
title: CF.ADD
---
Adds an item to the cuckoo filter.

Cuckoo filters can contain the same item multiple times, and consider each addition as separate.
Use [`CF.ADDNX`]({{< baseurl >}}/commands/cf.addnx/) to add an item only if it does not exist.

## Required arguments

<details open><summary><code>key</code></summary>

is key name for a cuckoo filter to add the item to.

If `key` does not exist - a new cuckoo filter is created.
</details>

<details open><summary><code>item</code></summary>

is an item to add.
</details>

## Return value

Returns one of these replies:

- [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) - where "1" means that the item has been added successfully
- [] on error (invalid arguments, wrong key type, etc.) and also when the filter is full

## Complexity

O(n + i), where n is the number of `sub-filters` and i is `maxIterations`.
Adding items requires up to 2 memory accesses per `sub-filter`.
But as the filter fills up, both locations for an item might be full.
The filter attempts to `Cuckoo` swap items up to `maxIterations` times.

## Examples

{{< highlight bash >}}
redis> CF.ADD cf item1
(integer) 1
redis> CF.ADD cf item1
(integer) 1
{{< / highlight >}}
