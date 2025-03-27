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

<note><b>Note:</b>

- Deleting an item that are not in the filter may delete a different item, resulting in false negatives.
</note>

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

## Return value

Returns one of these replies:

- [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) - where "1" means that the item has been deleted, and "0" means that such item was not found in the filter
- [] on error (invalid arguments, wrong key type, etc.)

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
