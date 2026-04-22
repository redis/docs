---
acl_categories:
- ARRAY
arguments:
- key_spec_index: 0
  name: key
  type: key
- arguments:
  - name: start
    type: integer
  - name: end
    type: integer
  multiple: true
  name: range
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
complexity: Proportional to the number of existing elements / slices touched, not
  to the numeric span of the requested ranges
description: Deletes elements in one or more ranges.
function: ardelrangeCommand
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
  - DELETE
linkTitle: ARDELRANGE
reply_schema:
  description: Number of elements deleted.
  type: integer
since: 8.8.0
summary: Deletes elements in one or more ranges.
syntax_fmt: ARDELRANGE key start end [start end ...]
title: ARDELRANGE
---
Deletes elements in one or more ranges.

## Required arguments

<details open><summary><code>key</code></summary>

The name of the key that holds the array.

</details>

<details open><summary><code>range</code></summary>

One or more `start end` pairs, each defining an inclusive range of indices to delete. If `start` is greater than `end` for a given pair, the range is processed in ascending order regardless. Multiple pairs may overlap; each element is counted at most once.

</details>

## Examples

{{% redis-cli %}}
ARMSET myarray 0 "a" 1 "b" 2 "c" 3 "d" 4 "e"
ARDELRANGE myarray 1 3
ARCOUNT myarray
ARGET myarray 0
ARGET myarray 4
{{% /redis-cli %}}

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): Number of elements deleted.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): Number of elements deleted.

{{< /multitabs >}}
