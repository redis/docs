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

## Return information

{{< multitabs id="vcard-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): 0 if the key doesn't exist or the number of elements contained in the vector set.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): 0 if the key doesn't exist or the number of elements contained in the vector set.

{{< /multitabs >}}
