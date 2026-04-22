---
acl_categories:
- ARRAY
arguments:
- key_spec_index: 0
  name: key
  type: key
- arguments:
  - name: index
    type: integer
  - name: value
    type: string
  multiple: true
  name: data
  type: block
arity: -4
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
- WRITE
- DENYOOM
- FAST
complexity: O(N) where N is the number of pairs
description: Sets multiple index-value pairs in an array.
function: armsetCommand
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
  - RW
  - UPDATE
linkTitle: ARMSET
reply_schema:
  description: Number of new slots that were set (previously empty).
  type: integer
since: 8.8.0
summary: Sets multiple index-value pairs in an array.
syntax_fmt: ARMSET key index value [index value ...]
title: ARMSET
---
Sets multiple index-value pairs in an array.

## Required arguments

<details open><summary><code>key</code></summary>

The name of the key that holds the array.

</details>

<details open><summary><code>data</code></summary>

One or more `index value` pairs. Each `index` is a zero-based integer specifying where to write, and each `value` is the string to store at that position. Pairs may be non-contiguous and in any order.

</details>

## Examples

{{% redis-cli %}}
ARMSET myarray 0 "alpha" 5 "beta" 100 "gamma"
ARGET myarray 0
ARGET myarray 5
ARGET myarray 100
{{% /redis-cli %}}

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): Number of new slots that were set (previously empty).

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): Number of new slots that were set (previously empty).

{{< /multitabs >}}
