---
acl_categories:
- ARRAY
arguments:
- key_spec_index: 0
  name: key
  type: key
arity: 2
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
description: Returns the next index ARINSERT would use.
function: arnextCommand
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
linkTitle: ARNEXT
reply_schema:
  oneOf:
  - description: The next index ARINSERT would use. Returns 0 for missing keys or
      when no insert happened yet.
    type: integer
  - description: Null when the insertion cursor is exhausted (next insert would overflow).
    type: 'null'
since: 8.8.0
summary: Returns the next index ARINSERT would use.
syntax_fmt: ARNEXT key
title: ARNEXT
---
Returns the next index ARINSERT would use.

## Required arguments

<details open><summary><code>key</code></summary>

The name of the key that holds the array.

</details>

## Examples

{{% redis-cli %}}
ARINSERT myarray "a"
ARINSERT myarray "b"
ARNEXT myarray
{{% /redis-cli %}}

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

One of the following:
* [Integer reply](../../develop/reference/protocol-spec#integers): The next index ARINSERT would use. Returns 0 for missing keys or when no insert happened yet.
* [Nil reply](../../develop/reference/protocol-spec#null-bulk-strings): Null when the insertion cursor is exhausted (next insert would overflow).

-tab-sep-

One of the following:
* [Integer reply](../../develop/reference/protocol-spec#integers): The next index ARINSERT would use. Returns 0 for missing keys or when no insert happened yet.
* [Null reply](../../develop/reference/protocol-spec#nulls): Null when the insertion cursor is exhausted (next insert would overflow).

{{< /multitabs >}}
