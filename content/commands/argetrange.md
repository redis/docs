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
arity: 4
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

TODO: Add description for key (key)

</details>

<details open><summary><code>start</code></summary>

TODO: Add description for start (integer)

</details>

<details open><summary><code>end</code></summary>

TODO: Add description for end (integer)

</details>

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays)

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays)

{{< /multitabs >}}

