---
arguments:
- name: key
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
description: Gets the size of an auto-complete suggestion dictionary
group: suggestion
hidden: false
linkTitle: FT.SUGLEN
module: Search
since: 1.0.0
stack_path: docs/interact/search-and-query
summary: Gets the size of an auto-complete suggestion dictionary
syntax: 'FT.SUGLEN key

  '
syntax_fmt: FT.SUGLEN key
syntax_str: ''
title: FT.SUGLEN
---

Get the size of an auto-complete suggestion dictionary

[Examples](#examples)

## Required arguments

<details open>
<summary><code>key</code></summary>

is suggestion dictionary key.
</details>

## Return

FT.SUGLEN returns an integer reply, which is the current size of the suggestion dictionary.

## Examples

<details open>
<summary><b>Get the size of an auto-complete suggestion dictionary</b></summary>

{{< highlight bash >}}
127.0.0.1:6379> FT.SUGLEN sug
(integer) 2
{{< / highlight >}}
</details>

## See also

[`FT.SUGADD`]({{< relref "commands/ft.sugadd/" >}}) | [`FT.SUGDEL`]({{< relref "commands/ft.sugdel/" >}}) | [`FT.SUGGET`]({{< relref "commands/ft.sugget/" >}}) 

## Related topics

[RediSearch]({{< relref "/develop/interact/search-and-query/" >}})