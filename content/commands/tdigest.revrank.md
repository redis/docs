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
description: Returns, for each floating-point input value, the estimated reverse rank
  of the value (the number of observations in the sketch that are larger than the
  value + half the number of observations that are equal to the value)
group: tdigest
hidden: false
linkTitle: TDIGEST.REVRANK
module: Bloom
since: 2.4.0
stack_path: docs/data-types/probabilistic
summary: Returns, for each floating-point input value, the estimated reverse rank
  of the value (the number of observations in the sketch that are larger than the
  value + half the number of observations that are equal to the value)
syntax_fmt: TDIGEST.REVRANK key value [value ...]
syntax_str: value [value ...]
title: TDIGEST.REVRANK
---
Returns, for each floating-point input value, the estimated reverse rank of the value (_the number of observations in the sketch that are larger than the value_ + _half the number of observations that are equal to the value_).
Multiple reverse ranks can be retrieved in a single call.

## Required arguments

<details open><summary><code>key</code></summary>

is the key name for an existing t-digest sketch.
</details>

<details open><summary><code>value</code></summary>

is the input value for which the reverse rank should be estimated.
</details>

## Return value

[Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) - an array of integers populated with revrank_1, revrank_2, ..., revrank_V:
  
- -1 - when `value` is larger than the value of the largest observation.
- The number of observations - when `value` is smaller than the value of the smallest observation.
- Otherwise: an estimation of the number of (observations larger than `value` + half the observations equal to `value`).
  
0 is the reverse rank of the value of the largest observation.

_n_-1 is the reverse rank of the value of the smallest observation; _n_ denotes the number of observations added to the sketch.

All values are -2 if the sketch is empty.  

## Examples

{{< highlight bash >}}
redis> TDIGEST.CREATE s COMPRESSION 1000
OK
redis> TDIGEST.ADD s 10 20 30 40 50 60
OK
redis> TDIGEST.RANK s 0 10 20 30 40 50 60 70
1) (integer) -1
2) (integer) 0
3) (integer) 1
4) (integer) 2
5) (integer) 3
6) (integer) 4
7) (integer) 5
8) (integer) 6
redis> TDIGEST.REVRANK s 0 10 20 30 40 50 60 70
1) (integer) 6
2) (integer) 5
3) (integer) 4
4) (integer) 3
5) (integer) 2
6) (integer) 1
7) (integer) 0
8) (integer) -1
{{< / highlight >}}
  
{{< highlight bash >}}
redis> TDIGEST.CREATE s COMPRESSION 1000
OK
redis> TDIGEST.ADD s 10 10 10 10 20 20
OK
redis> TDIGEST.RANK s 10 20
1) (integer) 2
2) (integer) 5
redis> TDIGEST.REVRANK s 10 20
1) (integer) 4
2) (integer) 1
{{< / highlight >}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported"><nobr>&#x2705; Flexible & Annual</nobr></span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |

## Return information

{{< multitabs id="tdigest-revrank-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:

* [Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [integers]({{< relref "/develop/reference/protocol-spec#integers" >}}) populated with revrank_1, revrank_2, ..., revrank_V:
    * `-1` when `value` is larger than the value of the largest observation.
    * The number of observations when `value` is smaller than the value of the smallest observation.
    * Otherwise, an estimation of the number of (_observations larger than `value`_ + _half the observations equal to `value`_).

    `0` is the reverse rank of the value of the largest observation.

    _n_-1 is the rank of the value of the smallest observation, where _n_ denotes the number of observations added to the sketch.

    All values are `-2` if the sketch is empty.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: the given key does not exist or is of an incorrect type, quantile parsing errors, or incorrect number of arguments.

-tab-sep-

One of the following:

* [Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [integers]({{< relref "/develop/reference/protocol-spec#integers" >}}) populated with revrank_1, revrank_2, ..., revrank_V:
    * `-1` when `value` is larger than the value of the largest observation.
    * The number of observations when `value` is smaller than the value of the smallest observation.
    * Otherwise, an estimation of the number of (_observations larger than `value`_ + _half the observations equal to `value`_).

    `0` is the reverse rank of the value of the largest observation.

    _n_-1 is the rank of the value of the smallest observation, where _n_ denotes the number of observations added to the sketch.

    All values are `-2` if the sketch is empty.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: the given key does not exist or is of an incorrect type, quantile parsing errors, or incorrect number of arguments.

{{< /multitabs >}}