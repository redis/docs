---
acl_categories:
- '@search'
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
compatibility:
  software:
    general: supported
    flex: unsupported
  cloud:
    pro: supported
    essentials: supported
complexity: O(1)
description: Adds terms to a dictionary
group: search
hidden: false
linkTitle: FT.DICTADD
module: Search
railroad_diagram: /images/railroad/ft.dictadd.svg
since: 1.4.0
stack_path: docs/interact/search-and-query
summary: Adds terms to a dictionary
syntax_fmt: FT.DICTADD dict term [term ...]
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

## Examples

<details open>
<summary><b>Add terms to a dictionary</b></summary>

{{< highlight bash >}}
127.0.0.1:6379> FT.DICTADD dict foo bar "hello world"
(integer) 3
{{< / highlight >}}
</details>

## Redis Software and Redis Cloud compatibility

{{< command-compatibility >}}

## Return information

{{< multitabs id="ft-dictadd-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](/content/develop/reference/protocol-spec.md#integers): the number of new terms added to the dictionary.

-tab-sep-

[Integer reply](/content/develop/reference/protocol-spec.md#integers): the number of new terms added to the dictionary.

{{< /multitabs >}}

## See also

[`FT.DICTDEL`](/content/commands/ft.dictdel.md) | [`FT.DICTDUMP`](/content/commands/ft.dictdump.md)

## Related topics

[RediSearch](/content/develop/ai/search-and-query/_index.md)