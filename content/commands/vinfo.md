---
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
arity: 2
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
command_flags:
- readonly
- module
- fast
complexity: O(1)
description: Return information about a vector set.
group: module
hidden: false
key_specs:
- RW: true
  access: true
  begin_search:
    spec:
      index: 1
    type: index
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
  update: true
linkTitle: VINFO
module: vectorset
railroad_diagram: /images/railroad/vinfo.svg
since: 8.0.0
summary: Return information about a vector set
syntax_fmt: VINFO key
syntax_str: ''
title: VINFO
---

Return metadata and internal details about a vector set, including size, dimensions, quantization type, and graph structure.

```shell
VINFO word_embeddings
1) quant-type
2) int8
3) vector-dim
4) (integer) 300
5) size
6) (integer) 3000000
7) max-level
8) (integer) 12
9) vset-uid
10) (integer) 1
11) hnsw-max-node-uid
12) (integer) 3000000
```

## Required arguments

<details open>
<summary><code>key</code></summary>

is the name of the key that holds the vector set.
</details>

## Related topics

- [Vector sets]({{< relref "/develop/data-types/vector-sets" >}})

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="vinfo-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Array reply](../../develop/reference/protocol-spec#arrays) containing metadata and internal details about a vector set, including size, dimensions, quantization type, and graph structure.
* [Array reply](../../develop/reference/protocol-spec#arrays) (null array reply) for unknown key.

-tab-sep-

One of the following:
* [Array reply](../../develop/reference/protocol-spec#arrays) containing metadata and internal details about a vector set, including size, dimensions, quantization type, and graph structure.
* [Null reply](../../develop/reference/protocol-spec#nulls) for unknown key.

{{< /multitabs >}}
