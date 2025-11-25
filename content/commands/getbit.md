---
acl_categories:
- '@read'
- '@bitmap'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: offset
  name: offset
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
- readonly
- fast
complexity: O(1)
description: Returns a bit value by offset.
group: bitmap
hidden: false
key_specs:
- RO: true
  access: true
  begin_search:
    spec:
      index: 1
    type: index
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
linkTitle: GETBIT
railroad_diagram: /images/railroad/getbit.svg
since: 2.2.0
summary: Returns a bit value by offset.
syntax_fmt: GETBIT key offset
syntax_str: offset
title: GETBIT
---
Returns the bit value at _offset_ in the string value stored at _key_.

When _offset_ is beyond the string length, the string is assumed to be a
contiguous space with 0 bits.
When _key_ does not exist it is assumed to be an empty string, so _offset_ is
always out of range and the value is also assumed to be a contiguous space with
0 bits.

## Examples

{{% redis-cli %}}
SETBIT mykey 7 1
GETBIT mykey 0
GETBIT mykey 7
GETBIT mykey 100
{{% /redis-cli %}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="getbit-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

The bit value stored at _offset_, one of the following:
* [Integer reply](../../develop/reference/protocol-spec#integers): `0`.
* [Integer reply](../../develop/reference/protocol-spec#integers): `1`.

-tab-sep-

The bit value stored at _offset_, one of the following:
* [Integer reply](../../develop/reference/protocol-spec#integers): `0`.
* [Integer reply](../../develop/reference/protocol-spec#integers): `1`.

{{< /multitabs >}}
