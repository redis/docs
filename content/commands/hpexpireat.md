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
- display_text: unix-time-milliseconds
  name: unix-time-milliseconds
  type: unix-time
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
description: Set expiration for hash fields using an absolute Unix timestamp (milliseconds)
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
linkTitle: HPEXPIREAT
since: 7.4.0
summary: Set expiry for hash field using an absolute Unix timestamp (milliseconds)
syntax_fmt: "HPEXPIREAT key unix-time-milliseconds [NX | XX | GT | LT]\n  FIELDS\_\
  numfields field [field ...]"
syntax_str: "unix-time-milliseconds [NX | XX | GT | LT] FIELDS\_numfields field [field\
  \ ...]"
title: HPEXPIREAT
---
`HPEXPIREAT` has the same effect and semantics as [`HEXPIREAT`]({{< relref "/commands/hexpireat" >}}), but the Unix time at
which the field will expire is specified in milliseconds since Unix epoch instead of seconds.

## Options

The `HPEXPIREAT` command supports a set of options:

* `NX` -- For each specified field, set expiration only when the field has no expiration.
* `XX` -- For each specified field, set expiration only when the field has an existing expiration.
* `GT` -- For each specified field, set expiration only when the new expiration is greater than current one.
* `LT` -- For each specified field, set expiration only when the new expiration is less than current one.

A non-volatile key is treated as an infinite TTL for the purposes of `GT` and `LT`.
The `NX`, `XX`, `GT`, and `LT` options are mutually exclusive.

## Example

```
redis> HSET mykey field1 "hello" field2 "world"
(integer 2)
redis> HPEXPIREAT mykey 1715704971000 FIELDS 2 field1 field2
1) (integer) 1
2) (integer) 1
redis> HPTTL mykey FIELDS 2 field1 field2
1) (integer) 303340
2) (integer) 303340
```

