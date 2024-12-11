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


