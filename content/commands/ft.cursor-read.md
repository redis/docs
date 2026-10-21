---
acl_categories:
- '@read'
- '@search'
arguments:
- name: index
  type: string
- name: cursor_id
  type: integer
- name: read size
  optional: true
  token: COUNT
  type: integer
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
description: Reads from a cursor
group: search
hidden: false
linkTitle: FT.CURSOR READ
module: Search
railroad_diagram: /images/railroad/ft.cursor-read.svg
since: 1.1.0
stack_path: docs/interact/search-and-query
summary: Reads from a cursor
syntax_fmt: "FT.CURSOR READ index cursor_id [COUNT\_read size]"
title: FT.CURSOR READ
---

Read next results from an existing cursor

[Examples](#examples)

See [Cursor API](/content/develop/ai/search-and-query/advanced-concepts/aggregations.md#cursor-api) for more details.

## Required arguments

<details open>
<summary><code>index</code></summary>

is index name.
</details>

<details open>
<summary><code>cursor_id</code></summary>

is id of the cursor.
</details>

<details open>
<summary><code>[COUNT read_size]</code></summary>

is number of results to read. This parameter overrides `COUNT` specified in [`FT.AGGREGATE`](/content/commands/ft.aggregate.md).
</details>

## Examples

<details open>
<summary><b>Read next results from a cursor</b></summary>

{{< highlight bash >}}
127.0.0.1:6379> FT.CURSOR READ idx 342459320 COUNT 50
{{< / highlight >}}
</details>

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis Cloud<br />Flexible & Annual | Redis Cloud<br />Free & Fixed | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> |  |

## Return information

{{< multitabs id="ft-cursor-read-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Array](/content/develop/reference/protocol-spec.md#arrays) with search results and metadata.
* [Simple error reply](/content/develop/reference/protocol-spec.md#simple-errors) in these cases: cursor not found.

-tab-sep-

One of the following:
* [Map](/content/develop/reference/protocol-spec.md#maps) with structured search results and metadata.
* [Simple error reply](/content/develop/reference/protocol-spec.md#simple-errors) in these cases: cursor not found.

{{< /multitabs >}}

## See also

[`FT.CURSOR DEL`](/content/commands/ft.cursor-del.md) | [`FT.AGGREGATE`](/content/commands/ft.aggregate.md)

## Related topics

- [RediSearch](/content/develop/ai/search-and-query/_index.md)
- [Search commands in MULTI/EXEC transactions and Lua scripts](/content/develop/ai/search-and-query/advanced-concepts/transactions.md)
