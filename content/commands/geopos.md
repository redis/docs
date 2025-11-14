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
- display_text: member
  multiple: true
  name: member
  optional: true
  type: string
arity: -2
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- kubernetes
- clients
command_flags:
- readonly
complexity: O(1) for each member requested.
description: Returns the longitude and latitude of members from a geospatial index.
group: geo
hidden: false
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
linkTitle: GEOPOS
since: 3.2.0
summary: Returns the longitude and latitude of members from a geospatial index.
syntax_fmt: GEOPOS key [member [member ...]]
syntax_str: '[member [member ...]]'
title: GEOPOS
---
Return the positions (longitude,latitude) of all the specified members of the geospatial index represented by the sorted set at *key*.

Given a sorted set representing a geospatial index, populated using the [`GEOADD`]({{< relref "/commands/geoadd" >}}) command, it is often useful to obtain back the coordinates of specified members. When the geospatial index is populated via [`GEOADD`]({{< relref "/commands/geoadd" >}}) the coordinates are converted into a 52 bit geohash, so the coordinates returned may not be exactly the ones used in order to add the elements, but small errors may be introduced.

The command can accept a variable number of arguments so it always returns an array of positions even when a single element is specified.

## Examples

{{% redis-cli %}}
GEOADD Sicily 13.361389 38.115556 "Palermo" 15.087269 37.502669 "Catania"
GEOPOS Sicily Palermo Catania NonExisting
{{% /redis-cli %}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="geopos-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): An array where each element is a two elements array representing longitude and latitude (x,y) of each member name passed as argument to the command. Non-existing elements are reported as [Nil reply](../../develop/reference/protocol-spec#bulk-strings) elements of the array.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): An array where each element is a two elements array representing longitude and latitude (x,y) of each member name passed as argument to the command. Non-existing elements are reported as [Null reply](../../develop/reference/protocol-spec#nulls) elements of the array.

{{< /multitabs >}}
