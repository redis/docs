---
acl_categories:
- '@tdigest'
- '@write'
- '@slow'
arguments:
- name: destination-key
  type: key
- name: numkeys
  type: integer
- multiple: true
  name: source-key
  type: key
- arguments:
  - name: compression
    token: COMPRESSION
    type: pure-token
  - name: compression
    type: integer
  name: config
  optional: true
  type: block
- name: override
  optional: true
  token: OVERRIDE
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
complexity: O(N*K), where N is the number of centroids and K being the number of input
  sketches
description: Merges multiple t-digest sketches into a single sketch
group: tdigest
hidden: false
linkTitle: TDIGEST.MERGE
module: Bloom
since: 2.4.0
stack_path: docs/data-types/probabilistic
summary: Merges multiple t-digest sketches into a single sketch
syntax_fmt: "TDIGEST.MERGE destination-key numkeys source-key [source-key ...]
 \
  \ [COMPRESSION compression] [OVERRIDE]"
syntax_str: numkeys source-key [source-key ...] [COMPRESSION compression] [OVERRIDE]
title: TDIGEST.MERGE
---
Merges multiple t-digest sketches into a single sketch.

## Required arguments
<details open><summary><code>destination-key</code></summary>

is the key name for a t-digest sketch to merge observation values to.

If `destination-key` does not exist, a new sketch is created.

If `destination-key` is an existing sketch, its values are merged with the values of the source keys. To override the destination key contents use `OVERRIDE`.
</details>

<details open><summary><code>numkeys</code></summary>

the number of sketches from which to merge observation values (one or more).
</details>

<details open><summary><code>source-key</code></summary>

Each `source-key` is a key name for a t-digest sketch from which to merge observation values.
</details>

## Optional arguments

<details open><summary><code>COMPRESSION compression</code></summary>
  
is a controllable tradeoff between accuracy and memory consumption. 100 is a common value for normal uses and also the default if not specified. 1000 is more accurate. For more information on scaling of accuracy versus the compression value see [_The t-digest: Efficient estimates of distributions_](https://www.sciencedirect.com/science/article/pii/S2665963820300403).
  
When `COMPRESSION` is not specified:
- If `destination-key` does not exist or if `OVERRIDE` is specified, the compression is set to the maximum value among all source sketches.
- If `destination-key` already exists and `OVERRIDE` is not specified, its compression is not changed.

</details>

<details open><summary><code>OVERRIDE</code></summary>

If `destination-key` already exists and `OVERRIDE` is specified, the key is overwritten.
</details>

## Examples
{{< highlight bash >}}
redis> TDIGEST.CREATE s1
OK
redis> TDIGEST.CREATE s2
OK
redis> TDIGEST.ADD s1 10.0 20.0
OK
redis> TDIGEST.ADD s2 30.0 40.0
OK
redis> TDIGEST.MERGE sM 2 s1 s2
OK
redis> TDIGEST.BYRANK sM 0 1 2 3 4
1) "10"
2) "20"
3) "30"
4) "40"
5) "inf"
{{< / highlight >}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

{{< multitabs id="tdigest-merge-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:

* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) `OK` if successful.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in the following cases: incorrect key type, incorrect keyword, or incorrect number of arguments.

-tab-sep-

One of the following:

* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) `OK` if successful.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in the following cases: incorrect key type, incorrect keyword, or incorrect number of arguments.

{{< /multitabs >}}