---
acl_categories:
- '@search'
arguments:
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
description: Dumps the contents of a synonym group
group: search
hidden: false
linkTitle: FT.SYNDUMP
module: Search
since: 1.2.0
stack_path: docs/interact/search-and-query
summary: Dumps the contents of a synonym group
syntax: 'FT.SYNDUMP index

  '
syntax_fmt: FT.SYNDUMP index
syntax_str: ''
title: FT.SYNDUMP
---

Dump the contents of a synonym group

[Examples](#examples)

## Required arguments

<details open>
<summary><code>index</code></summary>

is index name.
</details>

Use FT.SYNDUMP to dump the synonyms data structure. This command returns a list of synonym terms and their synonym group ids.

## Return

FT.SYNDUMP returns an array reply, with a pair of `term` and an array of synonym groups.

## Examples

<details open>
<summary><b>Return the contents of a synonym group</b></summary>

{{< highlight bash >}}
127.0.0.1:6379> FT.SYNDUMP idx
1) "shalom"
2) 1) "synonym1"
   2) "synonym2"
3) "hi"
4) 1) "synonym1"
5) "hello"
6) 1) "synonym1"
{{< / highlight >}}
</details>

## See also

[`FT.SYNUPDATE`]({{< relref "commands/ft.synupdate/" >}}) 

## Related topics

[RediSearch]({{< relref "/develop/ai/search-and-query/" >}})