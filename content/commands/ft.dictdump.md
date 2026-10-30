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
compatibility:
  software:
    general: supported
    flex: unsupported
  cloud:
    pro: supported
    essentials: supported
complexity: O(N), where N is the size of the dictionary
description: Dumps all terms in the given dictionary
group: search
hidden: false
linkTitle: FT.DICTDUMP
module: Search
railroad_diagram: /images/railroad/ft.dictdump.svg
since: 1.4.0
stack_path: docs/interact/search-and-query
summary: Dumps all terms in the given dictionary
syntax_fmt: FT.DICTDUMP dict
title: FT.DICTDUMP
---

Dump all terms in the given dictionary

[Examples](#examples)

## Required arguments

<details open>
<summary><code>dict</code></summary>

is dictionary name.
</details>

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

## Redis Software and Redis Cloud compatibility

{{< command-compatibility >}}

## Return information

{{< multitabs id="ft-dictdump-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array](/content/develop/reference/protocol-spec.md#arrays) of dictionary terms.

-tab-sep-

[Set](/content/develop/reference/protocol-spec.md#sets) of dictionary terms.

{{< /multitabs >}}

## See also

[`FT.DICTADD`](/content/commands/ft.dictadd.md) | [`FT.DICTDEL`](/content/commands/ft.dictdel.md)

## Related topics

[RediSearch](/content/develop/ai/search-and-query/_index.md)

