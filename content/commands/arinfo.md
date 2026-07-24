---
acl_categories:
- "@read"
- "@array"
- "@slow"
arguments:
- key_spec_index: 0
  name: key
  type: key
- name: full
  optional: true
  token: FULL
  type: pure-token
arity: -2
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
complexity: O(1), or O(N) with FULL option where N is the number of slices.
description: Returns metadata about an array.
function: arinfoCommand
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
linkTitle: ARINFO
reply_schema:
  additionalProperties: false
  properties:
    avg-dense-fill:
      description: Average fill rate of dense slices (FULL only).
      type: number
    avg-dense-size:
      description: Average allocation size of dense slices (FULL only).
      type: number
    avg-sparse-size:
      description: Average capacity of sparse slices (FULL only).
      type: number
    count:
      description: Total number of non-empty elements.
      type: integer
    dense-slices:
      description: Number of dense slices (FULL only).
      type: integer
    directory-size:
      description: Directory allocation capacity (flat dir_alloc or superdir sdir_cap).
      type: integer
    len:
      description: Logical length (highest index + 1).
      type: integer
    next-insert-index:
      description: Index the next ARINSERT would use, or 0 if unset/exhausted.
      type: integer
    slice-size:
      description: Configured slice size.
      type: integer
    slices:
      description: Number of allocated slices.
      type: integer
    sparse-slices:
      description: Number of sparse slices (FULL only).
      type: integer
    super-dir-entries:
      description: Number of super-directory entries (0 if not in superdir mode).
      type: integer
  type: object
since: 8.8.0
summary: Returns metadata about an array.
syntax_fmt: ARINFO key [FULL]
title: ARINFO
---
Returns metadata about an array.

## Required arguments

<details open><summary><code>key</code></summary>

The name of the key that holds the array.

</details>

## Optional arguments

<details open><summary><code>FULL</code></summary>

When present, includes per-slice statistics in the reply: the number of dense and sparse slices and their average sizes and fill rates. Raises the complexity from O(1) to O(N) where N is the number of slices.

</details>

## Examples

{{% redis-cli %}}
redis> ARMSET myarray 0 "a" 1 "b" 100 "c"
(integer) 3
redis> ARINSERT myarray "d"
(integer) 0
redis> ARINFO myarray
 1) "count"
 2) (integer) 3
 3) "len"
 4) (integer) 101
 5) "next-insert-index"
 6) (integer) 1
 7) "slices"
 8) (integer) 1
 9) "directory-size"
10) (integer) 1
11) "super-dir-entries"
12) (integer) 0
13) "slice-size"
14) (integer) 4096
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

[Map reply](../../develop/reference/protocol-spec#maps)

{{< /multitabs >}}
