---
arguments:
- name: key
  type: key
- multiple: true
  name: quantile
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
complexity: O(N) where N is the number of quantiles specified.
description: Returns, for each input fraction, an estimation of the value (floating
  point) that is smaller than the given fraction of observations
group: tdigest
hidden: false
linkTitle: TDIGEST.QUANTILE
module: Bloom
since: 2.4.0
stack_path: docs/data-types/probabilistic
summary: Returns, for each input fraction, an estimation of the value (floating point)
  that is smaller than the given fraction of observations
syntax_fmt: TDIGEST.QUANTILE key quantile [quantile ...]
syntax_str: quantile [quantile ...]
title: TDIGEST.QUANTILE
---
Returns, for each input fraction, an estimation of the value (floating point) that is smaller than the given fraction of observations.

Multiple quantiles can be retrieved in a single call.

## Required arguments

<details open><summary><code>key</code></summary> 
is key name for an existing t-digest sketch.
</details>

<details open><summary><code>quantile</code></summary> 
is the input fraction (between 0 and 1 inclusively)
</details>

## Return value

[Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) - an array of estimates (floating-point) populated with value_1, value_2, ..., value_N.

- Return an accurate result when `quantile` is 0 (the value of the smallest observation)
- Return an accurate result when `quantile` is 1 (the value of the largest observation)

All values are 'nan' if the sketch is empty.

## Examples

{{< highlight bash >}}
redis> TDIGEST.CREATE t COMPRESSION 1000
OK
redis> TDIGEST.ADD t 1 2 2 3 3 3 4 4 4 4 5 5 5 5 5
OK
redis> TDIGEST.QUANTILE t 0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1
 1) "1"
 2) "2"
 3) "3"
 4) "3"
 5) "4"
 6) "4"
 7) "4"
 8) "5"
 9) "5"
10) "5"
11) "5"

{{< / highlight >}}
