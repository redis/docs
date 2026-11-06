---
acl_categories:
- '@topk'
- '@write'
- '@fast'
arguments:
- name: key
  type: key
- name: topk
  type: integer
- arguments:
  - name: width
    type: integer
  - name: depth
    type: integer
  - name: decay
    type: double
  name: params
  optional: true
  type: block
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
compatibility:
  software:
    general: supported
  cloud:
    pro: supported
    essentials: supported
complexity: O(1)
description: Initializes a Top-K sketch with specified parameters
group: topk
hidden: false
linkTitle: TOPK.RESERVE
module: Bloom
railroad_diagram: /images/railroad/topk.reserve.svg
since: 2.0.0
stack_path: docs/data-types/probabilistic
summary: Initializes a TopK with specified parameters
syntax_fmt: TOPK.RESERVE key topk [width depth decay]
title: TOPK.RESERVE
---
Initializes a Top-K sketch with specified parameters.

## Required arguments

<details open><summary><code>key</code></summary>

the name of the Top-k sketch.

</details>

<details open><summary><code>topk</code></summary>

the number of top (k) occurring items to keep.

</details>

## Optional arguments

<details open><summary><code>width</code></summary>

Number of counters kept in each array. (Default 8)

</details>

<details open><summary><code>depth</code></summary>

Number of arrays. (Default 7)

</details>

<details open><summary><code>decay</code></summary>

The probability of reducing a counter in an occupied bucket (decay ^ bucket[i].counter). As the counter gets higher, the likelihood of a reduction is lower. (Default 0.9)

</details>

## Examples

```
redis> TOPK.RESERVE topk 50 2000 7 0.925
OK
```

## Redis Software and Redis Cloud compatibility

{{< command-compatibility >}}

## Return information

{{< multitabs id="topk-reserve-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:

* [Simple string reply](/content/develop/reference/protocol-spec.md#simple-strings) `OK` if executed correctly.
* [Simple error reply](/content/develop/reference/protocol-spec.md#simple-errors) in these cases: incorrect number of arguments, invalid decay value, or key already exists.

-tab-sep-

One of the following:

* [Simple string reply](/content/develop/reference/protocol-spec.md#simple-strings) `OK` if executed correctly.
* [Simple error reply](/content/develop/reference/protocol-spec.md#simple-errors) in these cases: incorrect number of arguments, invalid decay value, or key already exists.

{{< /multitabs >}}