---
acl_categories:
- '@search'
- '@fast'
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
complexity: O(1)
description: Adds or updates an alias to the index
group: search
hidden: false
linkTitle: FT.ALIASUPDATE
module: Search
since: 1.0.0
stack_path: docs/interact/search-and-query
summary: Adds or updates an alias to the index
syntax: 'FT.ALIASUPDATE alias index

  '
syntax_fmt: FT.ALIASUPDATE alias index
syntax_str: index
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

## Return

FT.ALIASUPDATE returns a simple string reply `OK` if executed correctly, or an error reply otherwise.

## Examples

<details open>
<summary><b>Update an index alias</b></summary>

Update the alias of an index.

{{< highlight bash >}}
127.0.0.1:6379> FT.ALIASUPDATE alias idx
OK
{{< / highlight >}}

## See also

[`FT.ALIASADD`]({{< baseurl >}}/commands/ft.aliasadd/) | [`FT.ALIASDEL`]({{< baseurl >}}/commands/ft.aliasdel/) 

## Related topics

[RediSearch]({{< relref "/develop/interact/search-and-query/" >}})