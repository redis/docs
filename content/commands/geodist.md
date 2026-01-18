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
- display_text: member1
  name: member1
  type: string
- display_text: member2
  name: member2
  type: string
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
  optional: true
  type: oneof
arity: -4
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
complexity: O(1)
description: Returns the distance between two members of a geospatial index.
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
linkTitle: GEODIST
railroad_diagram: /images/railroad/geodist.svg
since: 3.2.0
summary: Returns the distance between two members of a geospatial index.
syntax_fmt: GEODIST key member1 member2 [M | KM | FT | MI]
title: GEODIST
---
Return the distance between two members in the geospatial index represented by the sorted set.

Given a sorted set representing a geospatial index, populated using the [`GEOADD`]({{< relref "/commands/geoadd" >}}) command, the command returns the distance between the two specified members in the specified unit.

If one or both the members are missing, the command returns NULL.

The unit must be one of the following, and defaults to meters:

* **m** for meters.
* **km** for kilometers.
* **mi** for miles.
* **ft** for feet.

The distance is computed assuming that the Earth is a perfect sphere, so errors up to 0.5% are possible in edge cases.

## Examples

{{% redis-cli %}}
GEOADD Sicily 13.361389 38.115556 "Palermo" 15.087269 37.502669 "Catania"
GEODIST Sicily Palermo Catania
GEODIST Sicily Palermo Catania km
GEODIST Sicily Palermo Catania mi
GEODIST Sicily Foo Bar
{{% /redis-cli %}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="geodist-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Nil reply](../../develop/reference/protocol-spec#bulk-strings): one or both of the elements are missing.
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): distance as a double (represented as a string) in the specified units.

-tab-sep-

One of the following:
* [Null reply](../../develop/reference/protocol-spec#nulls): one or both of the elements are missing.
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): distance as a double (represented as a string) in the specified units.

{{< /multitabs >}}
