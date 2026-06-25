---
acl_categories:
- '@write'
- '@geo'
- '@slow'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: member
  name: member
  type: string
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
- arguments:
  - display_text: key
    key_spec_index: 1
    name: storekey
    token: STORE
    type: key
  - display_text: key
    key_spec_index: 2
    name: storedistkey
    token: STOREDIST
    type: key
  name: store
  optional: true
  type: oneof
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
- movablekeys
complexity: O(N+log(M)) where N is the number of elements inside the bounding box
  of the circular area delimited by center and radius and M is the number of items
  inside the index.
deprecated_since: 6.2.0
description: Queries a geospatial index for members within a distance from a member,
  optionally stores the result.
doc_flags:
- deprecated
group: geo
hidden: false
history:
- - 6.2.0
  - Added the `ANY` option for `COUNT`.
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
- OW: true
  begin_search:
    spec:
      keyword: STORE
      startfrom: 5
    type: keyword
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
  update: true
- OW: true
  begin_search:
    spec:
      keyword: STOREDIST
      startfrom: 5
    type: keyword
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
  update: true
linkTitle: GEORADIUSBYMEMBER
railroad_diagram: /images/railroad/georadiusbymember.svg
replaced_by: '`GEOSEARCH` and `GEOSEARCHSTORE` with the `BYRADIUS` and `FROMMEMBER`
  arguments'
since: 3.2.0
summary: Queries a geospatial index for members within a distance from a member, optionally
  stores the result.
syntax_fmt: "GEORADIUSBYMEMBER key member radius <M | KM | FT | MI> [WITHCOORD]\n\
  \  [WITHDIST] [WITHHASH] [COUNT\_count [ANY]] [ASC | DESC] [STORE\_key\n  | STOREDIST\_\
  key]"
title: GEORADIUSBYMEMBER
---
{{< note >}}
This command's behavior varies in clustered Redis environments. See the [multi-key operations]({{< relref "/develop/using-commands/multi-key-operations" >}}) page for more information.
{{< /note >}}


This command is exactly like [`GEORADIUS`]({{< relref "/commands/georadius" >}}) with the sole difference that instead
of taking, as the center of the area to query, a longitude and latitude value, it takes the name of a member already existing inside the geospatial index represented by the sorted set.

The position of the specified member is used as the center of the query.

Please check the example below and the [`GEORADIUS`]({{< relref "/commands/georadius" >}}) documentation for more information about the command and its options.

Note that [`GEORADIUSBYMEMBER_RO`]({{< relref "/commands/georadiusbymember_ro" >}}) is also available since Redis 3.2.10 and Redis 4.0.0 in order to provide a read-only command that can be used in replicas. See the [`GEORADIUS`]({{< relref "/commands/georadius" >}}) page for more information.

## Required arguments

<details open><summary><code>key</code></summary>

The name of the key that holds the geospatial index (a sorted set).

</details>

<details open><summary><code>member</code></summary>

The member whose position is used as the center of the search.

</details>

<details open><summary><code>radius</code></summary>

The radius of the search circle, in the unit given by the following argument.

</details>

<details open><summary><code>M | KM | FT | MI</code></summary>

The unit for `radius`: meters (`M`), kilometers (`KM`), feet (`FT`), or miles (`MI`).

</details>

## Optional arguments

<details open><summary><code>WITHCOORD</code></summary>

Also return the longitude and latitude of each matching item.

</details>

<details open><summary><code>WITHDIST</code></summary>

Also return the distance of each matching item from the center, in the same unit as the radius.

</details>

<details open><summary><code>WITHHASH</code></summary>

Also return the raw 52-bit geohash-encoded score of each matching item.

</details>

<details open><summary><code>COUNT count [ANY]</code></summary>

Return at most `count` matches. With `ANY`, the command returns as soon as enough matches are found — faster, but the results may be unsorted.

</details>

<details open><summary><code>ASC | DESC</code></summary>

Sort the results by distance from the center: nearest first (`ASC`) or farthest first (`DESC`).

</details>

<details open><summary><code>STORE key</code></summary>

Store the results as a geospatial index in `key` instead of returning them. `STORE` and `STOREDIST` are mutually exclusive.

</details>

<details open><summary><code>STOREDIST key</code></summary>

Store the results in `key` as a sorted set of distances from the center, instead of returning them.

</details>

## Examples

{{% redis-cli %}}
GEOADD Sicily 13.583333 37.316667 "Agrigento"
GEOADD Sicily 13.361389 38.115556 "Palermo" 15.087269 37.502669 "Catania"
GEORADIUSBYMEMBER Sicily Agrigento 100 km
{{% /redis-cli %}}

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | Deprecated as of Redis v6.2.0. |

## Return information

{{< multitabs id="georadiusbymember-return-info" 
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
