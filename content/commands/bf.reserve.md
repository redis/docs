---
acl_categories:
- '@bloom'
- '@write'
- '@fast'
arguments:
- name: key
  type: key
- name: error_rate
  type: double
- name: capacity
  type: integer
- name: expansion
  optional: true
  token: EXPANSION
  type: integer
- name: nonscaling
  optional: true
  token: NONSCALING
  type: pure-token
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- kubernetes
- clients
complexity: O(1)
description: Creates a new Bloom Filter
group: bf
hidden: false
linkTitle: BF.RESERVE
module: Bloom
since: 1.0.0
stack_path: docs/data-types/probabilistic
summary: Creates a new Bloom Filter
syntax_fmt: "BF.RESERVE key error_rate capacity [EXPANSION\_expansion]
  [NONSCALING]"
syntax_str: "error_rate capacity [EXPANSION\_expansion] [NONSCALING]"
title: BF.RESERVE
---
Creates an empty Bloom filter with a single sub-filter for the initial specified capacity and with an upper bound `error_rate`.

By default, the filter auto-scales by creating additional sub-filters when `capacity` is reached.
The new sub-filter is created with size of the previous sub-filter multiplied by `expansion`.

Though the filter can scale up by creating sub-filters, it is recommended to reserve the estimated required `capacity` since maintaining and querying
sub-filters requires additional memory (each sub-filter uses an extra bits and hash function) and consume  further CPU time than an equivalent filter that had
the right capacity at creation time.

The optimal number of hash functions is `ceil(-ln(error_rate) / ln(2))`.

The required number of bits per item, given the desired `error_rate` and the optimal number of hash functions, is `-ln(error_rate) / ln(2)^2`. Hence, the required number of bits in the filter is `capacity * -ln(error_rate) / ln(2)^2`.

* **1%**    error rate requires  7 hash functions and  9.585 bits per item.
* **0.1%**  error rate requires 10 hash functions and 14.378 bits per item.
* **0.01%** error rate requires 14 hash functions and 19.170 bits per item.

## Required arguments

<details open><summary><code>key</code></summary>

is key name for the the Bloom filter to be created.
</details>

<details open><summary><code>error_rate</code></summary>

The desired probability for false positives. The rate is a decimal value between 0 and 1.
For example, for a desired false positive rate of 0.1% (1 in 1000), error_rate should be set to 0.001.
</details>

<details open><summary><code>capacity</code></summary>

The number of entries intended to be added to the filter.
If your filter allows scaling, performance will begin to degrade after adding more items than this number.
The actual degradation depends on how far the limit has been exceeded. Performance degrades linearly with the number of `sub-filters`.
</details>

## Optional arguments

<details open><summary><code>NONSCALING</code></summary>

Prevents the filter from creating additional sub-filters if initial capacity is reached.
Non-scaling filters requires slightly less memory than their scaling counterparts. The filter returns an error when `capacity` is reached.
</details>

<details open><summary><code>EXPANSION expansion</code></summary>

When `capacity` is reached, an additional sub-filter is created.
The size of the new sub-filter is the size of the last sub-filter multiplied by `expansion`, specified as a positive integer.

If the number of items to be stored in the filter is unknown, you use an `expansion` of `2` or more to reduce the number of sub-filters.
Otherwise, you use an `expansion` of `1` to reduce memory consumption. The default value is `2`.
</details>

## Examples

{{< highlight bash >}}
redis> BF.RESERVE bf 0.01 1000
OK
{{< / highlight >}}

{{< highlight bash >}}
redis> BF.RESERVE bf 0.01 1000
(error) ERR item exists
{{< / highlight >}}

{{< highlight bash >}}
redis> BF.RESERVE bf_exp 0.01 1000 EXPANSION 2
OK
{{< / highlight >}}

{{< highlight bash >}}
redis> BF.RESERVE bf_non 0.01 1000 NONSCALING
OK
{{< / highlight >}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

{{< multitabs id="bf-reserve-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}): `OK` if the filter was created successfully.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid arguments or the key already exists.

-tab-sep-

One of the following:
* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}): `OK` if the filter was created successfully.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid arguments or the key already exists.

{{< /multitabs >}}