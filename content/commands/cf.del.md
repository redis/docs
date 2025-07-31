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
complexity: O(k), where k is the number of sub-filters
description: Deletes an item from a Cuckoo Filter
group: cf
hidden: false
linkTitle: CF.DEL
module: Bloom
since: 1.0.0
stack_path: docs/data-types/probabilistic
summary: Deletes an item from a Cuckoo Filter
syntax_fmt: CF.DEL key item
syntax_str: item
title: CF.DEL
---
Deletes an item once from the filter.

If the item exists only once, it will be removed from the filter. If the item was added multiple times, it will still be present.

{{< note >}}
You should never use this command to delete from the filter an item that was not added to the filter. Deleting an item that is not in the filter may corrupt the filter. This could result in false negatives.
Practically, it means that using this command is safe only if you are absolutely sure (not just "probabilistically sure") that the item you are deleting was previously added to the filter.
{{< /note >}}

## Required arguments

<details open><summary><code>key</code></summary>

is key name for a cuckoo filter.
</details>

<details open><summary><code>item</code></summary>

is an item to delete.
</details>

## Complexity

O(n), where n is the number of `sub-filters`. Both alternative locations are
checked on all `sub-filters`.

## Examples

{{< highlight bash >}}
redis> CF.INSERT cf ITEMS item1 item2 item2
1) (integer) 1
2) (integer) 1
3) (integer) 1
redis> CF.DEL cf item1
(integer) 1
redis> CF.DEL cf item1
(integer) 0
redis> CF.DEL cf item2
(integer) 1
redis> CF.DEL cf item2
(integer) 1
redis> CF.DEL cf item2
(integer) 0
{{< / highlight >}}

## Return information

{{< multitabs id=“cf-del-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) `1` for successfully deleting an item, or `0` if no such item was found in the filter.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid arguments or wrong key type.

-tab-sep-

One of the following:
* [Boolean reply]({{< relref "/develop/reference/protocol-spec#booleans" >}}) `true` for successfully deleting an item, or `false` if no such item was found in the filter.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid arguments or wrong key type.

{{< /multitabs >}}
