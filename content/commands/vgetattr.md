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
bannerText: Vector set is a new data type that is currently in preview and may be subject to change.
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

## Return information

{{< multitabs id="vgetattr-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Simple string reply](../../develop/reference/protocol-spec#simple-strings) containing the JSON attribute(s).
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings) (null bulk string) for unknown key or element, or when no attributes exist for the given key/element pair.

-tab-sep-

One of the following:
* [Simple string reply](../../develop/reference/protocol-spec#simple-strings) containing the JSON attribute(s).
* [Null reply](../../develop/reference/protocol-spec#nulls) for unknown key or element, or when no attributes exist for the given key/element pair.

{{< /multitabs >}}
