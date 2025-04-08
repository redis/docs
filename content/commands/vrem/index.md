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
complexity: O(log(N)) for each element removed, where N is the number of elements in the vector set.
description: Remove one or more elements from a vector set.
group: vector_set
hidden: false
linkTitle: VREM
since: 8.0.0
summary: Remove one or more elements from a vector set.
syntax_fmt: "VREM key element"
title: VREM
bannerText: Vector set is a new data type that is currently in preview and may be subject to change.
---

Remove an element from a vector set.

```shell
VADD vset VALUES 3 1 0 1 bar
(integer) 1
```

```shell
VREM vset bar
(integer) 1
```

```shell
VREM vset bar
(integer) 0
```

`VREM` reclaims memory immediately. It does not use tombstones or logical deletions, making it safe to use in long-running applications that frequently update the same vector set.

## Required arguments

<details open>
<summary><code>key</code></summary>

is the name of the key that holds the vector set.
</details>

<details open>
<summary><code>element</code></summary>

is the name of the element to remove from the vector set.
</details>

## Related topics

- [Vector sets]({{< relref "/develop/data-types/vector-sets" >}})
