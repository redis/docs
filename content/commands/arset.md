---
acl_categories:
- ARRAY
arguments:
- key_spec_index: 0
  name: key
  type: key
- name: index
  type: integer
- multiple: true
  name: value
  type: string
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
complexity: O(N) where N is the number of values
description: Sets one or more contiguous values starting at an index in an array.
function: arsetCommand
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
linkTitle: ARSET
reply_schema:
  description: Number of new slots that were set (previously empty).
  type: integer
since: 8.8.0
summary: Sets one or more contiguous values starting at an index in an array.
syntax_fmt: ARSET key index value [value ...]
title: ARSET
---
Sets one or more contiguous values starting at an index in an array.

## Required arguments

<details open><summary><code>key</code></summary>

TODO: Add description for key (key)

</details>

<details open><summary><code>index</code></summary>

TODO: Add description for index (integer)

</details>

<details open><summary><code>value</code></summary>

TODO: Add description for value (string)

</details>

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): Number of new slots that were set (previously empty).

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): Number of new slots that were set (previously empty).

{{< /multitabs >}}

