---
aliases:
- /develop/interact/search-and-query/indexing/geoindex
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
description: Options for indexing geospatial data
linkTitle: Geospatial
title: Geospatial indexing
weight: 3
---

Redis supports two different
[schema types]({{< relref "/develop/ai/search-and-query/indexing/field-and-type-options" >}})
for geospatial data:

-   [`GEO`](#geo): This uses a simple format where individual geospatial
    points are specified as numeric longitude-latitude pairs.
-   [`GEOSHAPE`](#geoshape): This uses a subset of the 
    [Well-Known Text (WKT)](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry)
    format to specify both points and polygons using either geographical
    coordinates or Cartesian coordinates.

The sections below explain how to index these schema types. See the
[Geospatial]({{< relref "/develop/ai/search-and-query/advanced-concepts/geo" >}})
reference page for a full description of both types.

## `GEO`

The following command creates a `GEO` index for JSON objects that contain
the geospatial data in a field called `location`:

{{< clients-example geoindex create_geo_idx >}}
> FT.CREATE productidx ON JSON PREFIX 1 product: SCHEMA $.location AS location GEO
OK
{{< /clients-example >}}

If you now add JSON objects with the `product:` prefix and a `location` field,
they will be added to the index automatically:

{{< clients-example geoindex add_geo_json >}}
> JSON.SET product:46885 $ '{"description": "Navy Blue Slippers","price": 45.99,"city": "Denver","location": "-104.991531, 39.742043"}'
OK
> JSON.SET product:46886 $ '{"description": "Bright Green Socks","price": 25.50,"city": "Fort Collins","location": "-105.0618814,40.5150098"}'
OK
{{< /clients-example >}}

The query below finds products within a 100 mile radius of Colorado Springs
(Longitude=-104.800644, Latitude=38.846127). This returns only the location in
Denver, but a radius of 200 miles would also include the location in Fort Collins:

{{< clients-example geoindex geo_query >}}
> FT.SEARCH productidx '@location:[-104.800644 38.846127 100 mi]'
1) "1"
2) "product:46885"
3) 1) "$"
   2) "{\"description\":\"Navy Blue Slippers\",\"price\":45.99,\"city\":\"Denver\",\"location\":\"-104.991531, 39.742043\"}"
{{< /clients-example >}}

See [Geospatial queries]({{< relref "/develop/ai/search-and-query/query/geo-spatial" >}})
for more information about the available options.

## `GEOSHAPE`

The following command creates an index for JSON objects that include
geospatial data in a field called `geom`. The `FLAT` option at the end
of the field definition specifies Cartesian coordinates instead of
the default spherical geographical coordinates. Use `SPHERICAL` in
place of `FLAT` to choose the coordinate space explicitly.

{{< clients-example geoindex create_gshape_idx >}}
> FT.CREATE geomidx ON JSON PREFIX 1 shape: SCHEMA $.name AS name TEXT $.geom AS geom GEOSHAPE FLAT
OK
{{< /clients-example >}}

Use the `shape:` prefix for the JSON objects to add them to the index:

{{< clients-example geoindex add_gshape_json >}}
> JSON.SET shape:1 $ '{"name": "Green Square", "geom": "POLYGON ((1 1, 1 3, 3 3, 3 1, 1 1))"}'
OK
> JSON.SET shape:2 $ '{"name": "Red Rectangle", "geom": "POLYGON ((2 2.5, 2 3.5, 3.5 3.5, 3.5 2.5, 2 2.5))"}'
OK
> JSON.SET shape:3 $ '{"name": "Blue Triangle", "geom": "POLYGON ((3.5 1, 3.75 2, 4 1, 3.5 1))"}'
OK
> JSON.SET shape:4 $ '{"name": "Purple Point", "geom": "POINT (2 2)"}'
OK
{{< /clients-example >}}

You can now run various geospatial queries against the index. For
example, the query below returns any shapes within the boundary
of the green square but omits the green square itself:

{{< clients-example geoindex gshape_query >}}
> FT.SEARCH geomidx "(-@name:(Green Square) @geom:[WITHIN $qshape])" PARAMS 2 qshape "POLYGON ((1 1, 1 3, 3 3, 3 1, 1 1))" RETURN 1 name DIALECT 2

1) (integer) 1
2) "shape:4"
3) 1) "name"
   2) "[\"Purple Point\"]"
{{< /clients-example >}}

You can also run queries to find whether shapes in the index completely contain
or overlap each other. See
[Geospatial queries]({{< relref "/develop/ai/search-and-query/query/geo-spatial" >}})
for more information.
