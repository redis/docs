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

The name of the key that holds the array.

</details>

<details open><summary><code>size</code></summary>

The size of the ring buffer window. Each value is inserted at `insert_idx % size`, wrapping back to index `0` when the end of the window is reached. When the buffer is full, newer values overwrite older ones. If `size` is smaller than the current window, the array is truncated to fit.

</details>

<details open><summary><code>value</code></summary>

One or more string values to insert into the ring buffer. Each value is placed at the next position in the ring and the cursor advances accordingly.

</details>

## Examples

{{% redis-cli %}}
ARRING readings 3 "v0"
ARRING readings 3 "v1"
ARRING readings 3 "v2"
ARRING readings 3 "v3"
ARGET readings 0
ARCOUNT readings
ARLASTITEMS readings 3
{{% /redis-cli %}}

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): The last index where a value was inserted.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): The last index where a value was inserted.

{{< /multitabs >}}
