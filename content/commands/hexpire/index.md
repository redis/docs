---
acl_categories:
- '@write'
- '@hash'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: seconds
  name: seconds
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
  type: oneof
- display_text: numfields
  name: numfields
  type: integer
- display_text: field
  multiple: true
  name: field
  type: string
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
- write
- denyoom
- fast
complexity: O(N) where N is the number of arguments to the command
description: Set expiration for hash fields using relative time to expire (seconds)
group: hash
hidden: false
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
linkTitle: HEXPIRE
since: 8.0.0
summary: Set expiration for hash fields using relative time to expire (seconds)
syntax_fmt: HEXPIRE key seconds [NX | XX | GT | LT] numfields field [field ...]
syntax_str: seconds [NX | XX | GT | LT] numfields field [field ...]
title: HEXPIRE
---
Set an expiration (TTL or time to live) on one or more fields of a given hash key. At least one field must be specified.
After the TTL has expired, the field(s) will automatically be deleted from the hash key.

Field expirations will only be cleared by commands that delete or overwrite the
contents of the hash key fields, including [`HDEL`]({{< relref "/commands/hdel" >}}) and [`HSET`]({{< relref "/commands/hset" >}})
commands.
This means that all the operations that conceptually _alter_ the value stored at a hash key's field without replacing it with a new one will leave the TTL untouched.

The TTL can also be cleared, turning the hash key field back into a persistent field,
using the [`HPERSIST`]({{< relref "/commands/hpersist" >}}) command.

Note that calling `HEXPIRE`/[`HPEXPIRE`]({{< relref "/commands/hpexpire" >}}) with a non-positive TTL or
[`HEXPIREAT`]({{< relref "/commands/hexpireat" >}})/[`HPEXPIREAT`]({{< relref "/commands/hpexpireat" >}}) with a time in the past will result in the key field being
[deleted]({{< relref "/commands/hdel" >}}) rather than expired (accordingly, the emitted [key event]({{< relref "/develop/use/keyspace-notifications" >}})
will be `del`, not `expired`).

## Options

The `HEXPIRE` command supports a set of options:

* `NX` -- For each specified field, set expiration only when the field has no expiration.
* `XX` -- For each specified field, set expiration only when the field has an existing expiration.
* `GT` -- For each specified field, set expiration only when the new expiration is greater than current one.
* `LT` -- For each specified field, set expiration only when the new expiration is less than current one.

A non-volatile field is treated as an infinite TTL for the purpose of `GT` and `LT`.
The `GT`, `LT` and `NX` options are mutually exclusive.

## Refreshing expires

It is possible to call `HEXPIRE` using as argument a key that already has an
existing TTL set.
In this case the time to live is _updated_ to the new value.

## Example

```
TODO: to be provided.
```

## RESP2/RESP3 replies

One of the following:",
* [Array reply](../../develop/reference/protocol-spec#arrays). For each field:
    - [Integer reply](../../develop/reference/protocol-spec#integers): `-2` if no such field(s) exist in the provided hash key.
    - [Integer reply](../../develop/reference/protocol-spec#integers): `0` if the specified NX | XX | GT | LT condition has not been met.
    - [Integer reply](../../develop/reference/protocol-spec#integers): `1` if the expiration time was set/updated.
    - [Integer reply](../../develop/reference/protocol-spec#integers): `2` if the field(s) were deleted because of previously set expiration(s). This reply may also be returned when `HEXPIRE`/`HPEXPIRE` is called with 0 seconds/milliseconds or when `HEXPIREAT`/`HPEXPIREAT` is called with a past unix-time in seconds/milliseconds.
* [Simple error reply](../../develop/reference/protocol-spec#simple-errors):
    - if parsing failed, mandatory arguments are missing, unknown arguments are specified, or argument values are of the wrong type or out of range.
    - if the provided key exists but is not a hash.
* [Null reply](../../develop/reference/protocol-spec#nulls) if the provided key does not exist.
