---
acl_categories:
- '@bloom'
- '@read'
- '@fast'
arguments:
- name: key
  type: key
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
description: Returns the cardinality of a Bloom filter
group: bf
hidden: false
linkTitle: BF.CARD
module: Bloom
railroad_diagram: /images/railroad/bf.card.svg
since: 2.4.4
stack_path: docs/data-types/probabilistic
summary: Returns the cardinality of a Bloom filter
syntax_fmt: BF.CARD key
syntax_str: ''
title: BF.CARD
---
Returns the cardinality of a Bloom filter - number of items that were added to a Bloom filter and detected as unique (items that caused at least one bit to be set in at least one sub-filter)

(since RedisBloom 2.4.4)

## Required arguments

<details open><summary><code>key</code></summary>

is key name for a Bloom filter.

</details>

## Examples

{{< highlight bash >}}
redis> BF.ADD bf1 item_foo
(integer) 1
redis> BF.CARD bf1
(integer) 1
redis> BF.CARD bf_new
(integer) 0
{{< / highlight >}}

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported"><nobr>&#x2705; Flexible & Annual</nobr></span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |

## Return information

{{< multitabs id="bf-card-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): the number of items detected as unique that were added to the Bloom filter (items that caused at least one bit to be set in at least one sub-filter), or `0` when the given `key` does not exist.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid arguments, wrong key type, or when the filter is full.

Note: when `key` exists, `BF.CARD` returns the same value as `BF.INFO key ITEMS`.

-tab-sep-

One of the following:
* [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): the number of items detected as unique that were added to the Bloom filter (items that caused at least one bit to be set in at least one sub-filter), or `0` when the given `key` does not exist.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid arguments, wrong key type, or when the filter is full.

Note: when `key` exists, `BF.CARD` returns the same value as `BF.INFO key ITEMS`.
{{< /multitabs >}}