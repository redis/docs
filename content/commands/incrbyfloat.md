---
acl_categories:
- '@write'
- '@string'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: increment
  name: increment
  type: double
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
- write
- denyoom
- fast
complexity: O(1)
description: Increment the floating point value of a key by a number. Uses 0 as initial
  value if the key doesn't exist.
group: string
hidden: false
key_specs:
- RW: true
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
  update: true
linkTitle: INCRBYFLOAT
railroad_diagram: /images/railroad/incrbyfloat.svg
since: 2.6.0
summary: Increment the floating point value of a key by a number. Uses 0 as initial
  value if the key doesn't exist.
syntax_fmt: INCRBYFLOAT key increment
syntax_str: increment
title: INCRBYFLOAT
---
Increment the string representing a floating point number stored at `key` by the
specified `increment`. By using a negative `increment` value, the result is
that the value stored at the key is decremented (by the obvious properties
of addition).
If the key does not exist, it is set to `0` before performing the operation.
An error is returned if one of the following conditions occur:

* The key contains a value of the wrong type (not a string).
* The current key content or the specified increment are not parsable as a
  double precision floating point number.

If the command is successful the new incremented value is stored as the new
value of the key (replacing the old one), and returned to the caller as a
string.

Both the value already contained in the string key and the increment argument
can be optionally provided in exponential notation, however the value computed
after the increment is stored consistently in the same format, that is, an
integer number followed (if needed) by a dot, and a variable number of digits
representing the decimal part of the number.
Trailing zeroes are always removed.

The precision of the output is fixed at 17 digits after the decimal point
regardless of the actual internal precision of the computation.

## Examples

{{% redis-cli %}}
SET mykey 10.50
INCRBYFLOAT mykey 0.1
INCRBYFLOAT mykey -5
SET mykey 5.0e3
INCRBYFLOAT mykey 2.0e2
{{% /redis-cli %}}


## Implementation details

The command is always propagated in the replication link and the Append Only
File as a [`SET`]({{< relref "/commands/set" >}}) operation, so that differences in the underlying floating point
math implementation will not be sources of inconsistency.

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="incrbyfloat-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): the value of the key after the increment.

-tab-sep-

[Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): the value of the key after the increment.

{{< /multitabs >}}
