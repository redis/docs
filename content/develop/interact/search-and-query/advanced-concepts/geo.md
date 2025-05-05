---
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
description: Learn how to use geospatial fields and perform geospatial queries in Redis
linkTitle: Geospatial
math: true
title: Geospatial
weight: 14
---

Redis Query Engine supports geospatial data. This feature
lets you store geographical locations and geometric shapes
in the fields of JSON objects.

{{< note >}}Take care not to confuse the geospatial indexing
features in Redis Query Engine with the
[Geospatial data type]({{< relref "/develop/data-types/geospatial" >}})
that Redis also supports. Although there are some similarities between
these two features, the data type is intended for simpler use
cases and doesn't have the range of format options and queries
available in Redis Query Engine.
{{< /note >}}

You can index these fields and use queries to find the objects
by their location or the relationship of their shape to other shapes.
For example, if you add the locations of a set of shops, you can
find all the shops within 5km of a user's position or determine
which ones are within the boundary of a particular town.

Redis uses coordinate points to represent geospatial locations.
You can store individual points but you can also
use a set of points to define a polygon shape (the shape of a
town, for example). You can query several types of interactions
between points and shapes, such as whether a point lies within
a shape or whether two shapes overlap.

Redis can interpret coordinates either as geographical longitude
and latitude or as Cartesian coordinates on a flat plane.
Geographical coordinates are ideal for large real-world locations
and areas (such as towns and countries). Cartesian coordinates
are more suitable for smaller areas (such as rooms in a building)
or for games, simulations, and other artificial scenarios.

## Storing geospatial data

Redis supports two different
[schema types]({{< relref "/develop/interact/search-and-query/basic-constructs/field-and-type-options" >}})
for geospatial data:

-   [`GEO`](#geo): This uses a simple format where individual geospatial
    points are specified as numeric longitude-latitude pairs.
    
-   [`GEOSHAPE`](#geoshape): [Redis Open Source]({{< relref "/operate/oss_and_stack" >}}) also
    supports `GEOSHAPE` indexing in v7.2 and later.
    This uses a subset of the 
    [Well-Known Text (WKT)](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry)
    format to specify both points and polygons using either geographical
    coordinates or Cartesian coordinates. A
    `GEOSHAPE` field supports more advanced queries than `GEO`,
    such as checking if one shape overlaps or contains another.

The sections below describe these schema types in more detail.

## `GEO`

A `GEO` index lets you represent geospatial data either as
a string containing a longitude-latitude pair (for example,
"-104.991531, 39.742043") or as a JSON array of these
strings. Note that the longitude value comes first in the
string.

For example, you could index the `location` fields of the
the [JSON]({{< relref "/develop/data-types/json" >}}) objects
shown below as `GEO`:

```json
{
    "description": "Navy Blue Slippers",
    "price": 45.99,
    "city": "Denver",
    "location": "-104.991531, 39.742043"
}

{
    "description": "Bright Red Boots",
    "price": 185.75,
    "city": "Various",
    "location": [
        "-104.991531, 39.742043",
        "-105.0618814,40.5150098"
    ]
}
```

`GEO` fields allow only basic point and radius queries.
For example, the query below finds products within a 100 mile radius of Colorado Springs
(Longitude=-104.800644, Latitude=38.846127).

```bash
FT.SEARCH productidx '@location:[-104.800644 38.846127 100 mi]'
```

See [Geospatial queries]({{< relref "/develop/interact/search-and-query/query/geo-spatial" >}})
for more information about the available query options and see
[Geospatial indexing]({{< relref "/develop/interact/search-and-query/indexing/geoindex" >}})
for examples of indexing `GEO` fields.

## `GEOSHAPE`

Fields indexed as `GEOSHAPE` support the `POINT` and `POLYGON` primitives from the
[Well-Known Text](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry)
representation of geometry. The `POINT` primitive defines a single point
in a similar way to a `GEO` field.
The `geom` field of the example JSON object shown below specifies a point
(in Cartesian coordinates, using the standard x,y order):

```json
{
    "name": "Purple Point",
    "geom": "POINT (2 2)"
}
```

The `POLYGON` primitive can approximate the outline of any shape using a
sequence of points. Specify the coordinates of the corners in the order they
occur around the shape (either clockwise or counter-clockwise) and ensure the
shape is "closed" by making the final coordinate exactly the same as the first.

Note that `POLYGON` requires double parentheses around the coordinate list.
This is because you can specify additional shapes as a comma-separated list
that define "holes" within the enclosing polygon. The holes must have the opposite
winding order to the outer polygon (so, if the outer polygon uses a clockwise winding
order, the holes must use counter-clockwise).
The `geom` field of the example JSON object shown below specifies a
square using Cartesian coordinates in a clockwise winding order:

```json
{
    "name": "Green Square",
    "geom": "POLYGON ((1 1, 1 3, 3 3, 3 1, 1 1))"
}
```

The following examples define one `POINT` and three `POLYGON` primitives,
which are shown in the image below:

```
POINT (2 2)
POLYGON ((1 1, 1 3, 3 3, 3 1, 1 1))
POLYGON ((2 2.5, 2 3.5, 3.5 3.5, 3.5 2.5, 2 2.5))
POLYGON ((3.5 1, 3.75 2, 4 1, 3.5 1))
```

{{< image filename="/images/dev/rqe/geoshapes.jpg" >}}

You can run various types of queries against a geospatial index. For
example, the query below returns one primitive that lies within the boundary
of the green square (from the example above) but omits the square itself:

```bash
> FT.SEARCH geomidx "(-@name:(Green Square) @geom:[WITHIN $qshape])" PARAMS 2 qshape "POLYGON ((1 1, 1 3, 3 3, 3 1, 1 1))" RETURN 1 name DIALECT 2

1) (integer) 1
2) "shape:4"
3) 1) "name"
   2) "[\"Purple Point\"]"
```

There are four query operations that you can use with `GEOSHAPE` fields:

-   `WITHIN`: Find points or shapes that lie entirely within an
    enclosing shape that you specify in the query.
-   `CONTAINS`: Find shapes that completely contain the specified point
    or shape.
-   `INTERSECTS`: Find shapes whose boundary overlaps another specified
    shape.
-   `DISJOINT`: Find shapes whose boundary does not overlap another specified
    shape.

See
[Geospatial queries]({{< relref "/develop/interact/search-and-query/query/geo-spatial" >}})
for more information about these query types and see
[Geospatial indexing]({{< relref "/develop/interact/search-and-query/indexing/geoindex" >}})
for examples of indexing `GEOSHAPE` fields.

## Limitations of geographical coordinates

Planet Earth is actually shaped more like an
[ellipsoid](https://en.wikipedia.org/wiki/Earth_ellipsoid) than a perfect sphere.
The spherical coordinate system used by Redis Query Engine is a close
approximation to the shape of the Earth but not exact. For most practical
uses of geospatial queries, the approximation works very well, but you
shouldn't rely on it if you need very precise location data (for example, to track
the GPS locations of boats in an emergency response system).
