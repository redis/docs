---
Title: RediSearch 2.10 release notes
alwaysopen: false
categories:
- docs
- operate
- stack
description: New vector data types. Enhanced indexing capabilities. Simplified query syntax. Expanded geospatial search.
linkTitle: v2.10 (July 2024)
min-version-db: '7.4'
min-version-rs: 7.6 (TBD)
weight: 90
---
## Requirements

RediSearch v2.10.7 requires:

- Minimum Redis compatibility version (database): 7.4
- Minimum Redis Enterprise Software version (cluster): 7.6 (TBD)

## v2.10.7 (Septermber 2024)

This is a maintenance release for RediSearch 2.10

Update urgency: `HIGH` : There is a critical bug that may affect a subset of users. Upgrade!

Bug Fixes
- https://github.com/RediSearch/RediSearch/pull/4941 Adjusting the module configuration to avoid routing overload on the first shard in a clustered database (MOD-7505)
- https://github.com/RediSearch/RediSearch/pull/4950 `FT.PROFILE` on `AGGREGATE` numeric queries could cause a crash due to reuse of an internal CURSOR in a large range of numeric values (MOD-7454)

## v2.10.6 (August 2024):

This is a maintenance release for RediSearch 2.10.

Update urgency: `HIGH` - There is a critical bug that may affect a subset of users. Upgrade!

Bug fixes:
- [#4916](https://github.com/redisearch/redisearch/pull/4916) - Union query, similar to `"is|the"`, starting with 2 [storwords](https://redis.io/docs/latest/develop/interact/search-and-query/advanced-concepts/stopwords/) could cause a crash (MOD-7495)
- [#4895](https://github.com/redisearch/redisearch/pull/4895) - `FT.AGGREGATE` with `VERBATIM` option is not handled by the shards in cluster mode (MOD-7463) 
- [#4922](https://github.com/redisearch/redisearch/pull/4922) - Counting twice the field statistics at `#search` section of `INFO` response (MOD-7339)

## v2.10 GA (v2.10.5) (July 2024)

This is the General Availability release of RediSearch 2.10

### Headlines:

This latest RediSearch introduces memory-efficient vector data types, enhanced indexing capabilities with support for empty and missing fields, simplified query syntax, and expanded geospatial search features.

### What's new in 2.10.5

This new major version introduces new `BFLOAT16` and `FLOAT16` vector data types, reducing memory consumed by vectors while preserving accuracy. This update also includes highly-requested support for indexing empty and missing values and enhances the developer experience for queries with exact matching capabilities. Developers can now match `TAG` fields without needing to escape special characters, making the onboarding process and use of the query syntax easier. Lastly, Geospatial search capabilities have been expanded with new `INTERSECT` and `DISJOINT` operators, and ergonomics have been improved by providing better reporting of the memory consumed by the index and exposing the full-text scoring in an aggregation pipeline.

Features:

- Enhancing exact matching queries with `TAG` avoiding escaping special meaning characters using the [simpler syntax](https://redis.io/docs/latest/develop/interact/search-and-query/query/exact-match/#tag-field) `'@tag:{"my-query%term"}'` and `NUMERIC` queries:
  - [#4802](https://github.com/RediSearch/RediSearch/pull/4802) - Using double quotes to wrap exact matching query terms such as `@email:{"test@redis.com"}` in `DIALECT 2` ( MOD-7299)
  - [#4676](https://github.com/RediSearch/RediSearch/pull/4676), [#4433](https://github.com/RediSearch/RediSearch/pull/4433) - Enhancing query parser to avoid unnecessary escaping (MOD-5756)
  - [#4527](https://github.com/RediSearch/RediSearch/pull/4527) - Enhancing exact matching queries for `NUMERIC` using single value `FT.SEARCH idx @numeric:[3456]` (MOD-6623)
  - [#4802](https://github.com/RediSearch/RediSearch/pull/4802) - Enabling support for single operators in `NUMERIC` queries such as equivalence `==`, difference `!=`, greater than `>` and `>=` and less than `<` and `<=` as in `FT.SEARCH idx '@numeric==3456'` (MOD-6749)

- Adding new keywords to support indexing empty values using `INDEXEMPTY` and missing values using `INDEXMISSING` per field in the `SCHEMA` while defining the [index](https://redis.io/docs/latest/commands/ft.create/) with `FT.CREATE`
  - [#4663](https://github.com/RediSearch/RediSearch/pull/4663), [#4721](https://github.com/RediSearch/RediSearch/pull/4721) - Indexing empty strings values `""` for `TAG` and `TEXT` fields (MOD-6540, MOD-7200)
  - [#4721](https://github.com/RediSearch/RediSearch/pull/4721) - Updating the query parser to support empty value queries for `TEXT` as `FT.SEARCH idx '@text_field:""'`or `FT.SEARCH idx '""'` and for `TAG` as in `FT.SEARCH idx '@tag_field:{""}'` (MOD-7200)
  - [#4720](https://github.com/RediSearch/RediSearch/pull/4720), [#4635](https://github.com/RediSearch/RediSearch/pull/4635) - Indexing missing values for all field types introducing the query syntax function `ismissing(@field)` enabling query for missing fields as in `FT.SEARCH idx 'ismissing(@text)'` (MOD-6532)


- Enabling new vector data types reducing memory consumed by vectors with the new `BFLOAT16` and `FLOAT16`
  - [#4674](https://github.com/RediSearch/RediSearch/pull/4674) - Adding support `BFLOAT16` and `FLOAT16` in the [vector index definition](https://redis.io/docs/latest/develop/interact/search-and-query/advanced-concepts/vectors/#creation-attributes-per-algorithm) (MOD-6765, MOD-6776)

- Exposing the full-text score values during the aggregation pipeline using `ADDSCORE`. When calling the scores you can use `@__score` in the pipeline as in `FT.AGGREGATE idx 'hello' ADDSCORES SORTBY 2 @__score DESC`
  - [#4859](https://github.com/RediSearch/RediSearch/pull/4859) - Expose scores to `FT.AGGREGATE` pipeline (MOD-7190)

- [#4227](https://github.com/RediSearch/RediSearch/pull/4227) - Adding support for new operators `INTERSECT` and `DISJOINT` when querying for `GEOSHAPE` [polygons](https://redis.io/docs/latest/develop/interact/search-and-query/query/geo-spatial/) (MOD-6178)


Bug fixes (since 2.10.4):
- [#4854](https://github.com/RediSearch/RediSearch/pull/4854) - Avoid expansion on stemming from numeric values (MOD-7025)

Improvements (since 2.10.4):
- [#4865](https://github.com/RediSearch/RediSearch/pull/4865) - Add coverage for cleaning garbage entries when indexing missing fields (MOD-7415)

{{< note >}}
- The version inside Redis will be 2.10.5 in semantic versioning. Since the version of a module in Redis is numeric, we could not add a Release Candidate flag.
- Minimal Redis version: 7.4
- If indexing and querying RedisJSON data structures, this version is best combined with RedisJSON 2.8 (v2.8.2 onwards)
{{< /note >}}
