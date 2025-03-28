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
description: Retrieve the JSON attributes of elements.
group: vector_set
hidden: false
linkTitle: VGETATTR
since: 8.0.0
summary: Retrieve the JSON attributes of elements.
syntax_fmt: "VGETATTR key element"
title: VGETATTR
---

Return the JSON attributes associated with an element in a vector set.

```shell
VGETATTR key element
```

## Required arguments

<details open>
<summary><code>key</code></summary>

is the name of the key that holds the vector set.
</details>

<details open>
<summary><code>element</code></summary>

is the name of the element whose attributes you want to retrieve.
</details>

## Related topics

- [Vector sets]({{< relref "/develop/data-types/vector-sets" >}})
