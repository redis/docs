---
acl_categories:
- '@search'
- '@write'
arguments:
- name: key
  type: string
- name: string
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
description: Deletes a string from a suggestion index
group: suggestion
hidden: false
linkTitle: FT.SUGDEL
module: Search
since: 1.0.0
stack_path: docs/interact/search-and-query
summary: Deletes a string from a suggestion index
syntax: 'FT.SUGDEL key string

  '
syntax_fmt: FT.SUGDEL key string
syntax_str: string
title: FT.SUGDEL
---

Delete a string from a suggestion index

[Examples](#examples)

## Required arguments

<details open>
<summary><code>key</code></summary>

is suggestion dictionary key.
</details>

<details open>
<summary><code>string</code></summary> 

is suggestion string to index.
</details>

## Return

FT.SUGDEL returns an integer reply, 1 if the string was found and deleted, 0 otherwise.

## Examples

<details open>
<summary><b>Delete a string from a suggestion index</b></summary>

{{< highlight bash >}}
127.0.0.1:6379> FT.SUGDEL sug "hello"
(integer) 1
127.0.0.1:6379> FT.SUGDEL sug "hello"
(integer) 0
{{< / highlight >}}
</details>

## Return information

{{< multitabs id="ft-sugdel-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) reply.

-tab-sep-

[Simple string]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) reply.

{{< /multitabs >}}

## See also

[`FT.SUGGET`]({{< relref "commands/ft.sugget/" >}}) | [`FT.SUGADD`]({{< relref "commands/ft.sugadd/" >}}) | [`FT.SUGLEN`]({{< relref "commands/ft.suglen/" >}}) 

## Related topics

[RediSearch]({{< relref "/develop/ai/search-and-query/" >}})