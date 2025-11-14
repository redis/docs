---
acl_categories:
- '@tdigest'
- '@read'
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
- kubernetes
- clients
complexity: O(N) where N is the number of quantiles specified.
description: Returns, for each input fraction, a floating-point estimation of the
  value that is smaller than the given fraction of observations
group: tdigest
hidden: false
linkTitle: TDIGEST.QUANTILE
module: Bloom
since: 2.4.0
stack_path: docs/data-types/probabilistic
summary: Returns, for each input fraction, a floating-point estimation of the value
  that is smaller than the given fraction of observations
syntax_fmt: TDIGEST.QUANTILE key quantile [quantile ...]
syntax_str: quantile [quantile ...]
title: TDIGEST.QUANTILE
---
Returns, for each input fraction, a floating-point estimation of the value that is smaller than the given fraction of observations.
Multiple quantiles can be retrieved in a single call.

## Required arguments

<details open><summary><code>key</code></summary> 

is the key name for an existing t-digest sketch.
</details>

<details open><summary><code>quantile</code></summary> 

is the input fraction between 0 and 1 inclusively.
</details>

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

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

{{< multitabs id="tdigest-quantile-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:

* [Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [bulk string replies]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) as floating-point estimates, populated with value_1, value_2, ..., value_N.
    * an accurate result when `quantile` is `0`, the value of the smallest observation.
    * an accurate result when `quantile` is `1`, the value of the largest observation.
    * `nan` for all quantiles when the given sketch is empty.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: the given key does not exist or is of an incorrect type, quantile parsing errors, or incorrect number of arguments.

-tab-sep-

One of the following:

* [Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [double replies]({{< relref "/develop/reference/protocol-spec#doubles" >}}) as estimates, populated with value_1, value_2, ..., value_N.
    * an accurate result when `quantile` is `0`, the value of the smallest observation.
    * an accurate result when `quantile` is `1`, the value of the largest observation.
    * `nan` for all quantiles when the given sketch is empty.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: the given key does not exist or is of an incorrect type, quantile parsing errors, or incorrect number of arguments.

{{< /multitabs >}}