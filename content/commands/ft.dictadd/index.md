---
arguments:
- name: dict
  type: string
- multiple: true
  name: term
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
description: Adds terms to a dictionary
group: search
hidden: false
linkTitle: FT.DICTADD
module: Search
since: 1.4.0
stack_path: docs/interact/search-and-query
summary: Adds terms to a dictionary
syntax: 'FT.DICTADD dict term [term ...]

  '
syntax_fmt: FT.DICTADD dict term [term ...]
syntax_str: term [term ...]
title: FT.DICTADD
---

Add terms to a dictionary

[Examples](#examples)

## Required arguments

<details open>
<summary><code>dict</code></summary>

is dictionary name.
</details>

<details open>
<summary><code>term</code></summary>

term to add to the dictionary.
</details>

## Return

FT.DICTADD returns an integer reply, the number of new terms that were added.

## Examples

<details open>
<summary><b>Add terms to a dictionary</b></summary>

{{< highlight bash >}}
127.0.0.1:6379> FT.DICTADD dict foo bar "hello world"
(integer) 3
{{< / highlight >}}
</details>

## See also

[`FT.DICTDEL`]({{< relref "commands/ft.dictdel/" >}}) | [`FT.DICTDUMP`]({{< relref "commands/ft.dictdump/" >}})

## Related topics

[RediSearch]({{< relref "/develop/interact/search-and-query/" >}})