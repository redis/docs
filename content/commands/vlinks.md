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
description: Return the neighbors of an element at each layer in the HNSW graph.
group: vector_set
hidden: false
linkTitle: VLINKS
since: 8.0.0
summary: Return the neighbors of an element at each layer in the HNSW graph.
syntax_fmt: "VLINKS key element [WITHSCORES]"
title: VLINKS
---

Return the neighbors of a specified element in a vector set. The command shows the connections for each layer of the HNSW graph.

```shell
VLINKS key element
```

Use the `WITHSCORES` option to include similarity scores for each neighbor.

```shell
VLINKS key element WITHSCORES
```

## Required arguments

<details open>
<summary><code>key</code></summary>

is the name of the key that holds the vector set.
</details>

<details open>
<summary><code>element</code></summary>

is the name of the element whose HNSW neighbors you want to inspect.
</details>

## Optional arguments

<details open>
<summary><code>WITHSCORES</code></summary>

includes similarity scores for each neighbor.
</details>

## Related topics

- [Vector sets]({{< relref "/develop/data-types/vector-sets" >}})

## Return information

{{< multitabs id="vlinks-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* An [array](../../develop/reference/protocol-spec#arrays) of [array replies](../../develop/reference/protocol-spec#arrays) containing the names of adjacent elements as [bulk strings](../../develop/reference/protocol-spec#bulk-strings); interleaved with scores as [bulk strings](../../develop/reference/protocol-spec#bulk-strings) when used with the `WITHSCORES` option.
* [Simple error reply](../../develop/reference/protocol-spec/#simple-errors) for incorrect syntax.
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings) (null bulk string) for unknown keys and/or elements.

-tab-sep-

One of the following:
* An [array](../../develop/reference/protocol-spec#arrays) of [array replies](../../develop/reference/protocol-spec#arrays) containing the names of adjacent elements as [bulk strings](../../develop/reference/protocol-spec#bulk-strings) when used without the `WITHSCORES` option.
* An [array](../../develop/reference/protocol-spec#arrays) of [map replies](../../develop/reference/protocol-spec#maps) containing the names of adjecent elements as [bulk strings](../../develop/reference/protocol-spec#bulk-strings), together with their scores as [doubles](../../develop/reference/protocol-spec#doubles) when used with the `WITHSCORES` option.
* [Simple error reply](../../develop/reference/protocol-spec/#simple-errors) for incorrect syntax.
* [Null reply](../../develop/reference/protocol-spec#nulls) for unknown keys and/or elements.

{{< /multitabs >}}
