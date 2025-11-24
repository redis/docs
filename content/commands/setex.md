---
acl_categories:
- '@write'
- '@string'
- '@slow'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: seconds
  name: seconds
  type: integer
- display_text: value
  name: value
  type: string
arity: 4
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
complexity: O(1)
deprecated_since: 2.6.12
description: Sets the string value and expiration time of a key. Creates the key if
  it doesn't exist.
doc_flags:
- deprecated
group: string
hidden: false
key_specs:
- OW: true
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
linkTitle: SETEX
replaced_by: '[`SET`]({{< relref "/commands/set" >}}) with the `EX` argument'
since: 2.0.0
summary: Sets the string value and expiration time of a key. Creates the key if it
  doesn't exist.
syntax_fmt: SETEX key seconds value
syntax_str: seconds value
title: SETEX
---
Set `key` to hold the string `value` and set `key` to timeout after a given
number of seconds.
This command is equivalent to:

```
SET key value EX seconds
```

An error is returned when `seconds` is invalid.

## Examples

{{% redis-cli %}}
SETEX mykey 10 "Hello"
TTL mykey
GET mykey
{{% /redis-cli %}}

## See also

[`TTL`]({{< relref "/commands/ttl" >}})

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="setex-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}
