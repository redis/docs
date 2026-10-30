---
acl_categories:
- '@search'
arguments:
- name: alias
  type: string
- name: index
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
compatibility:
  software:
    general: supported
    flex: supported
  cloud:
    pro: supported
    essentials: supported
complexity: O(1)
description: Adds or updates an alias to the index
group: search
hidden: false
linkTitle: FT.ALIASUPDATE
module: Search
railroad_diagram: /images/railroad/ft.aliasupdate.svg
since: 1.0.0
stack_path: docs/interact/search-and-query
summary: Adds or updates an alias to the index
syntax_fmt: FT.ALIASUPDATE alias index
title: FT.ALIASUPDATE
---

Add an alias to an index. If the alias is already associated with another
index, FT.ALIASUPDATE removes the alias association with the previous index.

[Examples](#examples)

## Required arguments

<details open>
<summary><code>alias index</code></summary>

is alias to be added to an index.
</details>

## Examples

<details open>
<summary><b>Update an index alias</b></summary>

Update the alias of an index.

{{< highlight bash >}}
127.0.0.1:6379> FT.ALIASUPDATE alias idx
OK
{{< / highlight >}}

## Redis Software and Redis Cloud compatibility

{{< command-compatibility >}}

## Return information

{{< multitabs id="ft-aliasupdate-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Simple string reply](/content/develop/reference/protocol-spec.md#simple-strings): `OK` if executed correctly.
* [Simple error reply](/content/develop/reference/protocol-spec.md#simple-errors) in these cases: index does not exist.

-tab-sep-

One of the following:
* [Simple string reply](/content/develop/reference/protocol-spec.md#simple-strings): `OK` if executed correctly.
* [Simple error reply](/content/develop/reference/protocol-spec.md#simple-errors) in these cases: index does not exist.

{{< /multitabs >}}

## See also

[`FT.ALIASADD`](/content/commands/ft.aliasadd.md) | [`FT.ALIASDEL`](/content/commands/ft.aliasdel.md) 

## Related topics

[RediSearch](/content/develop/ai/search-and-query/_index.md)