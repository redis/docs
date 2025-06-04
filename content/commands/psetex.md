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
- display_text: milliseconds
  name: milliseconds
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
description: Sets both string value and expiration time in milliseconds of a key.
  The key is created if it doesn't exist.
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
linkTitle: PSETEX
replaced_by: '[`SET`]({{< relref "/commands/set" >}}) with the `PX` argument'
since: 2.6.0
summary: Sets both string value and expiration time in milliseconds of a key. The
  key is created if it doesn't exist.
syntax_fmt: PSETEX key milliseconds value
syntax_str: milliseconds value
title: PSETEX
---
`PSETEX` works exactly like [`SETEX`]({{< relref "/commands/setex" >}}) with the sole difference that the expire
time is specified in milliseconds instead of seconds.

## Examples

{{% redis-cli %}}
PSETEX mykey 1000 "Hello"
PTTL mykey
GET mykey
{{% /redis-cli %}}

## Return information

{{< multitabs id="psetex-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}
