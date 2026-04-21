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
- WRITE
- FAST
complexity: O(1)
description: Sets the ARINSERT cursor to a specific index.
function: arseekCommand
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
linkTitle: ARSEEK
reply_schema:
  description: 1 if the cursor was set, 0 if the key does not exist.
  type: integer
since: 8.8.0
summary: Sets the ARINSERT cursor to a specific index.
syntax_fmt: ARSEEK key index
title: ARSEEK
---
Sets the ARINSERT cursor to a specific index.

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

[Integer reply](../../develop/reference/protocol-spec#integers): 1 if the cursor was set, 0 if the key does not exist.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): 1 if the cursor was set, 0 if the key does not exist.

{{< /multitabs >}}

