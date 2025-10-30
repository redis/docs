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

## Return information

{{< multitabs id="bf-mexists-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [integer replies]({{< relref "/develop/reference/protocol-spec#integers" >}}), where `1` means that, with high probability, `item` was already added to the filter, and `0` means that `key` does not exist or that `item` was definitely not added to the filter. See note in [`CF.DEL`]({{< relref "commands/cf.del/" >}}).
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: in these cases: invalid arguments, wrong key type, or when the key was not found.

-tab-sep-

One of the following:
* [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [boolean replies]({{< relref "/develop/reference/protocol-spec#booleans" >}}), where `true` means that, with high probability, `item` was already added to the filter, and `false` means that `key` does not exist or that `item` was definitely not added to the filter.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: in these cases: invalid arguments, wrong key type, or when the key was not found.

{{< /multitabs >}}
