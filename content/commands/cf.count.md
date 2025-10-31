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
description: Return the number of times an item might be in a Cuckoo Filter
group: cf
hidden: false
linkTitle: CF.COUNT
module: Bloom
since: 1.0.0
stack_path: docs/data-types/probabilistic
summary: Return the number of times an item might be in a Cuckoo Filter
syntax_fmt: CF.COUNT key item
syntax_str: item
title: CF.COUNT
---
Returns an estimation of the number of times a given item was added to a cuckoo filter.

If you just want to check that a given item was added to a cuckoo filter, use [`CF.EXISTS`]({{< relref "commands/cf.exists/" >}}).

## Required arguments

<details open><summary><code>key</code></summary>

is key name for a cuckoo filter.

</details>

<details open><summary><code>item</code></summary>

is an item to check.
</details>

## Examples

{{< highlight bash >}}
redis> CF.INSERT cf ITEMS item1 item2 item2
1) (integer) 1
2) (integer) 1
3) (integer) 1
redis> CF.COUNT cf item1
(integer) 1
redis> CF.COUNT cf item2
(integer) 2
{{< / highlight >}}

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

{{< multitabs id="cf-count-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}), where a positive value is an estimation of the number of times `item` was added to the filter. An overestimation is possible, but not an underestimation. `0` means that `key` does not exist or that `item` had not been added to the filter. See the note in [`CF.DEL`]({{< relref "commands/cf.del/" >}}).
* [Simple error]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid arguments or wrong key type.

-tab-sep-

One of the following:
* [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}), where a positive value is an estimation of the number of times `item` was added to the filter. An overestimation is possible, but not an underestimation. `0` means that `key` does not exist or that `item` had not been added to the filter. See the note in [`CF.DEL`]({{< relref "commands/cf.del/" >}}).
* [Simple error]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid arguments or wrong key type.

{{< /multitabs >}}
