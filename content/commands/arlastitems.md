---
acl_categories:
- ARRAY
arguments:
- key_spec_index: 0
  name: key
  type: key
- name: count
  type: integer
- name: rev
  optional: true
  token: REV
  type: pure-token
arity: -3
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
complexity: O(N) where N is the count
description: Returns the most recently inserted elements.
function: arlastitemsCommand
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
linkTitle: ARLASTITEMS
reply_schema:
  items:
    oneOf:
    - type: string
    - type: 'null'
  type: array
since: 8.8.0
summary: Returns the most recently inserted elements.
syntax_fmt: ARLASTITEMS key count [REV]
title: ARLASTITEMS
---
Returns the most recently inserted elements.

## Required arguments

<details open><summary><code>key</code></summary>

TODO: Add description for key (key)

</details>

<details open><summary><code>count</code></summary>

TODO: Add description for count (integer)

</details>

## Optional arguments

<details open><summary><code>REV</code></summary>

TODO: Add description for rev (pure-token)

</details>

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays)

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays)

{{< /multitabs >}}

