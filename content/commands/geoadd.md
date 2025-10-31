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
- arguments:
  - display_text: nx
    name: nx
    token: NX
    type: pure-token
  - display_text: xx
    name: xx
    token: XX
    type: pure-token
  name: condition
  optional: true
  since: 6.2.0
  type: oneof
- display_text: change
  name: change
  optional: true
  since: 6.2.0
  token: CH
  type: pure-token
- arguments:
  - display_text: longitude
    name: longitude
    type: double
  - display_text: latitude
    name: latitude
    type: double
  - display_text: member
    name: member
    type: string
  multiple: true
  name: data
  type: block
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
complexity: O(log(N)) for each item added, where N is the number of elements in the
  sorted set.
description: Adds one or more members to a geospatial index. The key is created if
  it doesn't exist.
group: geo
hidden: false
history:
- - 6.2.0
  - Added the `CH`, `NX` and `XX` options.
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
linkTitle: GEOADD
since: 3.2.0
summary: Adds one or more members to a geospatial index. The key is created if it
  doesn't exist.
syntax_fmt: "GEOADD key [NX | XX] [CH] longitude latitude member [longitude\n  latitude\
  \ member ...]"
syntax_str: '[NX | XX] [CH] longitude latitude member [longitude latitude member ...]'
title: GEOADD
---
Adds the specified geospatial items (longitude, latitude, name) to the specified key. Data is stored into the key as a sorted set, in a way that makes it possible to query the items with the [`GEOSEARCH`]({{< relref "/commands/geosearch" >}}) command.

The command takes arguments in the standard format x,y so the longitude must be specified before the latitude. There are limits to the coordinates that can be indexed: areas very near to the poles are not indexable.

The exact limits, as specified by EPSG:900913 / EPSG:3785 / OSGEO:41001 are the following:

* Valid longitudes are from -180 to 180 degrees.
* Valid latitudes are from -85.05112878 to 85.05112878 degrees.

The command will report an error when the user attempts to index coordinates outside the specified ranges.

**Note:** there is no **GEODEL** command because you can use [`ZREM`]({{< relref "/commands/zrem" >}}) to remove elements. The Geo index structure is just a sorted set.

## GEOADD options

`GEOADD` also provides the following options:

* **XX**: Only update elements that already exist. Never add elements.
* **NX**: Don't update already existing elements. Always add new elements.
* **CH**: Modify the return value from the number of new elements added, to the total number of elements changed (CH is an abbreviation of *changed*). Changed elements are **new elements added** and elements already existing for which **the coordinates was updated**. So elements specified in the command line having the same score as they had in the past are not counted. Note: normally, the return value of `GEOADD` only counts the number of new elements added.

Note: The **XX** and **NX** options are mutually exclusive.

How does it work?
---

The way the sorted set is populated is using a technique called
[Geohash](https://en.wikipedia.org/wiki/Geohash). Latitude and Longitude
bits are interleaved to form a unique 52-bit integer. We know
that a sorted set double score can represent a 52-bit integer without losing
precision.

This format allows for bounding box and radius querying by checking the 1+8 areas needed to cover the whole shape and discarding elements outside it. The areas are checked by calculating the range of the box covered, removing enough bits from the less significant part of the sorted set score, and computing the score range to query in the sorted set for each area.

What Earth model does it use?
---

The model assumes that the Earth is a sphere since it uses the Haversine formula to calculate distance. This formula is only an approximation when applied to the Earth, which is not a perfect sphere.
The introduced errors are not an issue when used, for example, by social networks and similar applications requiring this type of querying. 
However, in the worst case, the error may be up to 0.5%, so you may want to consider other systems for error-critical applications.

## Examples

{{% redis-cli %}}
GEOADD Sicily 13.361389 38.115556 "Palermo" 15.087269 37.502669 "Catania"
GEODIST Sicily Palermo Catania
GEORADIUS Sicily 15 37 100 km
GEORADIUS Sicily 15 37 200 km
{{% /redis-cli %}}

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="geoadd-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): When used without optional arguments, the number of elements added to the sorted set (excluding score updates).  If the CH option is specified, the number of elements that were changed (added or updated).

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): When used without optional arguments, the number of elements added to the sorted set (excluding score updates).  If the CH option is specified, the number of elements that were changed (added or updated).

{{< /multitabs >}}
