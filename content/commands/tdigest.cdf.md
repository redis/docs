---
acl_categories:
- '@tdigest'
- '@read'
arguments:
- name: key
  type: key
- multiple: true
  name: value
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
complexity: O(N) where N is the number of values specified.
description: Returns, for each input value, an estimation of the floating-point fraction
  of (observations smaller than the given value + half the observations equal to the
  given value)
group: tdigest
hidden: false
linkTitle: TDIGEST.CDF
module: Bloom
since: 2.4.0
stack_path: docs/data-types/probabilistic
summary: Returns, for each input value, an estimation of the floating-point fraction
  of (observations smaller than the given value + half the observations equal to the
  given value)
syntax_fmt: TDIGEST.CDF key value [value ...]
syntax_str: value [value ...]
title: TDIGEST.CDF
---
Returns, for each input value, an estimation of the floating-point fraction of (_observations smaller than the given value_ + _half the observations equal to the given value_).
Multiple fractions can be retrieved in a single call.

## Required arguments

<details open><summary><code>key</code></summary>

is the key name for an existing t-digest sketch.
</details>

<details open><summary><code>value</code></summary>

are the values for which the CDF (Cumulative Distribution Function) should be retrieved.
</details>

## Examples

{{< highlight bash >}}
redis> TDIGEST.CREATE t COMPRESSION 1000
OK
redis> TDIGEST.ADD t 1 2 2 3 3 3 4 4 4 4 5 5 5 5 5
OK
redis> TDIGEST.CDF t 0 1 2 3 4 5 6
1) "0"
2) "0.033333333333333333"
3) "0.13333333333333333"
4) "0.29999999999999999"
5) "0.53333333333333333"
6) "0.83333333333333337"
7) "1"
{{< / highlight >}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

{{< multitabs id="tdigest-cdf-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:

* [Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [bulk string replies]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) as floating-points, populated with fraction_1, fraction_2, ..., fraction_N.
All values are `nan` if the given sketch is empty.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: the given key does not exist or is of an incorrect type, value parsing errors, or an incorrect number of arguments.

-tab-sep-

One of the following:

* [Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [doubles]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) populated with fraction_1, fraction_2, ..., fraction_N.
All values are `nan` if the given sketch is empty.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: the given key does not exist or is of an incorrect type, value parsing errors, or an incorrect number of arguments.

{{< /multitabs >}}
