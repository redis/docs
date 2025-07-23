---
acl_categories:
- '@search'
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

## Return information

{{< multitabs id="ft-dictdump-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of results.

-tab-sep-

[Set]({{< relref "/develop/reference/protocol-spec#sets" >}}) of results.

{{< /multitabs >}}

## See also

[`FT.DICTADD`]({{< relref "commands/ft.dictadd/" >}}) | [`FT.DICTDEL`]({{< relref "commands/ft.dictdel/" >}})

## Related topics

[RediSearch]({{< relref "/develop/ai/search-and-query/" >}})


