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
description: Return the dimension of vectors in the vector set.
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
linkTitle: VDIM
module: vectorset
railroad_diagram: /images/railroad/vdim.svg
since: 8.0.0
summary: Return the dimension of vectors in the vector set
syntax_fmt: VDIM key
syntax_str: ''
title: VDIM
---

Return the number of dimensions of the vectors in the specified vector set.

```shell
VDIM word_embeddings
(integer) 300
```

If the vector set was created using the `REDUCE` option for dimensionality reduction, this command reports the reduced dimension. However, you must still use full-size vectors when performing queries with the `VSIM` command.

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

{{< multitabs id="vdim-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Integer reply](../../develop/reference/protocol-spec#integers): the number of vector set elements.
* [Simple error reply](../../develop/reference/protocol-spec#simple-errors): if the key does not exist.

-tab-sep-

One of the following:
* [Integer reply](../../develop/reference/protocol-spec#integers): the number of vector set elements.
* [Simple error reply](../../develop/reference/protocol-spec#simple-errors): if the key does not exist.

{{< /multitabs >}}
