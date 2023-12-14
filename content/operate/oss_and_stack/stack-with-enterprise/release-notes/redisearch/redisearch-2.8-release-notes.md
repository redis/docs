---
Title: RediSearch 2.8 release notes
alwaysopen: false
categories:
- docs
- operate
- stack
description: RESP3 support. Geo Polygon Search. Performance improvements.
linkTitle: v2.8 (July 2023)
min-version-db: '7.2'
min-version-rs: 7.2.4
weight: 91
---
## Requirements

RediSearch v2.8.9 requires:

- Minimum Redis compatibility version (database): 7.2
- Minimum Redis Enterprise Software version (cluster): 7.2.4

## v2.8.9 (October 2023)

This is a maintenance release for RediSearch 2.8.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

Details:

- Bug fixes:

  - [#3874](https://github.com/RediSearch/RediSearch/pull/3874) Heavy document updates causing memory growth once memory blocks weren't properly released (MOD-5181)
  - [#3967](https://github.com/RediSearch/RediSearch/pull/3967) Resharding optimizations causing the process to get stuck (MOD-5874, MOD-5864)
  - [#3892](https://github.com/RediSearch/RediSearch/pull/3892) After cleaning the index the GC could cause corruption on unique values (MOD-5815)
  - [#3853](https://github.com/RediSearch/RediSearch/pull/3853) Queries with `WITHCURSOR` making memory growth since `CURSOR` wasn't invalidated in the shards (MOD-5580)

- Improvements:

  - [#3938](https://github.com/RediSearch/RediSearch/pull/3938) Propagating error messages in multiple shards database, instead of failing silently (MOD-5211)
  - [#3903](https://github.com/RediSearch/RediSearch/pull/3903) Added support for Rocky Linux 9 and RHEL9 (MOD-5759)

## v2.8.8 (September 2023)

This is a maintenance release for RediSearch 2.8.

Update urgency: `SECURITY`: There are security fixes in the release.

Details:

- Security and privacy:

  - [#3788](https://github.com/RediSearch/RediSearch/pull/3788) Don’t expose internal cluster commands (MOD-5706)
  - [#3844](https://github.com/RediSearch/RediSearch/pull/3844) Limits maximum phonetic length avoiding to be exploit (MOD 5767)

- Bug fixes:

  - [#3771](https://github.com/RediSearch/RediSearch/pull/3771) Broken `lower()` and `upper()` functions on `APPLY` stage in `FT.AGGREGATE` in `DIALECT 3` (MOD-5041)
  - [#3752](https://github.com/RediSearch/RediSearch/pull/3752) Setting low `MAXIDLE` parameter value in `FT.AGGREGATE` cause a crash (MOD-5608)
  - [#3780](https://github.com/RediSearch/RediSearch/pull/3780) Wrong document length calculation causing incorrect score values (MOD-5622)
  - [#3808](https://github.com/RediSearch/RediSearch/pull/3808) `LOAD` step after a `FILTER` step could cause a crash on `FT.AGGREGATE` (MOD-5267)
  - [#3823](https://github.com/RediSearch/RediSearch/pull/3823) `APPLY` or `FILTER` parser leak (MOD-5751)
  - [#3837](https://github.com/RediSearch/RediSearch/pull/3837) Connection using TLS fail on Redis 7.2 (MOD-5768)
  - [#3856](https://github.com/RediSearch/RediSearch/pull/3856) Adding new nodes to OSS cluster causing a crash (MOD-5778)
  - [#3854](https://github.com/RediSearch/RediSearch/pull/3854) Vector range query could cause Out-of-Memory due to a memory corruption (MOD-5791)

- Improvements:

  - [#3534](https://github.com/RediSearch/RediSearch/pull/3534) Vector Similarity 0.7.1 (MOD-5624)

## v2.8 GA (v2.8.4) (July 2023)

This is the General Availability release of RediSearch 2.8.

### Headlines

RediSearch 2.8 introduces support for RESP3, new features, performance improvements, and bug fixes.

### What's new in 2.8.4

This new major version introduces new and frequently asked for Geo Polygon Search, adding the `GEOSHAPE` field type that supports polygon shapes using [WKT notation](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry). Besides the current `GEO` (alias for `GEOPOINT`) used in geo range queries, we add support for `POLYGON` and `POINT` as new geo shape formats (new `GEOSHAPE`). In addition, 2.8 brings performance improvements for `SORT BY` operations using `FT.SEARCH` and `FT.AGGREGATE`, and new `FORMAT` for enhanced responses on `FT.SEARCH` and `FT.AGGREGATE` in RESP3 only.

Features:

- Introduce support for geo polygon shapes and queries:

  - Adding `GEOSHAPE` [field type](https://redis.io/commands/ft.create/) to map polygons in the `SCHEMA` on `FT.CREATE` (MOD-4798)

  - Support for polygons `POLYGON` and `POINT` using [WKT notation](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry), for example `POLYGON((lon1 lat1, lon2 lat2, ...))`

  - Adjust the [query syntax](https://redis.io/commands/ft.search/#examples) on `FT.SEARCH` for polygons using the predicate `@geom:[OPERATOR $poly]` and defining polygon in WKT format as `PARAMS 2 poly "POLYGON((10 20, ...))"` using `DIALECT 3`

  - Initially `WITHIN` and `CONTAINS` operators with `GEOSHAPES` for now

  - Support multiple coordinate systems: cartesian (X,Y) with the flag `FLAT` for flat earth and geographic (lon, lat) using the flag `SPHERICAL` (MOD-5303). Geographic coordinate system using spherical indexing as default (`SPHERICAL`)

  - Add memory usage per Geometry Index in the `FT.INFO` response report (MOD-5278)

- Introduce performance optimization for sorting operations on `FT.SEARCH` and `FT.AGGREGATE` as default on `DIALECT 4`. It will improve performance in 4 different scenarios, listed below:

  - Skip Sorter - applied when there is no sort of any kind. The query can return once it reaches the `LIMIT` requested results.

  - Partial Range - applied when there is a `SORTBY` a numeric field, with no filter or filter by the same numeric field, the query iterates on a range large enough to satisfy the `LIMIT` requested results.

  - Hybrid - applied when there is a `SORTBY` a numeric field in addition to another non-numeric filter. Some results will get filtered, and the initial range may not be large enough. The iterator then is rewinded with the following ranges, and an additional iteration takes place to collect `LIMIT` requested results.

  - No optimization - If there is a sort by score or by non-numeric field, there is no other option but to retrieve all results and compare their values.

- Add `WITHCOUNT` argument that allow return accurate counts for the query results with sorting. This operation processes all results in order to get accurate count, being less performant than the optimized option (default behavior on `DIALECT 4`) (MOD-5311)

- New `FORMAT` argument in `FT.SEARCH` and `FT.AGGREGATE` to retrieve the results as JSON strings or RESP3 hierarchical structures (RESP3 only) (MOD-5390)

Improvements (since 2.8.3):

- [#3717](https://github.com/RediSearch/RediSearch/pull/3717) - Polygon shapes validation and orientation correction when clockwise (MOD-5575)

- [#3534](https://github.com/RediSearch/RediSearch/pull/3534) - Vector Similarity \[[0.7.0](https://github.com/RedisAI/VectorSimilarity/releases/tag/v0.7.0)\]

- [#3657](https://github.com/RediSearch/RediSearch/pull/3657) - Allow GC calls for all tiered indexes in the schema

- [#3701](https://github.com/RediSearch/RediSearch/pull/3701) - HNSW is now using data blocks to store vectors and metadata instead of array

Changed behavior:

- [#3355](https://github.com/RediSearch/RediSearch/pull/3355), [#3635](https://github.com/RediSearch/RediSearch/pull/3635) Expired keys deleted from replica's index, returning an empty array instead of `nil` (MOD-4739)

{{<note>}}
- The version inside Redis will be 2.8.4 in semantic versioning. Since the version of a module in Redis is numeric, we could not add a GA flag.

- Minimal Redis version: 7.2

- If indexing and querying RedisJSON data structures, this version is best combined with RedisJSON 2.6 (v2.6.0 onwards).
{{</note>}}
