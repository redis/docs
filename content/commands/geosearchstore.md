---
acl_categories:
- '@write'
- '@geo'
- '@slow'
arguments:
- display_text: destination
  key_spec_index: 0
  name: destination
  type: key
- display_text: source
  key_spec_index: 1
  name: source
  type: key
- arguments:
  - display_text: member
    name: member
    token: FROMMEMBER
    type: string
  - arguments:
    - display_text: longitude
      name: longitude
      type: double
    - display_text: latitude
      name: latitude
      type: double
    name: fromlonlat
    token: FROMLONLAT
    type: block
  name: from
  type: oneof
- arguments:
  - arguments:
    - display_text: radius
      name: radius
      token: BYRADIUS
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
    name: circle
    type: block
  - arguments:
    - display_text: width
      name: width
      token: BYBOX
      type: double
    - display_text: height
      name: height
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
    name: box
    type: block
  name: by
  type: oneof
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
- arguments:
  - display_text: count
    name: count
    token: COUNT
    type: integer
  - display_text: any
    name: any
    optional: true
    token: ANY
    type: pure-token
  name: count-block
  optional: true
  type: block
- display_text: storedist
  name: storedist
  optional: true
  token: STOREDIST
  type: pure-token
arity: -8
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
complexity: O(N+log(M)) where N is the number of elements in the grid-aligned bounding
  box area around the shape provided as the filter and M is the number of items inside
  the shape
description: Queries a geospatial index for members inside an area of a box or a circle,
  optionally stores the result.
group: geo
hidden: false
history:
- - 7.0.0
  - Added support for uppercase unit names.
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
- RO: true
  access: true
  begin_search:
    spec:
      index: 2
    type: index
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
linkTitle: GEOSEARCHSTORE
railroad_diagram: /images/railroad/geosearchstore.svg
since: 6.2.0
summary: Queries a geospatial index for members inside an area of a box or a circle,
  optionally stores the result.
syntax_fmt: "GEOSEARCHSTORE destination source <FROMMEMBER\_member |\n  FROMLONLAT\_\
  longitude latitude> <BYRADIUS\_radius <M | KM | FT | MI>\n  | BYBOX\_width height\
  \ <M | KM | FT | MI>> [ASC | DESC] [COUNT\_count\n  [ANY]] [STOREDIST]"
title: GEOSEARCHSTORE
---
This command is like [`GEOSEARCH`]({{< relref "/commands/geosearch" >}}), but stores the result in destination key.

This command replaces the now deprecated [`GEORADIUS`]({{< relref "/commands/georadius" >}}) and [`GEORADIUSBYMEMBER`]({{< relref "/commands/georadiusbymember" >}}).

By default, it stores the results in the `destination` sorted set with their geospatial information.

When using the `STOREDIST` option, the command stores the items in a sorted set populated with their distance from the center of the circle or box, as a floating-point number, in the same unit specified for that shape.

## Examples

{{% redis-cli %}}
GEOADD Sicily 13.361389 38.115556 "Palermo" 15.087269 37.502669 "Catania"
GEOADD Sicily 12.758489 38.788135 "edge1"   17.241510 38.788135 "edge2" 
GEOSEARCHSTORE key1 Sicily FROMLONLAT 15 37 BYBOX 400 400 km ASC COUNT 3
GEOSEARCH key1 FROMLONLAT 15 37 BYBOX 400 400 km ASC WITHCOORD WITHDIST WITHHASH
GEOSEARCHSTORE key2 Sicily FROMLONLAT 15 37 BYBOX 400 400 km ASC COUNT 3 STOREDIST
ZRANGE key2 0 -1 WITHSCORES
{{% /redis-cli %}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="geosearchstore-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the number of elements in the resulting set

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): the number of elements in the resulting set

{{< /multitabs >}}
