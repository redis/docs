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
complexity: O(log(N)) for each element added, where N is the number of elements in the vector set.
description: Add a new element to a vector set, or update its vector if it already exists.
group: vector_set
hidden: false
linkTitle: VADD
since: 8.0.0
summary: Add a new element to a vector set, or update its vector if it already exists.
syntax_fmt: "VADD key [REDUCE dim] (FP32 | VALUES num) vector element [CAS] [NOQUANT | Q8 | BIN]\n  [EF build-exploration-factor] [SETATTR attributes] [M numlinks]"
title: VADD
---

Add a new element into the vector set specified by `key`. The vector can be provided as 32-bit floating point (`FP32`) blob of values, or as floating point numbers as strings, prefixed by the number of elements (3 in the example below):

```
VADD mykey VALUES 3 0.1 1.2 0.5 my-element
```

## Required arguments

<details open>
<summary><code>key</code></summary>

is the name of the key that will hold the vector set data.
</details>

<details open>
<summary><code>FP32 vector or VALUES num vector</code></summary>

either a 32-bit floating point (FP32) blob of values or `num` floating point numbers as strings. When using the FP32 format, the blob must use little-endian encoding. On platforms with different endianness, you should either manually adjust the byte order or use the VALUES syntax instead.
</details>

<details open>
<summary><code>element</code></summary>

is the name of the element that is being added to the vector set.
</details>

## Optional arguments

<details open>
<summary><code>REDUCE dim</code></summary>

implements random projection to reduce the dimensionality of the vector. The projection matrix is saved and reloaded along with the vector set. Please note that the REDUCE option must be passed immediately before the vector. For example,

```
VADD mykey REDUCE 50 VALUES ...
```
</details>

<details open>
<summary><code>CAS</code></summary>

performs the operation partially using threads, in a check-and-set style. The neighbor candidates collection, which is slow, is performed in the background, while the command is executed in the main thread.
</details>

<details open>
<summary><code>NOQUANT</code></summary>

in the first VADD call for a given key, NOQUANT forces the vector to be created without int8 quantization, which is otherwise the default.
</details>

<details open>
<summary><code>BIN</code></summary>

forces the vector to use binary quantization instead of int8. This is much faster and uses less memory, but impacts the recall quality.
</details>

<details open>
<summary><code>Q8</code></summary>

forces the vector to use signed 8-bit quantization. This is the default, and the option only exists to make sure to check at insertion time that the vector set is of the same format.
</details>

{{< note >}}
`NOQUANT`, `Q8`, and `BIN` are mutually exclusive.

{{< /note >}}

<details open>
<summary><code>EF build-exploration-factor</code></summary>

plays a role in the effort made to find good candidates when connecting the new node to the existing Hierarchical Navigable Small World (HNSW) graph. The default is 200. Using a larger value may help in achieving a better recall. To improve the recall it is also possible to increase EF during VSIM searches.
</details>

<details open>
<summary><code>SETATTR attributes</code></summary>

associates attributes in the form of a JavaScript object to the newly created entry or updates the attributes (if they already exist).
It is the same as calling the VSETATTR command separately.
</details>

<details open>
<summary><code>M numlinks</code></summary>

is the maximum number of connections that each node of the graph will have with other nodes. The default is 16. More connections means more memory, but provides for more efficient graph exploration. Nodes at layer zero (every node exists at least at layer zero) have `M * 2` connections, while the other layers only have `M` connections. For example, setting `M` to `64` will use at least 1024 bytes of memory for layer zero. That's `M * 2` connections times 8 bytes (pointers), or `128 * 8 = 1024`. For higher layers, consider the following:

- Each node appears in ~1.33 layers on average (empirical observation from HNSW papers), which works out to be 0.33 higher layers per node.
- Each of those higher layers has `M = 64` connections.

So, the additional amount of memory is approximately `0.33 × 64 × 8 ≈ 169.6` bytes per node, bringing the total memory to ~1193 bytes.

If you don't have a recall quality problem, the default is acceptable, and uses a minimal amount of memory.
</details>

## Related topics

- [Vector sets]({{< relref "/develop/data-types/vector-sets" >}})

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="vadd-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Integer reply](../../develop/reference/protocol-spec#integers): 1 if key was added; 0 if key was not added.
* [Simple error reply](../../develop/reference/protocol-spec#simple-errors): if the command was malformed.

-tab-sep-

One of the following:
* [Boolean reply](../../develop/reference/protocol-spec#booleans): true if key was added; false if key was not added.
* [Simple error reply](../../develop/reference/protocol-spec#simple-errors): if the command was malformed.

{{< /multitabs >}}
