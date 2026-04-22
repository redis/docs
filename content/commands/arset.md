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

The name of the key that holds the array.

</details>

<details open><summary><code>index</code></summary>

The zero-based integer index at which to start writing. When multiple values are provided, they are stored at consecutive indices starting from `index`.

</details>

<details open><summary><code>value</code></summary>

One or more string values to store at consecutive indices beginning at `index`. The number of new (previously empty) slots filled is returned.

</details>

## Examples

{{% redis-cli %}}
ARSET myarray 0 "hello"
ARGET myarray 0
ARSET myarray 2 "a" "b" "c"
ARGET myarray 2
ARGET myarray 4
{{% /redis-cli %}}

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): Number of new slots that were set (previously empty).

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): Number of new slots that were set (previously empty).

{{< /multitabs >}}
