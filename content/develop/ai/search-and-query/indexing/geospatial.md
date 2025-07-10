---
aliases:
- /develop/interact/search-and-query/indexing/geoindex
- /develop/interact/search-and-query/advanced-concepts/geo
- /develop/ai/search-and-query/indexing/geo
- /develop/ai/search-and-query/indexing/geospatial
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
description: How to index and query geospatial data including points and shapes
linkTitle: Geospatial indexing
title: Geospatial indexing
weight: 35
math: true
---

You can store and query geographical locations and geometric shapes using Redis geospatial indexing. This feature enables location-based searches, proximity queries, and spatial relationship analysis.

{{< note >}}Don't confuse geospatial indexing in Redis Query Engine with the [Geospatial data type]({{< relref "/develop/data-types/geospatial" >}}) that Redis also supports. The data type is intended for simpler use cases, while geospatial indexing provides more advanced format options and query capabilities.{{< /note >}}

## Use cases

Geospatial indexing enables powerful location-based applications:

- **Store locator**: Find shops within 5km of a user's position
- **Delivery zones**: Determine if an address falls within delivery boundaries  
- **Real estate**: Search properties within specific neighborhoods or districts
- **Gaming**: Track player positions and detect collisions in virtual worlds
- **IoT tracking**: Monitor device locations and geofenced areas

## Coordinate systems

Redis supports two coordinate systems:

- **Geographical coordinates**: Longitude and latitude for real-world locations (towns, countries)
- **Cartesian coordinates**: X,Y coordinates on a flat plane for smaller areas (building floors, game maps)

## Field types

Redis provides two geospatial field types with different capabilities:

| Feature | GEO | GEOSHAPE |
|---------|-----|----------|
| **Format** | Longitude-latitude pairs | Well-Known Text (WKT) |
| **Shapes** | Points only | Points and polygons |
| **Queries** | Radius searches | Spatial relationships |
| **Complexity** | Simple | Advanced |
| **Use case** | Basic location queries | Complex spatial analysis |

## GEO fields

GEO fields store simple point locations using longitude-latitude pairs.

### Format

Store coordinates as strings with longitude first:

```json
{
  "name": "Coffee Shop",
  "location": "-104.991531, 39.742043"
}
```

Or as JSON arrays for multiple locations:

```json
{
  "name": "Chain Store", 
  "locations": [
    "-104.991531, 39.742043",
    "-105.0618814, 40.5150098"
  ]
}
```

### Create GEO index

```sql
FT.CREATE stores ON JSON PREFIX 1 store: SCHEMA 
  $.name AS name TEXT
  $.location AS location GEO
```

### Add GEO data

```sql
JSON.SET store:1 $ '{
  "name": "Downtown Coffee",
  "location": "-104.991531, 39.742043",
  "city": "Denver"
}'

JSON.SET store:2 $ '{
  "name": "Mountain View Cafe", 
  "location": "-105.0618814, 40.5150098",
  "city": "Boulder"
}'
```

### Query GEO fields

Find locations within a radius:

```sql
# Find stores within 50 miles of coordinates
FT.SEARCH stores '@location:[-104.800644 38.846127 50 mi]'

# Find stores within 10 kilometers  
FT.SEARCH stores '@location:[-104.800644 38.846127 10 km]'
```

Supported distance units:
- `m` - meters
- `km` - kilometers  
- `mi` - miles
- `ft` - feet

## GEOSHAPE fields

GEOSHAPE fields support both points and polygons using Well-Known Text (WKT) format.

### Supported shapes

**POINT**: Single coordinate location
```
POINT (2 2)
POINT (-104.991531 39.742043)
```

**POLYGON**: Closed shape defined by coordinate sequence
```
POLYGON ((1 1, 1 3, 3 3, 3 1, 1 1))
```

**Important**: 
- Polygons require double parentheses
- First and last coordinates must be identical (closed shape)
- Use clockwise or counter-clockwise winding order consistently

### Create GEOSHAPE index

```sql
FT.CREATE zones ON JSON PREFIX 1 zone: SCHEMA
  $.name AS name TEXT
  $.boundary AS boundary GEOSHAPE
```

### Add GEOSHAPE data

```sql
# Point location
JSON.SET zone:1 $ '{
  "name": "City Center",
  "boundary": "POINT (-104.991531 39.742043)"
}'

# Polygon area
JSON.SET zone:2 $ '{
  "name": "Downtown District", 
  "boundary": "POLYGON ((-105.01 39.74, -105.01 39.76, -104.99 39.76, -104.99 39.74, -105.01 39.74))"
}'
```

### Query GEOSHAPE fields

GEOSHAPE supports four spatial relationship queries:

