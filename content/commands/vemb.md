---
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
description: Return the vector associated with an element.
group: vector_set
hidden: false
linkTitle: VEMB
railroad_diagram: /images/railroad/vemb.svg
since: 8.0.0
summary: Return the vector associated with an element.
syntax_fmt: "VEMB key element [RAW]"
title: VEMB
---

Return the approximate vector associated with a given element in the vector set.

```shell
VEMB word_embeddings SQL
1) "0.18208661675453186"
2) "0.08535309880971909"
3) "0.1365649551153183"
4) "-0.16501599550247192"
5) "0.14225517213344574"
... 295 more elements ...
```

Vector sets normalize and may quantize vectors on insertion. `VEMB` reverses this process to approximate the original vector by de-normalizing and de-quantizing it.

To retrieve the raw internal representation, use the `RAW` option:

```shell
VEMB word_embeddings apple RAW
1) int8
2) "\xf1\xdc\xfd\x1e\xcc%E...\xde\x1f\xfbN" # artificially shortened for this example
3) "3.1426539421081543"
4) "0.17898885905742645"
```

## Required arguments

<details open>
<summary><code>key</code></summary>

is the name of the key that holds the vector set.
</details>

<details open>
<summary><code>element</code></summary>

is the name of the element whose vector you want to retrieve.
</details>

## Optional arguments

<details open>
<summary><code>RAW</code></summary>

returns the raw vector data, its quantization type, and metadata such as norm and range.
</details>

## Related topics

- [Vector sets]({{< relref "/develop/data-types/vector-sets" >}})

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="vemb-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Array reply](../../develop/reference/protocol-spec#arrays): of real numbers as [bulk strings](../../develop/reference/protocol-spec#bulk-strings), representing the vector.
* [Array reply](../../develop/reference/protocol-spec#arrays): consisting of the following elements:
    1. The quantization type as a [simple string](../../develop/reference/protocol-spec#simple-strings): `fp32`, `bin`, or `q8`.
    1. A [bulk string](../../develop/reference/protocol-spec#bulk-strings) blob with the following raw data:
        * 4-byte floats for fp32 (little-endian encoding)
        * A bitmap for binary quantization
        * A byte array for q8
    1. The L2 norm, as a [simple string](../../develop/reference/protocol-spec#simple-strings), of the vector before normalization.
    1. (Only for q8): The quantization range as a [simple string](../../develop/reference/protocol-spec#simple-strings). Multiply this by integer components to recover normalized values.

-tab-sep-

One of the following:
* [Array reply](../../develop/reference/protocol-spec#arrays): of [doubles](../../develop/reference/protocol-spec#doubles), representing the vector.
* [Array reply](../../develop/reference/protocol-spec#arrays): consisting of the following elements:
    1. The quantization type as a [simple string](../../develop/reference/protocol-spec#simple-strings): `fp32`, `bin`, or `q8`.
    1. A [bulk string](../../develop/reference/protocol-spec#bulk-strings) blob with the following raw data:
        * 4-byte floats for fp32 (little-endian encoding)
        * A bitmap for binary quantization
        * A byte array for q8
    1. The [double](../../develop/reference/protocol-spec#doubles) L2 norm of the vector before normalization.
    1. (Only for q8): The quantization range as a [double](../../develop/reference/protocol-spec#doubles). Multiply this by integer components to recover normalized values.

{{< /multitabs >}}
