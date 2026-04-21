---
acl_categories:
- ARRAY
arguments:
- key_spec_index: 0
  name: key
  type: key
- name: size
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
complexity: O(M) normally, O(N+M) on ring resize, where N is the maximum of the old
  and new ring size and M is the number of inserted values
description: Inserts values into a ring buffer of specified size, wrapping and truncating
  as needed.
function: arringCommand
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
linkTitle: ARRING
reply_schema:
  description: The last index where a value was inserted.
  type: integer
since: 8.8.0
summary: Inserts values into a ring buffer of specified size, wrapping and truncating
  as needed.
syntax_fmt: ARRING key size value [value ...]
title: ARRING
---
Inserts values into a ring buffer of specified size, wrapping and truncating as needed.

## Required arguments

<details open><summary><code>key</code></summary>

TODO: Add description for key (key)

</details>

<details open><summary><code>size</code></summary>

TODO: Add description for size (integer)

</details>

<details open><summary><code>value</code></summary>

TODO: Add description for value (string)

</details>

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): The last index where a value was inserted.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): The last index where a value was inserted.

{{< /multitabs >}}

