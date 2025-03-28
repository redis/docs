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
description: Return the number of elements in a vector set.
group: vector_set
hidden: false
linkTitle: VCARD
since: 8.0.0
summary: Return the number of elements in a vector set.
syntax_fmt: "VCARD key"
title: VCARD
---

Return the number of elements in the specified vector set.

```shell
VCARD word_embeddings
(integer) 3000000
```

## Required arguments

<details open>
<summary><code>key</code></summary>

is the name of the key that holds the vector set.
</details>

## Related topics

- [Vector sets]({{< relref "/develop/data-types/vector-sets" >}})
