---
acl_categories:
- '@read'
- '@geo'
- '@slow'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: longitude
  name: longitude
  type: double
- display_text: latitude
  name: latitude
  type: double
- display_text: radius
  name: radius
  type: double
- arguments:
  - display_text: m
    name: m
    token: M
    type: pure-token
  - display_text: km
    name: km
    token: KM
    type: pure-token
  - display_text: ft
    name: ft
    token: FT
    type: pure-token
  - display_text: mi
    name: mi
    token: MI
    type: pure-token
  name: unit
  type: oneof
- display_text: withcoord
  name: withcoord
  optional: true
  token: WITHCOORD
  type: pure-token
- display_text: withdist
  name: withdist
  optional: true
  token: WITHDIST
  type: pure-token
- display_text: withhash
  name: withhash
  optional: true
  token: WITHHASH
  type: pure-token
- arguments:
  - display_text: count
    name: count
    token: COUNT
    type: integer
  - display_text: any
    name: any
    optional: true
    since: 6.2.0
    token: ANY
    type: pure-token
  name: count-block
  optional: true
  type: block
- arguments:
  - display_text: asc
    name: asc
    token: ASC
    type: pure-token
  - display_text: desc
    name: desc
    token: DESC
    type: pure-token
  name: order
  optional: true
  type: oneof
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
- readonly
complexity: O(N+log(M)) where N is the number of elements inside the bounding box
  of the circular area delimited by center and radius and M is the number of items
  inside the index.
deprecated_since: 6.2.0
description: Returns members from a geospatial index that are within a distance from
  a coordinate.
doc_flags:
- deprecated
group: geo
hidden: false
history:
- - 6.2.0
  - Added the `ANY` option for `COUNT`.
key_specs:
- RO: true
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
linkTitle: GEORADIUS_RO
replaced_by: '[`GEOSEARCH`]({{< relref "/commands/geosearch" >}}) with the `BYRADIUS`
  argument'
since: 3.2.10
summary: Returns members from a geospatial index that are within a distance from a
  coordinate.
syntax_fmt: "GEORADIUS_RO key longitude latitude radius <M | KM | FT | MI>\n  [WITHCOORD]\
  \ [WITHDIST] [WITHHASH] [COUNT\_count [ANY]] [ASC | DESC]"
syntax_str: "longitude latitude radius <M | KM | FT | MI> [WITHCOORD] [WITHDIST] [WITHHASH]\
  \ [COUNT\_count [ANY]] [ASC | DESC]"
title: GEORADIUS_RO
---
Read-only variant of the [`GEORADIUS`]({{< relref "/commands/georadius" >}}) command.

This command is identical to the [`GEORADIUS`]({{< relref "/commands/georadius" >}}) command, except that it doesn't support the optional `STORE` and `STOREDIST` parameters.
