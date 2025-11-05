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
arity: -7
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
complexity: O(N+log(M)) where N is the number of elements in the grid-aligned bounding
  box area around the shape provided as the filter and M is the number of items inside
  the shape
description: Queries a geospatial index for members inside an area of a box or a circle.
group: geo
hidden: false
history:
- - 7.0.0
  - Added support for uppercase unit names.
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
linkTitle: GEOSEARCH
since: 6.2.0
summary: Queries a geospatial index for members inside an area of a box or a circle.
syntax_fmt: "GEOSEARCH key <FROMMEMBER\_member | FROMLONLAT\_longitude latitude>\n\
  \  <BYRADIUS\_radius <M | KM | FT | MI> | BYBOX\_width height <M | KM |\n  FT |\
  \ MI>> [ASC | DESC] [COUNT\_count [ANY]] [WITHCOORD] [WITHDIST]\n  [WITHHASH]"
syntax_str: "<FROMMEMBER\_member | FROMLONLAT\_longitude latitude> <BYRADIUS\_radius\
  \ <M | KM | FT | MI> | BYBOX\_width height <M | KM | FT | MI>> [ASC | DESC] [COUNT\_\
  count [ANY]] [WITHCOORD] [WITHDIST] [WITHHASH]"
title: GEOSEARCH
---
Return the members of a sorted set populated with geospatial information using [`GEOADD`]({{< relref "/commands/geoadd" >}}), which are within the borders of the area specified by a given shape. This command extends the [`GEORADIUS`]({{< relref "/commands/georadius" >}}) command, so in addition to searching within circular areas, it supports searching within rectangular areas.

This command should be used in place of the deprecated [`GEORADIUS`]({{< relref "/commands/georadius" >}}) and [`GEORADIUSBYMEMBER`]({{< relref "/commands/georadiusbymember" >}}) commands.

The query's center point is provided by one of these mandatory options:

* `FROMMEMBER`: Use the position of the given existing `<member>` in the sorted set.
* `FROMLONLAT`: Use the given `<longitude>` and `<latitude>` position.

The query's shape is provided by one of these mandatory options:

* `BYRADIUS`: Similar to [`GEORADIUS`]({{< relref "/commands/georadius" >}}), search inside circular area according to given `<radius>`.
* `BYBOX`: Search inside an axis-aligned rectangle, determined by `<height>` and `<width>`.

The command optionally returns additional information using the following options:

* `WITHDIST`: Also return the distance of the returned items from the specified center point. The distance is returned in the same unit as specified for the radius or height and width arguments.
* `WITHCOORD`: Also return the longitude and latitude of the matching items.
* `WITHHASH`: Also return the raw geohash-encoded sorted set score of the item, in the form of a 52 bit unsigned integer. This is only useful for low level hacks or debugging and is otherwise of little interest for the general user.

Matching items are returned unsorted by default. To sort them, use one of the following two options:

* `ASC`: Sort returned items from the nearest to the farthest, relative to the center point.
* `DESC`: Sort returned items from the farthest to the nearest, relative to the center point.

All matching items are returned by default. To limit the results to the first N matching items, use the **COUNT `<count>`** option.
When the `ANY` option is used, the command returns as soon as enough matches are found.  This means that the results returned may not be the ones closest to the specified point, but the effort invested by the server to generate them is significantly less.
When `ANY` is not provided, the command will perform an effort that is proportional to the number of items matching the specified area and sort them,
so to query very large areas with a very small `COUNT` option may be slow even if just a few results are returned.

## Examples

{{% redis-cli %}}
GEOADD Sicily 13.361389 38.115556 "Palermo" 15.087269 37.502669 "Catania"
GEOADD Sicily 12.758489 38.788135 "edge1"   17.241510 38.788135 "edge2" 
GEOSEARCH Sicily FROMLONLAT 15 37 BYRADIUS 200 km ASC
GEOSEARCH Sicily FROMLONLAT 15 37 BYBOX 400 400 km ASC WITHCOORD WITHDIST
{{% /redis-cli %}}

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="geosearch-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* If no `WITH*` option is specified, an [Array reply](../../develop/reference/protocol-spec#arrays) of matched member names
* If `WITHCOORD`, `WITHDIST`, or `WITHHASH` options are specified, the command returns an [Array reply](../../develop/reference/protocol-spec#arrays) of arrays, where each sub-array represents a single item:
    * The distance from the center as a floating point number, in the same unit specified in the radius.
    * The Geohash integer.
    * The coordinates as a two items x,y array (longitude,latitude).

-tab-sep-

One of the following:
* If no `WITH*` option is specified, an [Array reply](../../develop/reference/protocol-spec#arrays) of matched member names
* If `WITHCOORD`, `WITHDIST`, or `WITHHASH` options are specified, the command returns an [Array reply](../../develop/reference/protocol-spec#arrays) of arrays, where each sub-array represents a single item:
    * The distance from the center as a floating point number, in the same unit specified in the radius.
    * The Geohash integer.
    * The coordinates as a two items x,y array (longitude,latitude).

{{< /multitabs >}}
