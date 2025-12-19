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
complexity: O(1)
description: Adds an alias to the index
group: search
hidden: false
linkTitle: FT.ALIASADD
module: Search
railroad_diagram: /images/railroad/ft.aliasadd.svg
since: 1.0.0
stack_path: docs/interact/search-and-query
summary: Adds an alias to the index
syntax_fmt: FT.ALIASADD alias index
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

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis Cloud<br />Flexible & Annual | Redis Cloud<br />Free & Fixed | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> |  |

## Return information

{{< multitabs id="ft-aliasadd-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}): `OK` if executed correctly.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: alias already exists, index does not exist.

-tab-sep-

One of the following:
* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}): `OK` if executed correctly.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: alias already exists, index does not exist.

{{< /multitabs >}}

## See also

[`FT.ALIASDEL`]({{< relref "commands/ft.aliasdel/" >}}) | [`FT.ALIASUPDATE`]({{< relref "commands/ft.aliasupdate/" >}})
