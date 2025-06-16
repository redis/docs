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
- oss
- kubernetes
- clients
command_flags:
- readonly
complexity: O(1) for each member requested.
description: Returns members from a geospatial index as geohash strings.
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
linkTitle: GEOHASH
since: 3.2.0
summary: Returns members from a geospatial index as geohash strings.
syntax_fmt: GEOHASH key [member [member ...]]
syntax_str: '[member [member ...]]'
title: GEOHASH
---
Return valid [Geohash](https://en.wikipedia.org/wiki/Geohash) strings representing the position of one or more elements in a sorted set value representing a geospatial index (where elements were added using [`GEOADD`]({{< relref "/commands/geoadd" >}})).

Normally Redis represents positions of elements using a variation of the Geohash
technique where positions are encoded using 52 bit integers. The encoding is
also different compared to the standard because the initial min and max
coordinates used during the encoding and decoding process are different. This
command however **returns a standard Geohash** in the form of a string as
described in the [Wikipedia article](https://en.wikipedia.org/wiki/Geohash) and compatible with the [geohash.org](http://geohash.org) web site.

Geohash string properties
---

The command returns 11 characters Geohash strings, so no precision is lost
compared to the Redis internal 52 bit representation. The returned Geohashes
have the following properties:

1. They can be shortened removing characters from the right. It will lose precision but will still point to the same area.
2. It is possible to use them in `geohash.org` URLs such as `http://geohash.org/<geohash-string>`. This is an [example of such URL](http://geohash.org/sqdtr74hyu0).
3. Strings with a similar prefix are nearby, but the contrary is not true, it is possible that strings with different prefixes are nearby too.

## Examples

{{% redis-cli %}}
GEOADD Sicily 13.361389 38.115556 "Palermo" 15.087269 37.502669 "Catania"
GEOHASH Sicily Palermo Catania
{{% /redis-cli %}}

## Return information

{{< multitabs id="geohash-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): an array where each element is the Geohash corresponding to each member name passed as an argument to the command.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): An array where each element is the Geohash corresponding to each member name passed as an argument to the command.

{{< /multitabs >}}
