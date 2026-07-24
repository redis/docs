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
{{< note >}}
This command's behavior varies in clustered Redis environments. See the [multi-key operations]({{< relref "/develop/using-commands/multi-key-operations" >}}) page for more information.
{{< /note >}}


This command is similar to [`GEOSEARCH`]({{< relref "/commands/geosearch" >}}), but it stores the result in the provided `destination`.

This command replaces the now deprecated [`GEORADIUS`]({{< relref "/commands/georadius" >}}) and [`GEORADIUSBYMEMBER`]({{< relref "/commands/georadiusbymember" >}}).

By default, it stores the results in the `destination` sorted set with their geospatial information.

When using the `STOREDIST` option, the command stores the items in a sorted set populated with their distance from the center of the circle or box, as a floating-point number, in the same unit specified for that shape.

## Required arguments

<details open><summary><code>destination</code></summary>

The key to store the results in.

</details>

<details open><summary><code>source</code></summary>

The geospatial index key to search.

</details>

Query center points:

<details open><summary><code>FROMMEMBER member</code></summary>

Use the position of the existing `member` as the center of the search. Mutually exclusive with `FROMLONLAT`.

</details>

<details open><summary><code>FROMLONLAT longitude latitude</code></summary>

Use the given coordinates as the center of the search. Mutually exclusive with `FROMMEMBER`.

</details>

Query shape options:

<details open><summary><code>BYRADIUS radius M | KM | FT | MI</code></summary>

Search within a circle of the given `radius` in the specified unit. Mutually exclusive with `BYBOX`.

</details>

<details open><summary><code>BYBOX width height M | KM | FT | MI</code></summary>

Search within an axis-aligned box of the given `width` and `height` in the specified unit. Mutually exclusive with `BYRADIUS`.

</details>

## Optional arguments

<details open><summary><code>ASC | DESC</code></summary>

Sort the results by distance from the center: nearest first (`ASC`) or farthest first (`DESC`).

</details>

<details open><summary><code>COUNT count [ANY]</code></summary>

Return at most `count` matches. With `ANY`, the command returns as soon as enough matches are found — faster, but the results may be unsorted.

</details>

<details open><summary><code>STOREDIST</code></summary>

Store the distance from the center as the sorted-set score, instead of the geohash-encoded position.

</details>

## Examples

{{% redis-cli %}}
redis> GEOADD Sicily 13.361389 38.115556 "Palermo" 15.087269 37.502669 "Catania"
(integer) 2
redis> GEOADD Sicily 12.758489 38.788135 "edge1"   17.241510 38.788135 "edge2"
(integer) 2
redis> GEOSEARCHSTORE key1 Sicily FROMLONLAT 15 37 BYBOX 400 400 km ASC COUNT 3
(integer) 3
redis> GEOSEARCH key1 FROMLONLAT 15 37 BYBOX 400 400 km ASC WITHCOORD WITHDIST WITHHASH
1) 1) "Catania"
   2) "56.4413"
   3) (integer) 3479447370796909
   4) 1) "15.087267458438873"
      2) "37.50266842333162"
2) 1) "Palermo"
   2) "190.4424"
   3) (integer) 3479099956230698
   4) 1) "13.361389338970184"
      2) "38.1155563954963"
3) 1) "edge2"
   2) "279.7403"
   3) (integer) 3481342659049484
   4) 1) "17.241510450839996"
      2) "38.78813451624225"
redis> GEOSEARCHSTORE key2 Sicily FROMLONLAT 15 37 BYBOX 400 400 km ASC COUNT 3 STOREDIST
(integer) 3
redis> ZRANGE key2 0 -1 WITHSCORES
1) "Catania"
2) "56.4412578701582"
3) "Palermo"
4) "190.44242984775784"
5) "edge2"
6) "279.7403417843143"
{{% /redis-cli %}}

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
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
