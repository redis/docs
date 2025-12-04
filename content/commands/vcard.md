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
description: Return the number of elements in a vector set.
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
linkTitle: VCARD
module: vectorset
railroad_diagram: /images/railroad/vcard.svg
since: 8.0.0
summary: Return the number of elements in a vector set
syntax_fmt: VCARD key
syntax_str: ''
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

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="vcard-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): 0 if the key doesn't exist or the number of elements contained in the vector set.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): 0 if the key doesn't exist or the number of elements contained in the vector set.

{{< /multitabs >}}
