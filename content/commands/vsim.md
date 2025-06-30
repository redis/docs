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
complexity: O(log(N)) where N is the number of elements in the vector set.
description: Return elements by vector similarity.
group: vector_set
hidden: false
history:
- - 8.2.0
  - added the WITHATTRIBS option.
linkTitle: VSIM
since: 8.0.0
summary: Return elements by vector similarity.
syntax_fmt: "VSIM key (ELE | FP32 | VALUES num) (vector | element) [WITHSCORES] [WITHATTRIBS] [COUNT num]\n  [EF search-exploration-factor] [FILTER expression] [FILTER-EF max-filtering-effort] [TRUTH] [NOTHREAD]"
title: VSIM
bannerText: Vector set is a new data type that is currently in preview and may be subject to change.
---

Return elements similar to a given vector or element. Use this command to perform approximate or exact similarity searches within a vector set.

You can query using either a vector (via `FP32` or `VALUES num`) or by referencing another element (using `ELE`). Optional parameters let you control the search behavior, such as score output, result count, and filtering options.

```shell
VSIM word_embeddings ELE apple
1) "apple"
2) "apples"
3) "pear"
4) "fruit"
5) "berry"
6) "pears"
7) "strawberry"
8) "peach"
9) "potato"
10) "grape"
```

You can include similarity scores, attributes (if any), and limit the number of results:

```shell
VSIM word_embeddings ELE apple WITHSCORES WITHATTRIBS COUNT 3
1) "apple"
2) "0.9998867657923256"
3) "{\"len\": 5}"
4) "apples"
5) "0.859852746129036"
6) "{\"len\": 6}"
7) "pear"
8) "0.8226882070302963"
9) "{\"len\": 4}"
```

Set the `EF` (exploration factor) to improve recall at the cost of performance. Use the `TRUTH` option to perform an exact linear scan, useful for benchmarking. The `NOTHREAD` option runs the search in the main thread and may increase server latency.

## Required arguments

<details open>
<summary><code>key</code></summary>

is the name of the key that holds the vector set data.
</details>

<details open>
<summary><code>ELE | FP32 | VALUES num</code></summary>

specifies how the input vector is provided. Use `ELE` to refer to an existing element, `FP32` for binary float format, or `VALUES num` for a list of stringified float values.
</details>

<details open>
<summary><code>vector or element</code></summary>

is either the vector data (for `FP32` or `VALUES`) or the name of the element (for `ELE`) to use as the similarity reference.
</details>

## Optional arguments

<details open>
<summary><code>WITHSCORES</code></summary>

returns the similarity score (from 1 to 0) alongside each result. A score of 1 is identical; 0 is the opposite.
</details>

<details open>
<summary><code>WITHATTRIBS</code></summary>

returns, for each element, the JSON attribute associated with the element or NULL when no attributes are present.
</details>

<details open>
<summary><code>COUNT num</code></summary>

limits the number of returned results to `num`.
</details>

<details open>
<summary><code>EF search-exploration-factor</code></summary>

controls the search effort. Higher values explore more nodes, improving recall at the cost of speed. Typical values range from 50 to 1000.
</details>

<details open>
<summary><code>FILTER expression</code></summary>

applies a filter expression to restrict matching elements. See the filtered search section for syntax details.
</details>

<details open>
<summary><code>FILTER-EF max-filtering-effort</code></summary>

limits the number of filtering attempts for the `FILTER` expression. See the filtered search section for more.
</details>

<details open>
<summary><code>TRUTH</code></summary>

forces an exact linear scan of all elements, bypassing the HNSW graph. Use for benchmarking or to calculate recall. This is significantly slower (O(N)).
</details>

<details open>
<summary><code>NOTHREAD</code></summary>

executes the search in the main thread instead of a background thread. Useful for small vector sets or benchmarks. This may block the server during execution.
</details>

## Related topics

- [Vector sets]({{< relref "/develop/data-types/vector-sets" >}})

## Return information

{{< multitabs id="vsim-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Simple error reply](../../develop/reference/protocol-spec/#simple-errors) for an unknown element.
* [Array reply](../../develop/reference/protocol-spec#arrays) (empty array) for an unknown key.
* [Array reply](../../develop/reference/protocol-spec#arrays) with matching elements.
* With the `WITHSCORES` option, an [array reply](../../develop/reference/protocol-spec#arrays) with matching [bulk string]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) elements juxtaposed with [bulk string]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) as floating-point scores.
* With the `WITHSCORES` and `WITHATTRIBS` options, an [array reply](../../develop/reference/protocol-spec#arrays) with matching [bulk string]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) elements, and two additional elements: (1) a [bulk string]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) as floating-point score and (2) a [bulk string]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) representing the JSON attribute associated with the element or [nil (null bulk string)]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) for the elements missing an attribute.

-tab-sep-

One of the following:
* [Simple error reply](../../develop/reference/protocol-spec/#simple-errors) for unknown element.
* [Array reply](../../develop/reference/protocol-spec#arrays) (empty array) for unknown key.
* [Array reply](../../develop/reference/protocol-spec#arrays) with matching elements.
* With the `WITHSCORES` option, a [map reply](../../develop/reference/protocol-spec#maps) with matching [bulk string]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) elements (keys) and  [double](../../develop/reference/protocol-spec#doubles) scores (values).
* With the `WITHSCORES` and `WITHATTRIBS` options, a [Map reply](../../develop/reference/protocol-spec#maps) with matching [bulk string]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) elements (keys), and an additional array (values) with the following elements: (1) a [double reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}})  for the score and (2) a [bulk string]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) representing the JSON attribute associated with the element or [null]({{< relref "/develop/reference/protocol-spec#nulls" >}}) for the elements missing an attribute.

{{< /multitabs >}}
