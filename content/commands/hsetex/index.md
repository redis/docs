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
- arguments:
  - display_text: fnx
    name: fnx
    token: FNX
    type: pure-token
  - display_text: fxx
    name: fxx
    token: FXX
    type: pure-token
  name: condition
  optional: true
  type: oneof
- arguments:
  - display_text: seconds
    name: seconds
    token: EX
    type: integer
  - display_text: milliseconds
    name: milliseconds
    token: PX
    type: integer
  - display_text: unix-time-seconds
    name: unix-time-seconds
    token: EXAT
    type: unix-time
  - display_text: unix-time-milliseconds
    name: unix-time-milliseconds
    token: PXAT
    type: unix-time
  - display_text: keepttl
    name: keepttl
    token: KEEPTTL
    type: pure-token
  name: expiration
  optional: true
  type: oneof
- arguments:
  - display_text: numfields
    name: numfields
    type: integer
  - arguments:
    - display_text: field
      name: field
      type: string
    - display_text: value
      name: value
      type: string
    multiple: true
    name: data
    type: block
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
complexity: O(N) where N is the number of fields being set.
description: Set the value of one or more fields of a given hash key, and optionally
  set their expiration.
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
linkTitle: HSETEX
since: 8.0.0
summary: Set the value of one or more fields of a given hash key, and optionally set
  their expiration.
syntax_fmt: "HSETEX key [FNX | FXX] [EX\_seconds | PX\_milliseconds |\n  EXAT\_unix-time-seconds\
  \ | PXAT\_unix-time-milliseconds | KEEPTTL]\n  FIELDS\_numfields field value [field\
  \ value ...]"
syntax_str: "[FNX | FXX] [EX\_seconds | PX\_milliseconds | EXAT\_unix-time-seconds\
  \ | PXAT\_unix-time-milliseconds | KEEPTTL] FIELDS\_numfields field value [field\
  \ value ...]"
title: HSETEX
---

Set the value of one or more fields of a given hash key, and optionally set their expiration time or time-to-live (TTL).

## Options

The `HGETEX` command supports a set of options:

* `FNX` -- Only set the fields if none of them already exist.
* `FXX` -- Only set the fields if all of them already exist.
* `EX seconds` -- Set the specified expiration time in seconds.
* `PX milliseconds` -- Set the specified expiration time in milliseconds.
* `EXAT unix-time-seconds` -- Set the specified Unix time in seconds at which the fields will expire.
* `PXAT unix-time-milliseconds` -- Set the specified Unix time in milliseconds at which the fields will expire.
* `KEEPTTL` -- Retain the TTL associated with the fields.

The `EX`, `PX`, `EXAT`, `PXAT`, and `KEEPTTL` options are mutually exclusive.

## Example

```
redis> HSETEX mykey EXAT 1740470400 FIELDS 2 field1 "Hello" field2 "World"
(integer) 1
redis> HTTL mykey FIELDS 2 field1 field2
1) (integer) 55627
2) (integer) 55627
redis> HSETEX mykey FNX EX 60 FIELDS 2 field1 "Hello" field2 "World"
(integer) 0
redis> HSETEX mykey FXX EX 60 KEEPTTL FIELDS 2 field1 "hello" field2 "world"
(error) ERR Only one of EX, PX, EXAT, PXAT or KEEPTTL arguments can be specified
redis> HSETEX mykey FXX KEEPTTL FIELDS 2 field1 "hello" field2 "world"
(integer) 1
redis> HTTL mykey FIELDS 2 field1 field2
1) (integer) 55481
2) (integer) 55481
```
