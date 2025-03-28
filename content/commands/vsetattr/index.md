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
description: Associate or remove the JSON attributes of elements.
group: vector_set
hidden: false
linkTitle: VSETATTR
since: 8.0.0
summary: Associate or remove the JSON attributes of elements.
syntax_fmt: "VSETATTR key element \"{ JSON obj }\""
title: VSETATTR
---

Associate a JSON object with an element in a vector set. Use this command to store attributes that can be used in filtered similarity searches with `VSIM`.

You can also update existing attributes or delete them by setting an empty string.

```shell
VSETATTR key element "{\"type\": \"fruit\", \"color\": \"red\"}"
```

To remove attributes, pass an empty JSON string:

```shell
VSETATTR key element ""
```

## Required arguments

<details open>
<summary><code>key</code></summary>

is the name of the key that holds the vector set.
</details>

<details open>
<summary><code>element</code></summary>

is the name of the element whose attributes you want to set or remove.
</details>

<details open>
<summary><code>json</code></summary>

is a valid JSON string. Use an empty string (`""`) to delete the attributes.
</details>

## Related topics

- [Vector sets]({{< relref "/develop/data-types/vector-sets" >}})
