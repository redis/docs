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
since: 1.0.0
stack_path: docs/interact/search-and-query
summary: Returns the execution plan for a complex query
syntax: "FT.EXPLAIN index query \n  [DIALECT dialect]\n"
syntax_fmt: "FT.EXPLAIN index query [DIALECT\_dialect]"
syntax_str: "query [DIALECT\_dialect]"
title: FT.EXPLAIN
---

Return the execution plan for a complex query

[Examples](#examples)

## Required arguments

<details open>
<summary><code>index</code></summary>

is index name. You must first create the index using [`FT.CREATE`]({{< relref "commands/ft.create/" >}}).
</details>

<details open>
<summary><code>query</code></summary>

is query string, as if sent to FT.SEARCH`.
</details>

## Optional arguments

<details open>
<summary><code>DIALECT {dialect_version}</code></summary>

is dialect version under which to execute the query. If not specified, the query executes under the default dialect version set during module initial loading or via [`FT.CONFIG SET`]({{< relref "commands/ft.config-set/" >}}) command.
</details>

{{% alert title="Notes" color="warning" %}}
 
- In the returned response, a `+` on a term is an indication of stemming.
- Use `redis-cli --raw` to properly read line-breaks in the returned response.

{{% /alert %}}

## Return

FT.EXPLAIN returns a string representing the execution plan.

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

## See also

[`FT.CREATE`]({{< relref "commands/ft.create/" >}}) | [`FT.SEARCH`]({{< relref "commands/ft.search/" >}}) | [`FT.CONFIG SET`]({{< relref "commands/ft.config-set/" >}})

## Related topics

[RediSearch]({{< relref "/develop/ai/search-and-query/" >}})

