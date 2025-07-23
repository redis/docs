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

## Return

FT.ALIASDEL returns a simple string reply `OK` if executed correctly, or an error reply otherwise.

## Examples

<details open>
<summary><b>Remove an alias from an index</b></summary>

Remove an alias from an index.

{{< highlight bash >}}
127.0.0.1:6379> FT.ALIASDEL alias
OK
{{< / highlight >}}
</details>

## Return information

{{< multitabs id="ft-aliasdel-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) reply.

-tab-sep-

[Simple string]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) reply.

{{< /multitabs >}}

## See also

[`FT.ALIASADD`]({{< relref "commands/ft.aliasadd/" >}}) | [`FT.ALIASUPDATE`]({{< relref "commands/ft.aliasupdate/" >}}) 

## Related topics

[RediSearch]({{< relref "/develop/ai/search-and-query/" >}})