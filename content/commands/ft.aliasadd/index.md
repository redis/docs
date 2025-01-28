---
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
description: Adds an alias to the index
group: search
hidden: false
linkTitle: FT.ALIASADD
module: Search
since: 1.0.0
stack_path: docs/interact/search-and-query
summary: Adds an alias to the index
syntax: 'FT.ALIASADD alias index

  '
syntax_fmt: FT.ALIASADD alias index
syntax_str: index
title: FT.ALIASADD
---

Add an alias to an index

[Examples](#examples)

## Required arguments

<details open>
<summary><code>alias index</code></summary>

is alias to be added to an index.
</details>

Indexes can have more than one alias, but an alias cannot refer to another
alias.

FT.ALIASADD allows administrators to transparently redirect application queries to alternative indexes.

## Return

FT.ALIASADD returns a simple string reply `OK` if executed correctly, or an error reply otherwise.

## Examples

<details open>
<summary><b>Add an alias to an index</b></summary>

Add an alias to an index.

{{< highlight bash >}}
127.0.0.1:6379> FT.ALIASADD alias idx
OK
{{< / highlight >}}

Attempting to add the same alias returns a message that the alias already exists.

{{< highlight bash >}}
127.0.0.1:6379> FT.ALIASADD alias idx
(error) Alias already exists
{{< / highlight >}}
</details>

## See also

[`FT.ALIASDEL`]({{< baseurl >}}/commands/ft.aliasdel/) | [`FT.ALIASUPDATE`]({{< baseurl >}}/commands/ft.aliasupdate/) 

## Related topics

[RediSearch]({{< relref "/develop/interact/search-and-query/" >}})