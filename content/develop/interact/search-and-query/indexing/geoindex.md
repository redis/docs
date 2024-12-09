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
        "location": "-104.991531, 39.742043"
    }
    ```
-   `GEOSHAPE`: This uses a subset of the 
    [Well-Known Text (WKT)](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry)
    format to specify both points and points and polygons. A
    `GEOSHAPE` field supports more advanced queries that `GEO`,
    such as checking if one shape overlaps or contains another.
    For example, the `rect` field of the JSON object shown
    below specifies a rectangular area:

    ```json
    {
        "rect": "POLYGON ((2 2.5, 2 3.5, 3.5 3.5, 3.5 2.5, 2 2.5))" 
    }
    ```
