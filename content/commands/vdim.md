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
description: Return the dimension of vectors in the vector set.
group: vector_set
hidden: false
linkTitle: VDIM
since: 8.0.0
summary: Return the dimension of vectors in the vector set.
syntax_fmt: "VDIM key"
title: VDIM
bannerText: Vector set is a new data type that is currently in preview and may be subject to change.
---

Return the number of dimensions of the vectors in the specified vector set.

```shell
VDIM word_embeddings
(integer) 300
```

If the vector set was created using the `REDUCE` option for dimensionality reduction, this command reports the reduced dimension. However, you must still use full-size vectors when performing queries with the `VSIM` command.

## Required arguments

<details open>
<summary><code>key</code></summary>

is the name of the key that holds the vector set.
</details>

## Related topics

- [Vector sets]({{< relref "/develop/data-types/vector-sets" >}})
