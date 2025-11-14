---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- kubernetes
- clients
complexity: O(N) where N is the absolute value of the count argument.
description: Return one or multiple random members from a vector set.
group: vector_set
hidden: false
linkTitle: VRANDMEMBER
since: 8.0.0
summary: Return one or multiple random members from a vector set.
syntax_fmt: VRANDMEMBER key [count]
title: VRANDMEMBER
bannerText: Vector set is a new data type that is currently in preview and may be
  subject to change.
---

Return one or more random elements from a vector set.

The behavior is similar to the `SRANDMEMBER` command:

- When called without a count, returns a single element as a bulk string.
- When called with a positive count, returns up to that many distinct elements (no duplicates).
- When called with a negative count, returns that many elements, possibly with duplicates.
- If the count exceeds the number of elements, the entire set is returned.
- If the key does not exist, the command returns `null` if no count is given, or an empty array if a count is provided.

```shell
VADD vset VALUES 3 1 0 0 elem1
VADD vset VALUES 3 0 1 0 elem2
VADD vset VALUES 3 0 0 1 elem3
```

Return a single random element:

```shell
VRANDMEMBER vset
"elem2"
```

Return two distinct random elements:

```shell
VRANDMEMBER vset 2
1) "elem1"
2) "elem3"
```

Return 3 random elements with possible duplicates:

```shell
VRANDMEMBER vset -3
1) "elem2"
2) "elem2"
3) "elem1"
```

Request more elements than exist in the set:

```shell
VRANDMEMBER vset 10
1) "elem1"
2) "elem2"
3) "elem3"
```

When the key doesn't exist:

```shell
VRANDMEMBER nonexistent
(nil)
```

```shell
VRANDMEMBER nonexistent 3
(empty array)
```

This command is useful for:

- Sampling elements for testing or training.
- Generating random queries for performance testing.

Internally:

- For small counts (less than 20% of the set size), a dictionary is used to ensure uniqueness.
- For large counts (more than 20% of the set size), a linear scan provides faster performance, though results may be less random.

## Required arguments

<details open>
<summary><code>key</code></summary>

is the name of the key that holds the vector set.
</details>

## Optional arguments

<details open>
<summary><code>count</code></summary>

specifies the number of elements to return. Positive values return distinct elements; negative values allow duplicates.
</details>

## Related topics

- [Vector sets]({{< relref "/develop/data-types/vector-sets" >}})

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="vrandmember-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Array reply](../../develop/reference/protocol-spec#arrays) containing the names of count random elements as [strings](../../develop/reference/protocol-spec#simple-strings).
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings) (null bulk string) for unknown keys.
* [Array reply](../../develop/reference/protocol-spec#arrays) (empty array) for unknown keys when a count is specified.

-tab-sep-

One of the following:
* [Array reply](../../develop/reference/protocol-spec#arrays) containing the names of *count* random elements as [strings](../../develop/reference/protocol-spec#simple-strings).
* [Null reply](../../develop/reference/protocol-spec#nulls) for unknown keys.
* [Array reply](../../develop/reference/protocol-spec#arrays) (empty array) for unknown keys when a count is specified.

{{< /multitabs >}}
