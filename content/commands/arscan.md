---
acl_categories:
- "@read"
- "@array"
- "@slow"
arguments:
- key_spec_index: 0
  name: key
  type: key
- name: start
  type: integer
- name: end
  type: integer
- name: limit
  optional: true
  token: LIMIT
  type: integer
arity: -4
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
complexity: O(P) where P is visited positions in touched slices (dense scanned slots
  + sparse entries), with worst-case O(|end-start|+1) and typical case close to O(N),
  where N is the number of existing elements in range.
description: Iterates existing elements in a range, returning index-value pairs.
function: arscanCommand
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
linkTitle: ARSCAN
reply_schema:
  description: 'Flat array of index-value pairs: [idx1, val1, idx2, val2, ...]'
  items:
    oneOf:
    - description: Index of existing element
      type: integer
    - description: Value at that index
      type: string
  type: array
since: 8.8.0
summary: Iterates existing elements in a range, returning index-value pairs.
syntax_fmt: "ARSCAN key start end [LIMIT\_limit]"
title: ARSCAN
---
Iterates existing elements in a range, returning index-value pairs.

## Required arguments

<details open><summary><code>key</code></summary>

The name of the key that holds the array.

</details>

<details open><summary><code>start</code></summary>

The zero-based integer index at which to begin scanning. If `start` is greater than `end`, elements are returned in reverse index order.

</details>

<details open><summary><code>end</code></summary>

The zero-based integer index at which to stop scanning (inclusive).

</details>

## Optional arguments

<details open><summary><code>LIMIT</code></summary>

The maximum number of index-value pairs to return. When omitted, all elements in the range are returned. Unlike `ARGETRANGE`, empty slots are not included in the output, so `LIMIT` caps the number of existing elements returned.

</details>

## Examples

{{% redis-cli %}}
redis> ARSET myarray 0 "a"
(integer) 1
redis> ARSET myarray 5 "b"
(integer) 1
redis> ARSET myarray 9 "c"
(integer) 1
redis> ARSCAN myarray 0 10
1) 1) (integer) 0
   2) "a"
2) 1) (integer) 5
   2) "b"
3) 1) (integer) 9
   2) "c"
redis> ARSCAN myarray 0 10 LIMIT 2
1) 1) (integer) 0
   2) "a"
2) 1) (integer) 5
   2) "b"
{{% /redis-cli %}}

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): Flat array of index-value pairs: [idx1, val1, idx2, val2, ...]

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): Flat array of index-value pairs: [idx1, val1, idx2, val2, ...]

{{< /multitabs >}}
