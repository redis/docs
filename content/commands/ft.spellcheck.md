---
acl_categories:
- '@search'
arguments:
- name: index
  type: string
- name: query
  type: string
- name: distance
  optional: true
  token: DISTANCE
  type: integer
- arguments:
  - arguments:
    - name: include
      token: INCLUDE
      type: pure-token
    - name: exclude
      token: EXCLUDE
      type: pure-token
    name: inclusion
    type: oneof
  - name: dictionary
    type: string
  - multiple: true
    name: terms
    optional: true
    type: string
  name: terms
  optional: true
  token: TERMS
  type: block
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
description: Performs spelling correction on a query, returning suggestions for misspelled
  terms
group: search
hidden: false
linkTitle: FT.SPELLCHECK
module: Search
since: 1.4.0
stack_path: docs/interact/search-and-query
summary: Performs spelling correction on a query, returning suggestions for misspelled
  terms
syntax: "FT.SPELLCHECK index query \n  [DISTANCE distance] \n  [TERMS INCLUDE | EXCLUDE\
  \ dictionary [terms [terms ...]]] \n  [DIALECT dialect]\n"
syntax_fmt: "FT.SPELLCHECK index query [DISTANCE\_distance] [TERMS\_<INCLUDE |\n \
  \ EXCLUDE> dictionary [terms [terms ...]]] [DIALECT\_dialect]"
syntax_str: "query [DISTANCE\_distance] [TERMS\_<INCLUDE | EXCLUDE> dictionary [terms\
  \ [terms ...]]] [DIALECT\_dialect]"
title: FT.SPELLCHECK
---

Perform spelling correction on a query, returning suggestions for misspelled terms

[Examples](#examples)

## Required arguments

<details open>
<summary><code>index</code></summary>

is index with the indexed terms.
</details>

<details open>
<summary><code>query</code></summary> 

is search query.
</details>

See [Spellchecking]({{< relref "/develop/ai/search-and-query/advanced-concepts/spellcheck" >}}) for more details.

## Optional arguments

<details open>
<summary><code>TERMS</code></summary>

specifies an inclusion (`INCLUDE`) or exclusion (`EXCLUDE`) of a custom dictionary. To learn more about managing custom dictionaries, see [`FT.DICTADD`]({{< relref "commands/ft.dictadd/" >}}), [`FT.DICTDEL`]({{< relref "commands/ft.dictdel/" >}}), and [`FT.DICTDUMP`]({{< relref "commands/ft.dictdump/" >}}).

You can specify multiple inclusion and exclusion `TERMS`.
</details>

<details open>
<summary><code>DISTANCE</code></summary> 

is maximum Levenshtein distance for spelling suggestions (default: 1, max: 4).
</details>

<details open>
<summary><code>DIALECT {dialect_version}</code></summary> 

selects the dialect version under which to execute the query. If not specified, the query will execute under the default dialect version set during module initial loading or via [`FT.CONFIG SET`]({{< relref "commands/ft.config-set/" >}}) command.
</details>

## Return

FT.SPELLCHECK returns an array reply, in which each element represents a misspelled term from the query. The misspelled terms are ordered by their order of appearance in the query. 
Each misspelled term, in turn, is a 3-element array consisting of the constant string `TERM`, the term itself and an array of suggestions for spelling corrections.
Each element in the spelling corrections array consists of the score of the suggestion and the suggestion itself. The suggestions array, per misspelled term, is ordered in descending order by score.
The score is calculated by dividing the number of documents in which the suggested term exists by the total number of documents in the index. Results can be normalized by dividing scores by the highest score.

## Examples

<details open>
<summary><b>Perform spelling correction on a query</b></summary>

{{< highlight bash >}}
127.0.0.1:6379> FT.SPELLCHECK idx held DISTANCE 2
1) 1) "TERM"
   2) "held"
   3) 1) 1) "0.66666666666666663"
         2) "hello"
      2) 1) "0.33333333333333331"
         2) "help"
{{< / highlight >}}
</details>

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span> | <span title="Flexible & Annual"><span title="Supported">&#x2705; Supported</span></span><br /><span title="Free & Fixed"><span title="Supported">&#x2705; Supported</nobr></span></span> |  |


## Return information

{{< multitabs id="ft-spellcheck-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of spell check results for each term.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: no such index.

-tab-sep-

One of the following:
* [Map]({{< relref "/develop/reference/protocol-spec#maps" >}}) with a `results` key containing spell check results for each term.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: no such index.

{{< /multitabs >}}

## See also

[`FT.CONFIG SET`]({{< relref "commands/ft.config-set/" >}}) | [`FT.DICTADD`]({{< relref "commands/ft.dictadd/" >}}) | [`FT.DICTDEL`]({{< relref "commands/ft.dictdel/" >}}) | [`FT.DICTDUMP`]({{< relref "commands/ft.dictdump/" >}})

## Related topics

- [Spellchecking]({{< relref "/develop/ai/search-and-query/advanced-concepts/spellcheck" >}})
- [RediSearch]({{< relref "/develop/ai/search-and-query/" >}})