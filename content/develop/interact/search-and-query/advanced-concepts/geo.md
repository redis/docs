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
lets you store geographical locations in the fields of JSON objects.
You can then use queries to find the objects by their location.
For example, if you add the locations of a set of shops, you can
find all the shops within 5km of a user's position.

Redis uses coordinate points to represent geospatial locations.
You can store individual points but you can also
use a set of points to define a polygon shape (the shape of a
town, for example). You can query several types of interactions
between points and shapes, such as whether a point lies within
a shape or whether two shapes overlap.

You can interpret coordinates either as geographical longitude
and latitude or as Cartesian coordinates on a flat plane.
Geographical coordinates are ideal for large real-world locations
and areas (such as towns and countries). Cartesian coordinates
are more suitable for smaller areas (such as rooms in a building)
or for games, simulations, and other artificial scenarios.

## Storing geospatial data



## Specifying geospatial data in queries

Redis Query Engine uses the
[*Well-Known Text* (WKT)](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry)
format for geospatial data, specifically the `POINT` and `POLYGON`
constructs. Add fields containing WKT data to your JSON objects,
then add 

### `POINT` data


