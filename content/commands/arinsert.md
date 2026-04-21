---
acl_categories:
- ARRAY
arguments:
- key_spec_index: 0
  name: key
  type: key
- multiple: true
  name: value
  type: string
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
- WRITE
- DENYOOM
- FAST
complexity: O(N) where N is the number of values
description: Inserts one or more values at consecutive indices.
function: arinsertCommand
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
linkTitle: ARINSERT
reply_schema:
  description: The last index where a value was inserted.
  type: integer
since: 8.8.0
summary: Inserts one or more values at consecutive indices.
syntax_fmt: ARINSERT key value [value ...]
title: ARINSERT
---
Inserts one or more values at consecutive indices.

## Required arguments

<details open><summary><code>key</code></summary>

TODO: Add description for key (key)

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

