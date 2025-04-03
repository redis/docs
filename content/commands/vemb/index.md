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
since: 8.0.0
summary: Return the vector associated with an element.
syntax_fmt: "VEMB key element [RAW]"
title: VEMB
bannerText: Vector set is a new data type that is currently in preview and may be subject to change.
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
