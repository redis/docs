---
arguments:
- name: key
  type: string
- name: prefix
  type: string
- name: fuzzy
  optional: true
  token: FUZZY
  type: pure-token
- name: withscores
  optional: true
  token: WITHSCORES
  type: pure-token
- name: withpayloads
  optional: true
  token: WITHPAYLOADS
  type: pure-token
- name: max
  optional: true
  token: MAX
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
description: Gets completion suggestions for a prefix
group: suggestion
hidden: false
history:
- - 2.0.0
  - Deprecated `WITHPAYLOADS` argument
linkTitle: FT.SUGGET
module: Search
since: 1.0.0
stack_path: docs/interact/search-and-query
summary: Gets completion suggestions for a prefix
syntax: "FT.SUGGET key prefix \n  [FUZZY] \n  [WITHSCORES] \n  [WITHPAYLOADS] \n \
  \ [MAX max]\n"
syntax_fmt: "FT.SUGGET key prefix [FUZZY] [WITHSCORES] [WITHPAYLOADS] [MAX\_max]"
syntax_str: "prefix [FUZZY] [WITHSCORES] [WITHPAYLOADS] [MAX\_max]"
title: FT.SUGGET
---

Get completion suggestions for a prefix

## Required arguments

<details open>
<summary><code>key</code></summary>

is suggestion dictionary key.
</details>

<details open>
<summary><code>prefix</code></summary>

is prefix to complete on.
</details>

## Optional arguments

<details open>
<summary><code>FUZZY</code></summary> 

performs a fuzzy prefix search, including prefixes at Levenshtein distance of 1 from the prefix sent.
</details>

<details open>
<summary><code>MAX num</code></summary> 

limits the results to a maximum of `num` (default: 5).
</details>

<details open>
<summary><code>WITHSCORES</code></summary> 

also returns the score of each suggestion. This can be used to merge results from multiple instances.
</details>

<details open>
<summary><code>WITHPAYLOADS</code></summary> 

returns optional payloads saved along with the suggestions. If no payload is present for an entry, it returns a null reply.
</details>

## Return

FT.SUGGET returns an array reply, which is a list of the top suggestions matching the prefix, optionally with score after each entry.

## Example

<details open>
<summary><b>Get completion suggestions for a prefix</b></summary>

{{< highlight bash >}}
127.0.0.1:6379> FT.SUGGET sug hell FUZZY MAX 3 WITHSCORES
1) "hell"
2) "2147483648"
3) "hello"
4) "0.70710676908493042"
{{< / highlight >}}
</details>

## See also

[`FT.SUGADD`]({{< baseurl >}}/commands/ft.sugadd/) | [`FT.SUGDEL`]({{< baseurl >}}/commands/ft.sugdel/) | [`FT.SUGLEN`]({{< baseurl >}}/commands/ft.suglen/) 

## Related topics

[RediSearch]({{< relref "/develop/interact/search-and-query/" >}})
