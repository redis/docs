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
bannerText: Vector set is a new data type that is currently in preview and may be subject to change.
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

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="vsetattr-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Integer reply](../../develop/reference/protocol-spec#integers): 0 if either the key or element does not exist; 1 if the attributes were successfully added to the element.
* [Simple error reply](../../develop/reference/protocol-spec/#simple-errors) for improperly specified attribute string.

-tab-sep-

One of the following:
* [Boolean reply](../../develop/reference/protocol-spec#booleans): false if either the key or element does not exist; true if the attributes were successfully added to the element.
* [Simple error reply](../../develop/reference/protocol-spec/#simple-errors) for improperly specified attribute string.

{{< /multitabs >}}
