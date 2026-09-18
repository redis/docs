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
complexity: O(1)
description: Deletes terms from a dictionary
group: search
hidden: false
linkTitle: FT.DICTDEL
module: Search
railroad_diagram: /images/railroad/ft.dictdel.svg
since: 1.4.0
stack_path: docs/interact/search-and-query
summary: Deletes terms from a dictionary
syntax_fmt: FT.DICTDEL dict term [term ...]
title: FT.DICTDEL
---

Delete terms from a dictionary

[Examples](#examples)

## Required arguments

<details open>
<summary><code>dict</code></summary>

is dictionary name.
</details>

<details open>
<summary><code>term</code></summary>

term to delete from the dictionary.
</details>

## Examples

<details open>
<summary><b>Delete terms from a dictionary</b></summary>

{{< highlight bash >}}
127.0.0.1:6379> FT.DICTDEL dict foo bar "hello world"
(integer) 3
{{< / highlight >}}
</details>

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis Cloud<br />Flexible & Annual | Redis Cloud<br />Free & Fixed | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> |  |

## Return information

{{< multitabs id="ft-dictdel-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](/content/develop/reference/protocol-spec.md#integers): the number of terms deleted from the dictionary.

-tab-sep-

[Integer reply](/content/develop/reference/protocol-spec.md#integers): the number of terms deleted from the dictionary.

{{< /multitabs >}}

## See also

[`FT.DICTADD`](/content/commands/ft.dictadd.md) | [`FT.DICTDUMP`](/content/commands/ft.dictdump.md)

## Related topics

[RediSearch](/content/develop/ai/search-and-query/_index.md)
