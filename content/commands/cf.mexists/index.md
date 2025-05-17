---
acl_categories:
- '@cuckoo'
- '@read'
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
complexity: O(k * n), where k is the number of sub-filters and n is the number of
  items
description: Checks whether one or more items exist in a Cuckoo Filter
group: cf
hidden: false
linkTitle: CF.MEXISTS
module: Bloom
since: 1.0.0
stack_path: docs/data-types/probabilistic
summary: Checks whether one or more items exist in a Cuckoo Filter
syntax_fmt: CF.MEXISTS key item [item ...]
syntax_str: item [item ...]
title: CF.MEXISTS
---
Determines whether one or more items were added to a cuckoo filter.

This command is similar to [`CF.EXISTS`]({{< relref "commands/cf.exists/" >}}), except that more than one item can be checked.

## Required arguments

<details open><summary><code>key</code></summary>

is key name for a cuckoo filter.

</details>

<details open><summary><code>item...</code></summary>

One or more items to check.
</details>

## Return value

Returns one of these replies:

- [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) - where "1" means that, with high probability, `item` was already added to the filter, and "0" means that `key` does not exist or that `item` had not added to the filter. See note in [`CF.DEL`]({{< relref "commands/cf.del/" >}}).
- [] on error (invalid arguments, wrong key type, etc.)

## Examples

{{< highlight bash >}}
redis> CF.INSERT cf ITEMS item1 item2
1) (integer) 1
2) (integer) 1
redis> CF.MEXISTS cf item1 item2 item3
1) (integer) 1
2) (integer) 1
3) (integer) 0
{{< / highlight >}}
