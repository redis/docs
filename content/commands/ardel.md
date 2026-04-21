---
acl_categories:
- ARRAY
arguments:
- key_spec_index: 0
  name: key
  type: key
- multiple: true
  name: index
  type: integer
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
- FAST
complexity: O(N) where N is the number of indices to delete
description: Deletes elements at the specified indices in an array.
function: ardelCommand
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
linkTitle: ARDEL
reply_schema:
  description: Number of elements deleted.
  type: integer
since: 8.8.0
summary: Deletes elements at the specified indices in an array.
syntax_fmt: ARDEL key index [index ...]
title: ARDEL
---
Deletes elements at the specified indices in an array.

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

[Integer reply](../../develop/reference/protocol-spec#integers): Number of elements deleted.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): Number of elements deleted.

{{< /multitabs >}}

