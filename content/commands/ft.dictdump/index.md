---
arguments:
- name: dict
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
command_flags:
- readonly
complexity: O(N), where N is the size of the dictionary
description: Dumps all terms in the given dictionary
group: search
hidden: false
linkTitle: FT.DICTDUMP
module: Search
since: 1.4.0
stack_path: docs/interact/search-and-query
summary: Dumps all terms in the given dictionary
syntax: 'FT.DICTDUMP dict

  '
syntax_fmt: FT.DICTDUMP dict
syntax_str: ''
title: FT.DICTDUMP
---

Dump all terms in the given dictionary

[Examples](#examples)

## Required argumemts

<details open>
<summary><code>dict</code></summary>

is dictionary name.
</details>

## Return

FT.DICTDUMP returns an array, where each element is term (string).

## Examples

<details open>
<summary><b>Dump all terms in the dictionary</b></summary>

{{< highlight bash >}}
127.0.0.1:6379> FT.DICTDUMP dict
1) "foo"
2) "bar"
3) "hello world"
{{< / highlight >}}
</details>

## See also

[`FT.DICTADD`]({{< baseurl >}}/commands/ft.dictadd/) | [`FT.DICTDEL`]({{< baseurl >}}/commands/ft.dictdel/)

## Related topics

[RediSearch]({{< relref "/develop/interact/search-and-query/" >}})


