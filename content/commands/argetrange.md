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
arity: 4
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
complexity: O(N) where N is the range length
description: Gets values in a range of indices.
function: argetrangeCommand
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
linkTitle: ARGETRANGE
reply_schema:
  items:
    oneOf:
    - type: string
    - type: 'null'
  type: array
since: 8.8.0
summary: Gets values in a range of indices.
syntax_fmt: ARGETRANGE key start end
title: ARGETRANGE
---
Gets values in a range of indices.

## Required arguments

<details open><summary><code>key</code></summary>

The name of the key that holds the array.

</details>

<details open><summary><code>start</code></summary>

The zero-based integer index of the first element to return. If `start` is greater than `end`, elements are returned in reverse index order.

</details>

<details open><summary><code>end</code></summary>

The zero-based integer index of the last element to return (inclusive). If `end` is less than `start`, elements are returned in reverse index order.

</details>

## Examples

{{% redis-cli %}}
redis> ARMSET myarray 0 "a" 1 "b" 3 "d"
(integer) 3
redis> ARGETRANGE myarray 0 3
1) "a"
2) "b"
3) (nil)
4) "d"
redis> ARGETRANGE myarray 3 0
1) "d"
2) (nil)
3) "b"
4) "a"
{{% /redis-cli %}}

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays)

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays)

{{< /multitabs >}}
