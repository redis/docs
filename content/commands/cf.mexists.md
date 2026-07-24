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
railroad_diagram: /images/railroad/cf.mexists.svg
since: 1.0.0
stack_path: docs/data-types/probabilistic
summary: Checks whether one or more items exist in a Cuckoo Filter
syntax_fmt: CF.MEXISTS key item [item ...]
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

{{% redis-cli %}}
redis> CF.INSERT cf ITEMS item1 item2
1) (integer) 1
2) (integer) 1
redis> CF.MEXISTS cf item1 item2 item3
1) (integer) 1
2) (integer) 1
3) (integer) 0
{{% /redis-cli %}}

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |

## Return information

{{< multitabs id="bf-mexists-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* An [array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [integers]({{< relref "/develop/reference/protocol-spec#integers" >}}), where each element corresponds to an item in the request. A value of `1` means the item was probably already added to the filter. A value of `0` means the item was definitely not added, `key` does not exist, or `key` contains a value of the wrong type.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) if invalid arguments are passed.

-tab-sep-

One of the following:
* An [array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [booleans]({{< relref "/develop/reference/protocol-spec#booleans" >}}), where each element corresponds to an item in the request. A value of `true` means the item was probably already added to the filter. A value of `false` means the item was definitely not added, `key` does not exist, or `key` contains a value of the wrong type.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) if invalid arguments are passed.

{{< /multitabs >}}
