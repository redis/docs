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
- movablekeys
complexity: O(N+log(M)) where N is the number of elements inside the bounding box
  of the circular area delimited by center and radius and M is the number of items
  inside the index.
deprecated_since: 6.2.0
description: Queries a geospatial index for members within a distance from a coordinate,
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
      startfrom: 6
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
      startfrom: 6
    type: keyword
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
  update: true
linkTitle: GEORADIUS
replaced_by: '[`GEOSEARCH`]({{< relref "/commands/geosearch" >}}) and [`GEOSEARCHSTORE`]({{<
  relref "/commands/geosearchstore" >}}) with the `BYRADIUS` argument'
since: 3.2.0
summary: Queries a geospatial index for members within a distance from a coordinate,
  optionally stores the result.
syntax_fmt: "GEORADIUS key longitude latitude radius <M | KM | FT | MI>\n  [WITHCOORD]\
  \ [WITHDIST] [WITHHASH] [COUNT\_count [ANY]] [ASC | DESC]\n  [STORE\_key | STOREDIST\_\
  key]"
syntax_str: "longitude latitude radius <M | KM | FT | MI> [WITHCOORD] [WITHDIST] [WITHHASH]\
  \ [COUNT\_count [ANY]] [ASC | DESC] [STORE\_key | STOREDIST\_key]"
title: GEORADIUS
---
Return the members of a sorted set populated with geospatial information using [`GEOADD`]({{< relref "/commands/geoadd" >}}), which are within the borders of the area specified with the center location and the maximum distance from the center (the radius).

This manual page also covers the [`GEORADIUS_RO`]({{< relref "/commands/georadius_ro" >}}) and [`GEORADIUSBYMEMBER_RO`]({{< relref "/commands/georadiusbymember_ro" >}}) variants (see the section below for more information).

The common use case for this command is to retrieve geospatial items near a specified point not farther than a given amount of meters (or other units). This allows, for example, to suggest mobile users of an application nearby places.

The radius is specified in one of the following units:

* **m** for meters.
* **km** for kilometers.
* **mi** for miles.
* **ft** for feet.

The command optionally returns additional information using the following options:

* `WITHDIST`: Also return the distance of the returned items from the specified center. The distance is returned in the same unit as the unit specified as the radius argument of the command.
* `WITHCOORD`: Also return the longitude,latitude coordinates of the matching items.
* `WITHHASH`: Also return the raw geohash-encoded sorted set score of the item, in the form of a 52 bit unsigned integer. This is only useful for low level hacks or debugging and is otherwise of little interest for the general user.

The command default is to return unsorted items. Two different sorting methods can be invoked using the following two options:

* `ASC`: Sort returned items from the nearest to the farthest, relative to the center.
* `DESC`: Sort returned items from the farthest to the nearest, relative to the center.

By default all the matching items are returned. It is possible to limit the results to the first N matching items by using the **COUNT `<count>`** option.
When `ANY` is provided the command will return as soon as enough matches are found,
so the results may not be the ones closest to the specified point, but on the other hand, the effort invested by the server is significantly lower.
When `ANY` is not provided, the command will perform an effort that is proportional to the number of items matching the specified area and sort them,
so to query very large areas with a very small `COUNT` option may be slow even if just a few results are returned.

By default the command returns the items to the client. It is possible to store the results with one of these options:

* `STORE`: Store the items in a sorted set populated with their geospatial information.
* `STOREDIST`: Store the items in a sorted set populated with their distance from the center as a floating point number, in the same unit specified in the radius.

## Read-only variants

Since `GEORADIUS` and [`GEORADIUSBYMEMBER`]({{< relref "/commands/georadiusbymember" >}}) have a `STORE` and `STOREDIST` option they are technically flagged as writing commands in the Redis command table. For this reason read-only replicas will flag them, and Redis Cluster replicas will redirect them to the master instance even if the connection is in read-only mode (see the [`READONLY`]({{< relref "/commands/readonly" >}}) command of Redis Cluster).

Breaking the compatibility with the past was considered but rejected, at least for Redis 4.0, so instead two read-only variants of the commands were added. They are exactly like the original commands but refuse the `STORE` and `STOREDIST` options. The two variants are called [`GEORADIUS_RO`]({{< relref "/commands/georadius_ro" >}}) and [`GEORADIUSBYMEMBER_RO`]({{< relref "/commands/georadiusbymember_ro" >}}), and can safely be used in replicas.

## Examples

{{% redis-cli %}}
GEOADD Sicily 13.361389 38.115556 "Palermo" 15.087269 37.502669 "Catania"
GEORADIUS Sicily 15 37 200 km WITHDIST
GEORADIUS Sicily 15 37 200 km WITHCOORD
GEORADIUS Sicily 15 37 200 km WITHDIST WITHCOORD
{{% /redis-cli %}}

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | Deprecated as of Redis v6.2.0. |

## Return information

{{< multitabs id="georadius-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* If no `WITH*` option is specified, an [Array reply](../../develop/reference/protocol-spec#arrays) of matched member names
* If `WITHCOORD`, `WITHDIST`, or `WITHHASH` options are specified, the command returns an [Array reply](../../develop/reference/protocol-spec#arrays) of arrays, where each sub-array represents a single item:
    1. The distance from the center as a floating point number, in the same unit specified in the radius.
    1. The Geohash integer.
    1. The coordinates as a two items x,y array (longitude,latitude).
For example, the command `GEORADIUS Sicily 15 37 200 km WITHCOORD WITHDIST` will return each item in the following way:
`["Palermo","190.4424",["13.361389338970184","38.115556395496299"]]`

-tab-sep-

One of the following:
* If no `WITH*` option is specified, an [Array reply](../../develop/reference/protocol-spec#arrays) of matched member names
* If `WITHCOORD`, `WITHDIST`, or `WITHHASH` options are specified, the command returns an [Array reply](../../develop/reference/protocol-spec#arrays) of arrays, where each sub-array represents a single item:
    1. The distance from the center as a floating point number, in the same unit specified in the radius.
    1. The Geohash integer.
    1. The coordinates as a two items x,y array (longitude,latitude).
For example, the command `GEORADIUS Sicily 15 37 200 km WITHCOORD WITHDIST` will return each item in the following way:
`["Palermo","190.4424",["13.361389338970184","38.115556395496299"]]`

{{< /multitabs >}}
