---
acl_categories:
- ARRAY
arguments:
- key_spec_index: 0
  name: key
  type: key
- multiple: true
  name: index
  type: integer
arity: -3
bannerText: Array is a new data type that is currently in preview and may be subject to change.
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
- READONLY
- FAST
complexity: O(N) where N is the number of indices
description: Gets values at multiple indices in an array.
function: armgetCommand
group: array
hidden: false
key_specs:
- begin_search:
    index:
      pos: 1
  find_keys:
    range:
      lastkey: 0
      limit: 0
      step: 1
  flags:
  - RO
  - ACCESS
linkTitle: ARMGET
reply_schema:
  items:
    oneOf:
    - type: string
    - type: 'null'
  type: array
since: 8.8.0
summary: Gets values at multiple indices in an array.
syntax_fmt: ARMGET key index [index ...]
title: ARMGET
---
Gets values at multiple indices in an array.

## Required arguments

<details open><summary><code>key</code></summary>

The name of the key that holds the array.

</details>

<details open><summary><code>index</code></summary>

One or more zero-based integer indices of the elements to retrieve. The reply preserves the order of the requested indices and returns nil for any index that is not set.

</details>

## Examples

{{% redis-cli %}}
ARMSET myarray 0 "a" 1 "b" 5 "c"
ARMGET myarray 0 1 5 3
{{% /redis-cli %}}

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays)

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays)

{{< /multitabs >}}
