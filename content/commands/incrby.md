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
- write
- denyoom
- fast
complexity: O(1)
description: Increments the integer value of a key by a number. Uses 0 as initial
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
linkTitle: INCRBY
railroad_diagram: /images/railroad/incrby.svg
since: 1.0.0
summary: Increments the integer value of a key by a number. Uses 0 as initial value
  if the key doesn't exist.
syntax_fmt: INCRBY key increment
title: INCRBY
---
Increments the number stored at `key` by `increment`.
If the key does not exist, it is set to `0` before performing the operation.
An error is returned if the key contains a value of the wrong type or contains a
string that can not be represented as integer.
This operation is limited to 64 bit signed integers.

See [`INCR`]({{< relref "/commands/incr" >}}) for extra information on increment/decrement operations.

## Examples

{{% redis-cli %}}
SET mykey "10"
INCRBY mykey 5
{{% /redis-cli %}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="incrby-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the value of the key after the increment.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): the value of the key after the increment.

{{< /multitabs >}}
