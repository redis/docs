---
acl_categories:
- '@search'
arguments:
- name: index
  type: string
- name: query
  type: string
- name: dialect
  optional: true
  since: 2.4.3
  token: DIALECT
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
command_flags:
- readonly
complexity: O(1)
description: Returns the execution plan for a complex query
group: search
hidden: false
linkTitle: FT.EXPLAIN
module: Search
railroad_diagram: /images/railroad/ft.explain.svg
since: 1.0.0
stack_path: docs/interact/search-and-query
summary: Returns the execution plan for a complex query
syntax_fmt: "FT.EXPLAIN index query [DIALECT\_dialect]"
title: FT.EXPLAIN
---

Return the execution plan for a complex query

[Examples](#examples)

## Required arguments

<details open>
<summary><code>index</code></summary>

is index name. You must first create the index using [`FT.CREATE`](/content/commands/ft.create.md).
</details>

<details open>
<summary><code>query</code></summary>

is query string, as if sent to FT.SEARCH`.
</details>

## Optional arguments

<details open>
<summary><code>DIALECT {dialect_version}</code></summary>

is dialect version under which to execute the query. If not specified, the query executes under the default dialect version set during module initial loading or via [`FT.CONFIG SET`](/content/commands/ft.config-set.md) command.
</details>

> [!NOTE] Notes
>  
> - In the returned response, a `+` on a term is an indication of stemming.
> - Use `redis-cli --raw` to properly read line-breaks in the returned response.

## Examples

<details open>
<summary><b>Return the execution plan for a complex query</b></summary>

{{< highlight bash >}}
$ redis-cli --raw

127.0.0.1:6379> FT.EXPLAIN rd "(foo bar)|(hello world) @date:[100 200]|@date:[500 +inf]"
INTERSECT {
  UNION {
    INTERSECT {
      foo
      bar
    }
    INTERSECT {
      hello
      world
    }
  }
  UNION {
    NUMERIC {100.000000 <= x <= 200.000000}
    NUMERIC {500.000000 <= x <= inf}
  }
}
{{< / highlight >}}
</details>

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis Cloud<br />Flexible & Annual | Redis Cloud<br />Free & Fixed | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> |  |

## Return information

{{< multitabs id="ft-explain-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Bulk string](/content/develop/reference/protocol-spec.md#bulk-strings) containing the query execution plan.
* [Simple error reply](/content/develop/reference/protocol-spec.md#simple-errors) in these cases: no such index, syntax error in query.

-tab-sep-

One of the following:
* [Bulk string](/content/develop/reference/protocol-spec.md#bulk-strings) containing the query execution plan.
* [Simple error reply](/content/develop/reference/protocol-spec.md#simple-errors) in these cases: no such index, syntax error in query.

{{< /multitabs >}}

## See also

[`FT.CREATE`](/content/commands/ft.create.md) | [`FT.SEARCH`](/content/commands/ft.search.md) | [`FT.CONFIG SET`](/content/commands/ft.config-set.md)

## Related topics

[RediSearch](/content/develop/ai/search-and-query/_index.md)

