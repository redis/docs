---
acl_categories:
- ARRAY
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

TODO: Add description for key (key)

</details>

<details open><summary><code>start</code></summary>

TODO: Add description for start (integer)

</details>

<details open><summary><code>end</code></summary>

TODO: Add description for end (integer)

</details>

## Optional arguments

<details open><summary><code>LIMIT</code></summary>

TODO: Add description for limit (integer)

</details>

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): Flat array of index-value pairs: [idx1, val1, idx2, val2, ...]

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): Flat array of index-value pairs: [idx1, val1, idx2, val2, ...]

{{< /multitabs >}}

