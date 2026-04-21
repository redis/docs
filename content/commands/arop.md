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

TODO: Add description for key (key)

</details>

<details open><summary><code>start</code></summary>

TODO: Add description for start (integer)

</details>

<details open><summary><code>end</code></summary>

TODO: Add description for end (integer)

</details>

<details open><summary><code>operation</code></summary>

TODO: Add description for operation (oneof)

</details>

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

One of the following:
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): Result of the operation.
* [Integer reply](../../develop/reference/protocol-spec#integers): Integer result for MATCH, USED, AND, OR, XOR.
* [Nil reply](../../develop/reference/protocol-spec#bulk-strings): Null if no elements match the operation.

-tab-sep-

One of the following:
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): Result of the operation.
* [Integer reply](../../develop/reference/protocol-spec#integers): Integer result for MATCH, USED, AND, OR, XOR.
* [Null reply](../../develop/reference/protocol-spec#nulls): Null if no elements match the operation.

{{< /multitabs >}}

