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
description: How to index and search geospatial data
linkTitle: Geo indexing
title: Geospatial indexing
weight: 3
---

Redis supports two different schema types for geospatial data:

-   `GEO`: This uses a simple format where individual geospatial
    points are specified as numeric longitude-latitude pairs.
    This type allows only basic point and radius queries.
    For example, you could index the `location` field of the
    the JSON object shown below as `GEO`:

    ```json
   {
        "description": "Navy Blue Slippers",
        "price": 45.99,
        "city": "Denver",
        "location": "-104.991531, 39.742043"
    }
    ```
-   `GEOSHAPE`: This uses a subset of the 
    [Well-Known Text (WKT)](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry)
    format to specify both points and polygons. A
    `GEOSHAPE` field supports more advanced queries that `GEO`,
    such as checking if one shape overlaps or contains another.
    For example, the `geom` field of the JSON object shown
    below specifies a point (in Cartesian coordinates):

    ```json
    {
        "name": "Purple Point",
        "geom": "POINT (2 2)"
    }
    ```

The sections below describe these schema types in more detail.

## `GEO`

A `GEO` index lets you represent geospatial data either as
a string containing a longitude-latitude pair (for example,
"-104.991531, 39.742043") or as a JSON array of these
strings. Note that the longitude value comes first in the
string.

The following command creates a `GEO` index for JSON objects
like the one shown in the example above:

FT.CREATE productidx ON JSON PREFIX 1 product: SCHEMA $.location AS location GEO

If you now add JSON objects with the `product:` prefix and a `location` field,
they will be added to the index automatically:

>JSON.SET product:46885 $ '{"description": "Navy Blue Slippers","price": 45.99,"city": "Denver","location": "-104.991531, 39.742043"}'
OK
>JSON.SET product:46886 $ '{"description": "Bright Green Socks","price": 25.50,"city": "Fort Collins","location": "-105.0618814,40.5150098"}'



> FT.SEARCH productidx '@location:[-104.800644 38.846127 100 mi]'
1) "1"
2) "product:46885"
3) 1) "$"
   2) "{\"description\":\"Navy Blue Slippers\",\"price\":45.99,\"city\":\"Denver\",\"location\":\"-104.991531, 39.742043\"}"