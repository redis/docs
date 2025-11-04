---
acl_categories:
- '@tdigest'
- '@read'
arguments:
- name: key
  type: key
- multiple: true
  name: rank
  type: double
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
complexity: O(N) where N is the number of ranks specified.
description: Returns, for each input rank, a floating-point estimation of the value
  with that rank
group: tdigest
hidden: false
linkTitle: TDIGEST.BYRANK
module: Bloom
since: 2.4.0
stack_path: docs/data-types/probabilistic
summary: Returns, for each input rank, a floating-point estimation of the value
  with that rank
syntax_fmt: TDIGEST.BYRANK key rank [rank ...]
syntax_str: rank [rank ...]
title: TDIGEST.BYRANK
---
Returns, for each input rank, a floating-point estimation of the value with that rank.
Multiple estimations can be retrieved in a single call.

## Required arguments

<details open><summary><code>key</code></summary>

is the key name of an existing t-digest sketch.
</details>

<details open><summary><code>rank</code></summary>

Ranks for which the values should be retrieved.

0 is the rank of the value of the smallest observation.

_n_-1 is the rank of the value of the largest observation, where _n_ denotes the number of observations that have been added to the sketch.
</details>

## Example

{{< highlight bash >}}
redis> TDIGEST.CREATE t COMPRESSION 1000
OK
redis> TDIGEST.ADD t 1 2 2 3 3 3 4 4 4 4 5 5 5 5 5
OK
redis> TDIGEST.BYRANK t 0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15
 1) "1"
 2) "2"
 3) "2"
 4) "3"
 5) "3"
 6) "3"
 7) "4"
 8) "4"
 9) "4"
10) "4"
11) "5"
12) "5"
13) "5"
14) "5"
15) "5"
16) "inf"
{{< / highlight >}}

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported"><nobr>&#x2705; Flexible & Annual</nobr></span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |

## Return information

{{< multitabs id="tdigest-byrank-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:

* [Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [bulk strings]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) as floating-points, populated with value_1, value_2, ..., value_R:
    * an accurate result when `rank` is `0`, the value of the smallest observation.
    * an accurate result when `rank` is _n_-1, the value of the largest observation, where _n_ denotes the number of observations added to the sketch.
    * `inf` when `rank` is equal to _n_ or larger than _n_.
    * `nan` for all ranks when the given sketch is empty.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: the given key does not exist or is of an incorrect type, rank parsing errors, or incorrect number of arguments.

-tab-sep-

One of the following:

* [Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [doubles]({{< relref "/develop/reference/protocol-spec#doubles" >}}) as floating-points, populated with value_1, value_2, ..., value_R:
    * an accurate result when `rank` is `0`, the value of the smallest observation.
    * an accurate result when `rank` is _n_-1, the value of the largest observation, where _n_ denotes the number of observations added to the sketch.
    * `inf` when `rank` is equal to _n_ or larger than _n_.
    * `nan` for all ranks when the given sketch is empty.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: the given key does not exist or is of an incorrect type, rank parsing errors, or incorrect number of arguments.

{{< /multitabs >}}
