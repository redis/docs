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
linkTitle: FT.EXPLAINCLI
module: Search
since: 1.0.0
stack_path: docs/interact/search-and-query
summary: Returns the execution plan for a complex query
syntax: "FT.EXPLAINCLI index query \n  [DIALECT dialect]\n"
syntax_fmt: "FT.EXPLAINCLI index query [DIALECT\_dialect]"
syntax_str: "query [DIALECT\_dialect]"
title: FT.EXPLAINCLI
---

Return the execution plan for a complex query but formatted for easier reading without using `redis-cli --raw`

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

{{% alert title="Note" color="warning" %}}
 
In the returned response, a `+` on a term is an indication of stemming.

{{% /alert %}}

</details>

## Examples

<details open>
<summary><b>Return the execution plan for a complex query</b></summary>

{{< highlight bash >}}
$ redis-cli

127.0.0.1:6379> FT.EXPLAINCLI rd "(foo bar)|(hello world) @date:[100 200]|@date:[500 +inf]"
 1) INTERSECT {
 2)   UNION {
 3)     INTERSECT {
 4)       UNION {
 5)         foo
 6)         +foo(expanded)
 7)       }
 8)       UNION {
 9)         bar
10)         +bar(expanded)
11)       }
12)     }
13)     INTERSECT {
14)       UNION {
15)         hello
16)         +hello(expanded)
17)       }
18)       UNION {
19)         world
20)         +world(expanded)
21)       }
22)     }
23)   }
24)   UNION {
25)     NUMERIC {100.000000 <= @date <= 200.000000}
26)     NUMERIC {500.000000 <= @date <= inf}
27)   }
28) }
29)
{{< / highlight >}}
</details>

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis Cloud<br />Flexible & Annual | Redis Cloud<br />Free & Fixed | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> |  |

## Return information

{{< multitabs id="ft-explaincli-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [bulk string replies]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) containing the query execution plan in CLI format.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: no such index, syntax error in query.

-tab-sep-

One of the following:
* [Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [bulk string replies]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) containing the query execution plan in CLI format.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: no such index, syntax error in query.

{{< /multitabs >}}

## See also

[`FT.CREATE`]({{< relref "commands/ft.create/" >}}) | [`FT.SEARCH`]({{< relref "commands/ft.search/" >}}) | [`FT.CONFIG SET`]({{< relref "commands/ft.config-set/" >}})

## Related topics

[RediSearch]({{< relref "/develop/ai/search-and-query/" >}})

