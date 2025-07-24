---
acl_categories:
- '@search'
- '@write'
arguments:
- name: key
  type: string
- name: string
  type: string
- name: score
  type: double
- arguments:
  - name: incr
    token: INCR
    type: pure-token
  name: increment score
  optional: true
  type: oneof
- name: payload
  optional: true
  token: PAYLOAD
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
description: Adds a suggestion string to an auto-complete suggestion dictionary
group: suggestion
hidden: false
linkTitle: FT.SUGADD
module: Search
since: 1.0.0
stack_path: docs/interact/search-and-query
summary: Adds a suggestion string to an auto-complete suggestion dictionary
syntax: "FT.SUGADD key string score \n  [INCR] \n  [PAYLOAD payload]\n"
syntax_fmt: "FT.SUGADD key string score [INCR] [PAYLOAD\_payload]"
syntax_str: "string score [INCR] [PAYLOAD\_payload]"
title: FT.SUGADD
---

Add a suggestion string to an auto-complete suggestion dictionary

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

<details open>
<summary><code>score</code></summary> 

is floating point number of the suggestion string's weight.
</details>

The auto-complete suggestion dictionary is disconnected from the index definitions and leaves creating and updating suggestions dictionaries to the user.

## Optional arguments

<details open>
<summary><code>INCR</code></summary> 

increments the existing entry of the suggestion by the given score, instead of replacing the score. This is useful for updating the dictionary based on user queries in real time.
</details>

<details open>
<summary><code>PAYLOAD {payload}</code></summary> 

saves an extra payload with the suggestion, that can be fetched by adding the `WITHPAYLOADS` argument to [`FT.SUGGET`]({{< relref "commands/ft.sugget/" >}}).
</details>

## Return

FT.SUGADD returns an integer reply, which is the current size of the suggestion dictionary.

## Examples

<details open>
<summary><b>Add a suggestion string to an auto-complete suggestion dictionary</b></summary>

{{< highlight bash >}}
127.0.0.1:6379> FT.SUGADD sug "hello world" 1
(integer) 3
{{< / highlight >}}
</details>

## Return information

{{< multitabs id="ft-sugadd-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): number of elements added to the suggestion dictionary.

-tab-sep-

[Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): number of elements added to the suggestion dictionary.

{{< /multitabs >}}
## See also

[`FT.SUGGET`]({{< relref "commands/ft.sugget/" >}}) | [`FT.SUGDEL`]({{< relref "commands/ft.sugdel/" >}}) | [`FT.SUGLEN`]({{< relref "commands/ft.suglen/" >}}) 

## Related topics

[RediSearch]({{< relref "/develop/ai/search-and-query/" >}})