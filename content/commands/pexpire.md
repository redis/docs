---
acl_categories:
- '@keyspace'
- '@write'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: milliseconds
  name: milliseconds
  type: integer
- arguments:
  - display_text: nx
    name: nx
    token: NX
    type: pure-token
  - display_text: xx
    name: xx
    token: XX
    type: pure-token
  - display_text: gt
    name: gt
    token: GT
    type: pure-token
  - display_text: lt
    name: lt
    token: LT
    type: pure-token
  name: condition
  optional: true
  since: 7.0.0
  type: oneof
arity: -3
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
- fast
complexity: O(1)
description: Sets the expiration time of a key in milliseconds.
group: generic
hidden: false
history:
- - 7.0.0
  - 'Added options: `NX`, `XX`, `GT` and `LT`.'
key_specs:
- RW: true
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
linkTitle: PEXPIRE
since: 2.6.0
summary: Sets the expiration time of a key in milliseconds.
syntax_fmt: PEXPIRE key milliseconds [NX | XX | GT | LT]
syntax_str: milliseconds [NX | XX | GT | LT]
title: PEXPIRE
---
This command works exactly like [`EXPIRE`]({{< relref "/commands/expire" >}}) but the time to live of the key is
specified in milliseconds instead of seconds.

## Options

The `PEXPIRE` command supports a set of options since Redis 7.0:

* `NX` -- Set expiry only when the key has no expiry
* `XX` -- Set expiry only when the key has an existing expiry
* `GT` -- Set expiry only when the new expiry is greater than current one
* `LT` -- Set expiry only when the new expiry is less than current one

A non-volatile key is treated as an infinite TTL for the purpose of `GT` and `LT`.
The `GT`, `LT` and `NX` options are mutually exclusive.

## Examples

{{% redis-cli %}}
SET mykey "Hello"
PEXPIRE mykey 1500
TTL mykey
PTTL mykey
PEXPIRE mykey 1000 XX
TTL mykey
PEXPIRE mykey 1000 NX
TTL mykey
{{% /redis-cli %}}

