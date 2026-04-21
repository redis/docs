---
acl_categories:
- ARRAY
arguments:
- key_spec_index: 0
  name: key
  type: key
- name: index
  type: integer
arity: 3
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
- FAST
complexity: O(1)
description: Gets the value at an index in an array.
function: argetCommand
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
linkTitle: ARGET
reply_schema:
  oneOf:
  - description: The value at the given index.
    type: string
  - description: Null reply if key or index does not exist.
    type: 'null'
since: 8.8.0
summary: Gets the value at an index in an array.
syntax_fmt: ARGET key index
title: ARGET
---
Gets the value at an index in an array.

## Required arguments

<details open><summary><code>key</code></summary>

TODO: Add description for key (key)

</details>

<details open><summary><code>index</code></summary>

TODO: Add description for index (integer)

</details>

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

One of the following:
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): The value at the given index.
* [Nil reply](../../develop/reference/protocol-spec#bulk-strings): Null reply if key or index does not exist.

-tab-sep-

One of the following:
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): The value at the given index.
* [Null reply](../../develop/reference/protocol-spec#nulls): Null reply if key or index does not exist.

{{< /multitabs >}}

