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
railroad_diagram: /images/railroad/ft.sugdel.svg
since: 1.0.0
stack_path: docs/interact/search-and-query
summary: Deletes a string from a suggestion index
syntax_fmt: FT.SUGDEL key string
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

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | Not supported on clustered databases. |

## Return information

{{< multitabs id="ft-sugdel-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](/content/develop/reference/protocol-spec.md#integers): 1 if the suggestion was deleted, 0 if it was not found.

-tab-sep-

[Integer reply](/content/develop/reference/protocol-spec.md#integers): 1 if the suggestion was deleted, 0 if it was not found.

{{< /multitabs >}}

## See also

[`FT.SUGGET`](/content/commands/ft.sugget.md) | [`FT.SUGADD`](/content/commands/ft.sugadd.md) | [`FT.SUGLEN`](/content/commands/ft.suglen.md) 

## Related topics

[RediSearch](/content/develop/ai/search-and-query/_index.md)