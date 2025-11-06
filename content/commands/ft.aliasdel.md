---
acl_categories:
- '@search'
arguments:
- name: alias
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
description: Deletes an alias from the index
group: search
hidden: false
linkTitle: FT.ALIASDEL
module: Search
railroad_diagram: /images/railroad/ft.aliasdel.svg
since: 1.0.0
stack_path: docs/interact/search-and-query
summary: Deletes an alias from the index
syntax: 'FT.ALIASDEL alias

  '
syntax_fmt: FT.ALIASDEL alias
syntax_str: ''
title: FT.ALIASDEL
---

Remove an alias from an index

[Examples](#examples)

## Required arguments

<details open>
<summary><code>alias</code></summary>

is index alias to be removed.
</details>

## Examples

<details open>
<summary><b>Remove an alias from an index</b></summary>

Remove an alias from an index.

{{< highlight bash >}}
127.0.0.1:6379> FT.ALIASDEL alias
OK
{{< / highlight >}}
</details>

## Redis Software and Redis Cloud compatibility

| Redis Enterprise<br />Software | Redis Cloud<br />Flexible & Annual | Redis Cloud<br />Free & Fixed | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> |  |

## Return information

{{< multitabs id="ft-aliasdel-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}): `OK` if executed correctly.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: alias does not exist.

-tab-sep-

One of the following:
* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}): `OK` if executed correctly.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: alias does not exist.

{{< /multitabs >}}

## See also

[`FT.ALIASADD`]({{< relref "commands/ft.aliasadd/" >}}) | [`FT.ALIASUPDATE`]({{< relref "commands/ft.aliasupdate/" >}})
