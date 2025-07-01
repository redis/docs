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
- arguments:
  - display_text: numfields
    name: numfields
    type: integer
  - display_text: field
    multiple: true
    name: field
    type: string
  name: fields
  token: FIELDS
  type: block
arity: -6
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
complexity: O(N) where N is the number of specified fields
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
since: 7.4.0
summary: Set expiry for hash field using relative time to expire (seconds)
syntax_fmt: "HEXPIRE key seconds [NX | XX | GT | LT] FIELDS\_numfields field\n  [field\
  \ ...]"
syntax_str: "seconds [NX | XX | GT | LT] FIELDS\_numfields field [field ...]"
title: HEXPIRE
---
Set an expiration (TTL or time to live) on one or more fields of a given hash key. You must specify at least one field.
Field(s) will automatically be deleted from the hash key when their TTLs expire.

Field expirations will only be cleared by commands that delete or overwrite the
contents of the hash fields, including [`HDEL`]({{< relref "/commands/hdel" >}}) and [`HSET`]({{< relref "/commands/hset" >}})
commands.
This means that all the operations that conceptually _alter_ the value stored at a hash key's field without replacing it with a new one will leave the TTL untouched.

You can clear the TTL using the [`HPERSIST`]({{< relref "/commands/hpersist" >}}) command, which turns the hash field back into a persistent field.

Note that calling `HEXPIRE`/[`HPEXPIRE`]({{< relref "/commands/hpexpire" >}}) with a zero TTL or
[`HEXPIREAT`]({{< relref "/commands/hexpireat" >}})/[`HPEXPIREAT`]({{< relref "/commands/hpexpireat" >}}) with a time in the past will result in the hash field being deleted.

## Options

The `HEXPIRE` command supports a set of options:

* `NX` -- For each specified field, set expiration only when the field has no expiration.
* `XX` -- For each specified field, set expiration only when the field has an existing expiration.
* `GT` -- For each specified field, set expiration only when the new expiration is greater than current one.
* `LT` -- For each specified field, set expiration only when the new expiration is less than current one.

A non-volatile field is treated as an infinite TTL for the purpose of `GT` and `LT`.
The `NX`, `XX`, `GT`, and `LT` options are mutually exclusive.

## Refreshing expires

You can call `HEXPIRE` using as argument a field that already has an
existing TTL set.
In this case, the time to live is _updated_ to the new value.

## Redis Query Engine and field expiration

Starting with Redis 8, the Redis Query Engine has enhanced behavior when handling expiring hash fields. For detailed information about how [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) and [`FT.AGGREGATE`]({{< relref "/commands/ft.aggregate" >}}) commands interact with expiring hash fields, see [Key and field expiration behavior]({{< relref "/develop/ai/search-and-query/advanced-concepts/expiration" >}}).

## Example

```
redis> HEXPIRE no-key 20 NX FIELDS 2 field1 field2
(nil)
redis> HSET mykey field1 "hello" field2 "world"
(integer 2)
redis> HEXPIRE mykey 10 FIELDS 3 field1 field2 field3
1) (integer) 1
2) (integer) 1
3) (integer) -2
redis> HGETALL mykey
(empty array)
```

## Return information

{{< multitabs id="hexpire-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Array reply](../../develop/reference/protocol-spec#arrays). For each field:
    - [Integer reply](../../develop/reference/protocol-spec#integers): `-2` if no such field exists in the provided hash key, or the provided key does not exist.
    - [Integer reply](../../develop/reference/protocol-spec#integers): `0` if the specified NX | XX | GT | LT condition has not been met.
    - [Integer reply](../../develop/reference/protocol-spec#integers): `1` if the expiration time was set/updated.
    - [Integer reply](../../develop/reference/protocol-spec#integers): `2` when `HEXPIRE`/`HPEXPIRE` is called with 0 seconds/milliseconds or when `HEXPIREAT`/`HPEXPIREAT` is called with a past Unix time in seconds/milliseconds.
* [Simple error reply](../../develop/reference/protocol-spec#simple-errors):
    - if parsing failed, mandatory arguments are missing, unknown arguments are specified, or argument values are of the wrong type or out of range.
    - if the provided key exists but is not a hash.

-tab-sep-

One of the following:
* [Array reply](../../develop/reference/protocol-spec#arrays). For each field:
    - [Integer reply](../../develop/reference/protocol-spec#integers): `-2` if no such field exists in the provided hash key, or the provided key does not exist.
    - [Integer reply](../../develop/reference/protocol-spec#integers): `0` if the specified NX | XX | GT | LT condition has not been met.
    - [Integer reply](../../develop/reference/protocol-spec#integers): `1` if the expiration time was set/updated.
    - [Integer reply](../../develop/reference/protocol-spec#integers): `2` when `HEXPIRE`/`HPEXPIRE` is called with 0 seconds/milliseconds or when `HEXPIREAT`/`HPEXPIREAT` is called with a past Unix time in seconds/milliseconds.
* [Simple error reply](../../develop/reference/protocol-spec#simple-errors):
    - if parsing failed, mandatory arguments are missing, unknown arguments are specified, or argument values are of the wrong type or out of range.
    - if the provided key exists but is not a hash.

{{< /multitabs >}}
