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
- display_text: decrement
  name: decrement
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
description: Decrements a number from the integer value of a key. Uses 0 as initial
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
linkTitle: DECRBY
railroad_diagram: /images/railroad/decrby.svg
since: 1.0.0
summary: Decrements a number from the integer value of a key. Uses 0 as initial value
  if the key doesn't exist.
syntax_fmt: DECRBY key decrement
syntax_str: decrement
title: DECRBY
---
The `DECRBY` command reduces the value stored at the specified `key` by the specified `decrement`.
If the key does not exist, it is initialized with a value of `0` before performing the operation.
If the key's value is not of the correct type or cannot be represented as an integer, an error is returned.
This operation is limited to 64-bit signed integers.

See [`INCR`]({{< relref "/commands/incr" >}}) for extra information on increment/decrement operations.

## Examples

{{% redis-cli %}}
SET mykey "10"
DECRBY mykey 3
{{% /redis-cli %}}

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="decrby-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the value of the key after decrementing it.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): the value of the key after decrementing it.

{{< /multitabs >}}
