---
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
description: Returns, for each input rank, an estimation of the value (floating-point)
  with that rank
group: tdigest
hidden: false
linkTitle: TDIGEST.BYRANK
module: Bloom
since: 2.4.0
stack_path: docs/data-types/probabilistic
summary: Returns, for each input rank, an estimation of the value (floating-point)
  with that rank
syntax_fmt: TDIGEST.BYRANK key rank [rank ...]
syntax_str: rank [rank ...]
title: TDIGEST.BYRANK
---
Returns, for each input rank, an estimation of the value (floating-point) with that rank.

Multiple estimations can be retrieved in a signle call.

## Required arguments

<details open><summary><code>key</code></summary>
is key name for an existing t-digest sketch.
</details>

<details open><summary><code>rank</code></summary>

Rank, for which the value should be retrieved.

0 is the rank of the value of the smallest observation.

_n_-1 is the rank of the value of the largest observation; _n_ denotes the number of observations added to the sketch.

</details>

## Return value

[Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) - an array of floating-points populated with value_1, value_2, ..., value_R:

- Return an accurate result when `rank` is 0 (the value of the smallest observation)
- Return an accurate result when `rank` is _n_-1 (the value of the largest observation), where _n_ denotes the number of observations added to the sketch.
- Return 'inf' when `rank` is equal to _n_ or larger than _n_

All values are 'nan' if the sketch is empty.

## Examples

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
