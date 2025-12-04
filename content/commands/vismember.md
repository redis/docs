---
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: element
  name: element
  type: string
arity: 3
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
command_flags:
- readonly
- module
complexity: O(1)
description: Check if an element exists in a vector set.
function: vismemberCommand
group: module
hidden: false
key_specs:
- RW: true
  access: true
  begin_search:
    spec:
      index: 1
    type: index
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
  update: true
linkTitle: VISMEMBER
module: vectorset
railroad_diagram: /images/railroad/vismember.svg
since: 8.2.0
summary: Check if an element exists in a vector set
syntax_fmt: VISMEMBER key element
syntax_str: element
title: VISMEMBER
---

Check if an element exists in a vector set.

## Required arguments

<details open>
<summary><code>key</code></summary>

is the name of the key that holds the vector set.
</details>

<details open>
<summary><code>element</code></summary>

is the name of the element you want to check for membership.
</details>

## Related topics

- [Vector sets]({{< relref "/develop/data-types/vector-sets" >}})

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="vismember-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): `0` if the element does not exist in the vector set, or the key does not exist. `1` if the element exists in the vector set.

-tab-sep-

[Boolean reply](../../develop/reference/protocol-spec#booleans): `false` if the element does not exist in the vector set, or the key does not exist. `true` if the element exists in the vector set.

{{< /multitabs >}}
