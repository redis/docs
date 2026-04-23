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
- arguments:
  - name: sum
    token: SUM
    type: pure-token
  - name: min
    token: MIN
    type: pure-token
  - name: max
    token: MAX
    type: pure-token
  - name: and
    token: AND
    type: pure-token
  - name: or
    token: OR
    type: pure-token
  - name: xor
    token: XOR
    type: pure-token
  - arguments:
    - name: match
      token: MATCH
      type: pure-token
    - name: value
      type: string
    name: match
    type: block
  - name: used
    token: USED
    type: pure-token
  name: operation
  type: oneof
arity: -5
bannerText: Array is a new data type that is currently in preview and may be subject to change.
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
complexity: O(P) where P is visited positions in touched slices (dense scanned slots
  + sparse entries), with worst-case O(|end-start|+1) and typical case close to O(N),
  where N is the number of existing elements in range.
description: Performs aggregate operations on array elements in a range.
function: aropCommand
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
linkTitle: AROP
reply_schema:
  oneOf:
  - description: Result of the operation.
    type: string
  - description: Integer result for MATCH, USED, AND, OR, XOR.
    type: integer
  - description: Null if no elements match the operation.
    type: 'null'
since: 8.8.0
summary: Performs aggregate operations on array elements in a range.
syntax_fmt: "AROP key start end <SUM | MIN | MAX | AND | OR | XOR | MATCH value |\n\
  \  USED>"
title: AROP
---
Performs aggregate operations on array elements in a range.

## Required arguments

<details open><summary><code>key</code></summary>

The name of the key that holds the array.

</details>

<details open><summary><code>start</code></summary>

The zero-based integer index of the first element in the range to aggregate.

</details>

<details open><summary><code>end</code></summary>

The zero-based integer index of the last element in the range to aggregate (inclusive). The command always scans from the lower to the higher index regardless of argument order.

</details>

<details open><summary><code>operation</code></summary>

The aggregate function to apply to all non-empty elements in `[start, end]`. One of:

- **`SUM`** — Returns the sum of all numeric values as a bulk string.
- **`MIN`** — Returns the minimum numeric value as a bulk string.
- **`MAX`** — Returns the maximum numeric value as a bulk string.
- **`AND`** — Returns the bitwise AND of all values, treating each as an integer (floats are truncated toward zero).
- **`OR`** — Returns the bitwise OR of all values, treating each as an integer (floats are truncated toward zero).
- **`XOR`** — Returns the bitwise XOR of all values, treating each as an integer (floats are truncated toward zero).
- **`MATCH value`** — Returns the count of elements whose value equals `value` as an integer reply.
- **`USED`** — Returns the count of non-empty elements in the range as an integer reply.

`SUM`, `MIN`, and `MAX` return nil when no numeric elements are present in the range. `AND`, `OR`, and `XOR` return nil when the range is empty.

</details>

## Examples

{{% redis-cli %}}
ARMSET myarray 0 "10" 1 "20" 2 "30"
AROP myarray 0 2 SUM
AROP myarray 0 2 MIN
AROP myarray 0 2 MAX
AROP myarray 0 2 MATCH "10"
AROP myarray 0 2 USED
ARMSET flags 0 "255" 1 "15" 2 "240"
AROP flags 0 2 AND
AROP flags 0 2 OR
{{% /redis-cli %}}

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

One of the following:
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): Result of the operation.
* [Integer reply](../../develop/reference/protocol-spec#integers): Integer result for MATCH, USED, AND, OR, XOR.
* [Nil reply](../../develop/reference/protocol-spec#null-bulk-strings): Null if no elements match the operation.

-tab-sep-

One of the following:
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): Result of the operation.
* [Integer reply](../../develop/reference/protocol-spec#integers): Integer result for MATCH, USED, AND, OR, XOR.
* [Null reply](../../develop/reference/protocol-spec#nulls): Null if no elements match the operation.

{{< /multitabs >}}