**WITHIN**: Find shapes completely inside another shape
```sql
FT.SEARCH zones '@boundary:[WITHIN $area]' 
  PARAMS 2 area "POLYGON ((-105.02 39.73, -105.02 39.77, -104.98 39.77, -104.98 39.73, -105.02 39.73))"
  DIALECT 2
```

**CONTAINS**: Find shapes that completely contain another shape
```sql
FT.SEARCH zones '@boundary:[CONTAINS $point]'
  PARAMS 2 point "POINT (-105.00 39.75)"
  DIALECT 2
```

**INTERSECTS**: Find shapes that overlap another shape
```sql
FT.SEARCH zones '@boundary:[INTERSECTS $area]'
  PARAMS 2 area "POLYGON ((-105.00 39.745, -105.00 39.755, -104.995 39.755, -104.995 39.745, -105.00 39.745))"
  DIALECT 2
```

**DISJOINT**: Find shapes that don't overlap another shape
```sql
FT.SEARCH zones '@boundary:[DISJOINT $area]'
  PARAMS 2 area "POLYGON ((-105.00 39.745, -105.00 39.755, -104.995 39.755, -104.995 39.745, -105.00 39.745))"
  DIALECT 2
```

## Practical examples

### Store locator with delivery zones

```sql
# Create index for stores with delivery areas
FT.CREATE delivery ON JSON PREFIX 1 business: SCHEMA
  $.name AS name TEXT
  $.location AS location GEO
  $.delivery_zone AS delivery_zone GEOSHAPE

# Add store with circular delivery area (approximated as polygon)
JSON.SET business:1 $ '{
  "name": "Pizza Palace",
  "location": "-104.991531, 39.742043", 
  "delivery_zone": "POLYGON ((-105.01 39.72, -105.01 39.76, -104.97 39.76, -104.97 39.72, -105.01 39.72))"
}'

# Find stores that deliver to a specific address
FT.SEARCH delivery '@delivery_zone:[CONTAINS $address]'
  PARAMS 2 address "POINT (-105.00 39.75)"
  DIALECT 2
```

### Gaming world with regions

```sql
# Create index for game regions
FT.CREATE gameworld ON JSON PREFIX 1 region: SCHEMA
  $.name AS name TEXT
  $.area AS area GEOSHAPE
  $.type AS type TAG

# Add different region types
JSON.SET region:1 $ '{
  "name": "Safe Zone",
  "type": "safe",
  "area": "POLYGON ((10 10, 10 20, 20 20, 20 10, 10 10))"
}'

JSON.SET region:2 $ '{
  "name": "Battle Arena", 
  "type": "pvp",
  "area": "POLYGON ((25 25, 25 35, 35 35, 35 25, 25 25))"
}'

# Find what region a player is in
FT.SEARCH gameworld '@area:[CONTAINS $player]'
  PARAMS 2 player "POINT (15 15)"
  DIALECT 2
```

## Limitations and considerations

### Geographical coordinate limitations

Planet Earth is shaped more like an [ellipsoid](https://en.wikipedia.org/wiki/Earth_ellipsoid) than a perfect sphere. Redis uses a spherical coordinate system that closely approximates Earth's shape but isn't exact.

**For most applications**: The approximation works very well
**For high precision needs**: Don't rely on geospatial indexing for critical applications requiring exact GPS positioning (emergency response, surveying)

### Performance considerations

- **GEO queries**: Very fast for radius searches
- **GEOSHAPE queries**: More complex, especially for large polygons
- **Index size**: Geospatial indexes are generally compact
- **Query complexity**: INTERSECTS and CONTAINS are more expensive than WITHIN

### Best practices

1. **Choose the right field type**:
   - Use GEO for simple point-radius queries
   - Use GEOSHAPE for complex spatial relationships

2. **Optimize polygon complexity**:
   - Keep polygons simple when possible
   - Avoid highly detailed boundaries for better performance

3. **Coordinate order**:
   - GEO: Always longitude first, then latitude
   - GEOSHAPE: Follow WKT standard (X Y or longitude latitude)

4. **Test with real data**:
   - Verify coordinate systems match your application needs
   - Test query performance with realistic data volumes

5. **Use appropriate units**:
   - Choose distance units that match your application scale
   - Consider user expectations (miles vs kilometers)

## Next steps

- Learn about [field and type options]({{< relref "/develop/ai/search-and-query/indexing/field-and-type-options" >}}) for other field types
- Explore [geospatial queries]({{< relref "/develop/ai/search-and-query/query/geo-spatial" >}}) for advanced search patterns
- See [query syntax]({{< relref "/develop/ai/search-and-query/advanced-concepts/query_syntax" >}}) for combining geospatial with other queries
