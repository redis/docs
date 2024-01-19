---
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
syntax: "FT.SPELLCHECK index query 
  [DISTANCE distance] 
  [TERMS INCLUDE | EXCLUDE\
  \ dictionary [terms [terms ...]]] 
  [DIALECT dialect]
"
syntax_fmt: "FT.SPELLCHECK index query [DISTANCE\_distance] [TERMS\_<INCLUDE |
 \
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

See [Spellchecking](/docs/interact/search-and-query/advanced-concepts/spellcheck/) for more details.

## Optional arguments

<details open>
<summary><code>TERMS</code></summary> 

specifies an inclusion (`INCLUDE`) or exclusion (`EXCLUDE`) of a custom dictionary named `{dict}`. Refer to [`FT.DICTADD`](/commands/ft.dictadd), [`FT.DICTDEL`](/commands/ft.dictdel) and [`FT.DICTDUMP`](/commands/ft.dictdump) about managing custom dictionaries.
</details>

<details open>
<summary><code>DISTANCE</code></summary> 

is maximum Levenshtein distance for spelling suggestions (default: 1, max: 4).
</details>

<details open>
<summary><code>DIALECT {dialect_version}</code></summary> 

selects the dialect version under which to execute the query. If not specified, the query will execute under the default dialect version set during module initial loading or via [`FT.CONFIG SET`](/commands/ft.config-set) command.
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

## See also

[`FT.CONFIG SET`](/commands/ft.config-set) | [`FT.DICTADD`](/commands/ft.dictadd) | [`FT.DICTDEL`](/commands/ft.dictdel) | [`FT.DICTDUMP`](/commands/ft.dictdump)

## Related topics

- [Spellchecking](/docs/interact/search-and-query/advanced-concepts/spellcheck/)
- [RediSearch](/docs/stack/search)