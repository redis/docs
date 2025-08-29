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
min-version-rs: 7.8
weight: 90
---
## Requirements

RediSearch v2.10.22 requires:

- Minimum Redis compatibility version (database): 7.4
- Minimum Redis Enterprise Software version (cluster): 7.8

## v2.10.22 (August 2025)

This is a maintenance release for RediSearch 2.10.

Update urgency: `HIGH` : There is a critical bug that may affect a subset of users. Upgrade!

Bug fixes:
- [#6600](https://github.com/redisearch/redisearch/pull/6600) `FLUSHDB` while active queries are still running could lead to a crash due to premature release of the CURSOR (MOD-10681).

Improvements:
- [#6664](https://github.com/redisearch/redisearch/pull/6664) Time measurement on `FT.PROFILE` using thread-independent clock mechanism (MOD-10622).
- [#6647](https://github.com/redisearch/redisearch/pull/6647) Response on RESP2/3 validation was inefficiently consuming excessive CPU cycles (MOD-9687).

## v2.10.21 (July 2025)

This is a maintenance release for RediSearch 2.10.

Update urgency: `LOW`: No need to upgrade unless there are new features you want to use.

Bug fixes:
- [#6405](https://github.com/redisearch/redisearch/pull/6405) Validate compatibility against RedisJSON version upon open key.

Improvements:
- [#6340](https://github.com/redisearch/redisearch/pull/6340) Handle excessive logging when processing JSON.DEL errors.

## v2.10.20 (June 2025)

This is a maintenance release for RediSearch 2.10.

Update urgency: `LOW` No need to upgrade unless there are new features you want to use.

Improvements:
- [#6279](https://github.com/redisearch/redisearch/pull/6279) Added a locking mechanism for collecting `FT.INFO` statistics when concurrently running the index sanitiser (MOD-10007, MOD-9761).

## v2.10.19 (June 2025)

This is a maintenance release for RediSearch 2.10.

Update urgency: `LOW` No need to upgrade unless there are new features you want to use.

Bug fixes:
- [#6211](https://github.com/redisearch/redisearch/pull/6211) Some languages (like Russian) could have multiple lower and upper case matches, causing index misbehaviour (MOD-9835).

Improvements:
- [#5637](https://github.com/redisearch/redisearch/pull/5637) Memory allocation when converting special UTF-8 symbols requires more memory (MOD-8799).

## v2.10.18 (May 2025)

This is a maintenance release for RediSearch 2.10.

Update urgency: `HIGH` : There is a critical bug that may affect a subset of users. Upgrade!

Bug fixes:
- [#6184](https://github.com/redisearch/redisearch/pull/6184) Reindexing from RDB with multiple vector indices could lead to a crash due to cluster health check - NodeWD (MOD-9220,MOD-8809)
- [#6028](https://github.com/redisearch/redisearch/pull/6028) `FT.CURSOR...DEL` while another thread is reading it could lead to a crash (MOD-9408,MOD-9432,MOD-9433,MOD-9434,MOD-9435)
- [#5967](https://github.com/redisearch/redisearch/pull/5967) Indexing documents using `TEXT` without the text in the documents leads to an `inf` or `nan` score (MOD-9423)
- [#6056](https://github.com/redisearch/redisearch/pull/6056) Avoid lazy expiration in background indexing for Active-Active setup preventing keys from expiring incorrectly (MOD-9486)
- [#6108](https://github.com/redisearch/redisearch/pull/6108) A timeout failure is returned when the `ON_TIMEOUT RETURN` policy is set to stop the collection of partial results - best effort (MOD-9612)

Improvements:
- [#6007](https://github.com/redisearch/redisearch/pull/6007) Parser for intersections on parentheses and sub-queries order won't affect full-text scores (MOD-9278)
- [#6020](https://github.com/redisearch/redisearch/pull/6020) Prevent access to the Redis key space when `LOAD...@__key` is used (MOD-9419)

## v2.10.17 (April 2025)

This is a maintenance release for RediSearch 2.10.

Update urgency: `HIGH` : There is a critical bug that may affect a subset of users. Upgrade!

Bug fixes:
- [#5859](https://github.com/redisearch/redisearch/pull/5859) Last query result using `FT.AGGREGATE` with `ON_TIMEOUT RETURN` and using multi-threading could be missing (MOD-9222)
- [#5858](https://github.com/redisearch/redisearch/pull/5858) Collecting empty results from shards during `FT.AGGREGATE` with RESP3 could cause a crash (MOD-9174)

Improvements:
- [#5938](https://github.com/redisearch/redisearch/pull/5938) Improved performance (reduced CPU time) of collecting vector index statistics(MOD-9354)
- [#5800](https://github.com/redisearch/redisearch/pull/5800) Improved accuracy of index memory reporting by correcting a bug that caused negative memory counts (MOD-5904)

## v2.10.15 (March 2025)

This is a maintenance release for RediSearch 2.10.

Update urgency: `HIGH` : There is a critical bug that may affect a subset of users. Upgrade!

Bug fixes:
- [#5788](https://github.com/redisearch/redisearch/pull/5788) Cursor with `SORTBY` is never depleted, blocking queries if the cursor limit is reached (MOD-8483)
- [#5788](https://github.com/redisearch/redisearch/pull/5788) Empty results with RESP3 due to the `TIMEOUT`, even if `ON_TIMEOUT` is set to `RETURN`(MOD-8482)
- [#5788](https://github.com/redisearch/redisearch/pull/5788) Cursor with RESP3 on `FT.AGGREGATE` is never depleted, blocking queries if cursor the limit is achieved (MOD-8515)
- [#5788](https://github.com/redisearch/redisearch/pull/5788) Using `FT.CURSOR READ` on queries that timed out led to fewer results than expected (MOD-8606)
- [#5810](https://github.com/redisearch/redisearch/pull/5810) The `total_results` field of the `FT.AGGREGATE` command is not correct in RESP3 (MOD-9054)

Improvements:
- [#5788](https://github.com/redisearch/redisearch/pull/5788) Corrected a coordinator race condition that prevented premature release, avoiding errors and inconsistencies during query executions (MOD-8794)

## v2.10.14 (March 2025)

This is a maintenance release for RediSearch 2.10.

Update urgency: `LOW` No need to upgrade unless there are new features you want to use.

Bug fixes:
- [#5704](https://github.com/redisearch/redisearch/pull/5704) Weights in the query string are ignored if using `SCORER BM25` (MOD-7896).

## v2.10.13 (February 2025)

This is a maintenance release for RediSearch 2.10.

Update urgency: `LOW` No need to upgrade unless there are new features you want to use.

Bug fixes:
- [#5646](https://github.com/redisearch/redisearch/pull/5646) `FT.SEARCH` using Cyrillic characters and wildcards delivering no results (MOD-7944)

## v2.10.12 (February 2025)

This is a maintenance release for RediSearch 2.10.

Update urgency: `HIGH` : There is a critical bug that may affect a subset of users. Upgrade!

Bug fixes:
- [#5596](https://github.com/redisearch/redisearch/pull/5596) Changes on the memory block reading logic could cause crash on `FT.SEARCH` with error "_Redis 7.4.2 crashed by signal: 11, si_code: 128"_

Known limitations:
- Only the first 128 characters of string fields are normalized to lowercase during ingestion (for example, on `HSET`).
    Example:

    ```
    HSET doc __score 1.0 name "idx1S...S" mynum 1          # Assume "S...S" is a string of 252 capital S's
    FT.CREATE "idx" SCHEMA "name" "TEXT" "mynum" "NUMERIC"
    FT.SEARCH "idx" "@name:idx1S...S"                      # Assume "S...S" is a string of 252 capital S's
    ```

    The `FT.SEARCH` command will return no documents.

## v2.10.11 (January 2025)

This is a maintenance release for RediSearch 2.10.

Update urgency: `HIGH` : There is a critical bug that may affect a subset of users. Upgrade!

Bug fixes:
- [#5536](https://github.com/redisearch/redisearch/pull/5536) Querying for the latest document added to the index may result in a crash if the last block is not read (MOD-8561).

## v2.10.10 (January 2025)

This is a maintenance release for RediSearch 2.10

Update urgency: `SECURITY`: There are security fixes in the release.

**Security and privacy**:
- [#5459](https://github.com/redisearch/redisearch/pull/5459) (CVE-2024-51737) Query: potential out-of-bounds write (MOD-8486)

Bug fixes:
- [#5392](https://github.com/redisearch/redisearch/pull/5392) `NOSTEM` option does not work on query, just on tokenisation (index creation) (MOD-7634)
- [#5300](https://github.com/redisearch/redisearch/pull/5300) Prefix/Infix/Suffix queries longer than 1024 chars could cause a crash (MOD-7882)
- [#5294](https://github.com/redisearch/redisearch/pull/5294) Expired keys while background indexing could cause cross slot error when using `replicaof` (MOD-7949)
- [#5282](https://github.com/redisearch/redisearch/pull/5282) `FT.CURSOR READ` retrieving deleted `TAG` fields cause a crash (MOD-8011)
- [#5424](https://github.com/redisearch/redisearch/pull/5424) `FT.AGGREGATE` on numeric fields lead to `failed_calls` count increase on clustered DBs (MOD-8058)
- [#5241](https://github.com/redisearch/redisearch/pull/5241) Memory count on `bytes_collected` by the index sanitiser with missing values (MOD-8097, MOD-8114)

Improvements:
- [#5257](https://github.com/redisearch/redisearch/pull/5257) Optimizing index consumed memory with the creation only upon write operations (MOD-8125)

## v2.10.7 (Septermber 2024)

This is a maintenance release for RediSearch 2.10

Update urgency: `HIGH` : There is a critical bug that may affect a subset of users. Upgrade!

Bug Fixes:
- https://github.com/RediSearch/RediSearch/pull/4941 Adjusting the module configuration to avoid routing overload on the first shard in a clustered database (MOD-7505)
- https://github.com/RediSearch/RediSearch/pull/4950 `FT.PROFILE` on `AGGREGATE` numeric queries could cause a crash due to reuse of an internal CURSOR in a large range of numeric values (MOD-7454)

## v2.10.6 (August 2024):

This is a maintenance release for RediSearch 2.10.

Update urgency: `HIGH` - There is a critical bug that may affect a subset of users. Upgrade!

Bug fixes:
- [#4916](https://github.com/redisearch/redisearch/pull/4916) - Union query, similar to `"is|the"`, starting with 2 [storwords](https://redis.io/docs/latest/develop/ai/search-and-query/advanced-concepts/stopwords/) could cause a crash (MOD-7495)
- [#4895](https://github.com/redisearch/redisearch/pull/4895) - `FT.AGGREGATE` with `VERBATIM` option is not handled by the shards in cluster mode (MOD-7463) 
- [#4922](https://github.com/redisearch/redisearch/pull/4922) - Counting twice the field statistics at `#search` section of `INFO` response (MOD-7339)

## v2.10 GA (v2.10.5) (July 2024)

This is the General Availability release of RediSearch 2.10

### Headlines:

This latest RediSearch introduces memory-efficient vector data types, enhanced indexing capabilities with support for empty and missing fields, simplified query syntax, and expanded geospatial search features.

### What's new in 2.10.5

This new major version introduces new `BFLOAT16` and `FLOAT16` vector data types, reducing memory consumed by vectors while preserving accuracy. This update also includes highly-requested support for indexing empty and missing values and enhances the developer experience for queries with exact matching capabilities. Developers can now match `TAG` fields without needing to escape special characters, making the onboarding process and use of the query syntax easier. Lastly, Geospatial search capabilities have been expanded with new `INTERSECT` and `DISJOINT` operators, and ergonomics have been improved by providing better reporting of the memory consumed by the index and exposing the full-text scoring in an aggregation pipeline.

Features:

- Enhancing exact matching queries with `TAG` avoiding escaping special meaning characters using the [simpler syntax](https://redis.io/docs/latest/develop/ai/search-and-query/query/exact-match/#tag-field) `'@tag:{"my-query%term"}'` and `NUMERIC` queries:
  - [#4802](https://github.com/RediSearch/RediSearch/pull/4802) - Using double quotes to wrap exact matching query terms such as `@email:{"test@redis.com"}` in `DIALECT 2` ( MOD-7299)
  - [#4676](https://github.com/RediSearch/RediSearch/pull/4676), [#4433](https://github.com/RediSearch/RediSearch/pull/4433) - Enhancing query parser to avoid unnecessary escaping (MOD-5756)
  - [#4527](https://github.com/RediSearch/RediSearch/pull/4527) - Enhancing exact matching queries for `NUMERIC` using single value `FT.SEARCH idx @numeric:[3456]` (MOD-6623)
  - [#4802](https://github.com/RediSearch/RediSearch/pull/4802) - Enabling support for single operators in `NUMERIC` queries such as equivalence `==`, difference `!=`, greater than `>` and `>=` and less than `<` and `<=` as in `FT.SEARCH idx '@numeric==3456'` (MOD-6749)

- Adding new keywords to support indexing empty values using `INDEXEMPTY` and missing values using `INDEXMISSING` per field in the `SCHEMA` while defining the [index](https://redis.io/docs/latest/commands/ft.create/) with `FT.CREATE`
  - [#4663](https://github.com/RediSearch/RediSearch/pull/4663), [#4721](https://github.com/RediSearch/RediSearch/pull/4721) - Indexing empty strings values `""` for `TAG` and `TEXT` fields (MOD-6540, MOD-7200)
  - [#4721](https://github.com/RediSearch/RediSearch/pull/4721) - Updating the query parser to support empty value queries for `TEXT` as `FT.SEARCH idx '@text_field:""'`or `FT.SEARCH idx '""'` and for `TAG` as in `FT.SEARCH idx '@tag_field:{""}'` (MOD-7200)
  - [#4720](https://github.com/RediSearch/RediSearch/pull/4720), [#4635](https://github.com/RediSearch/RediSearch/pull/4635) - Indexing missing values for all field types introducing the query syntax function `ismissing(@field)` enabling query for missing fields as in `FT.SEARCH idx 'ismissing(@text)'` (MOD-6532)


- Enabling new vector data types reducing memory consumed by vectors with the new `BFLOAT16` and `FLOAT16`
  - [#4674](https://github.com/RediSearch/RediSearch/pull/4674) - Adding support `BFLOAT16` and `FLOAT16` in the [vector index definition](https://redis.io/docs/latest/develop/ai/search-and-query/vectors/#creation-attributes-per-algorithm) (MOD-6765, MOD-6776)

- Exposing the full-text score values during the aggregation pipeline using `ADDSCORE`. When calling the scores you can use `@__score` in the pipeline as in `FT.AGGREGATE idx 'hello' ADDSCORES SORTBY 2 @__score DESC`
  - [#4859](https://github.com/RediSearch/RediSearch/pull/4859) - Expose scores to `FT.AGGREGATE` pipeline (MOD-7190)

- [#4227](https://github.com/RediSearch/RediSearch/pull/4227) - Adding support for new operators `INTERSECT` and `DISJOINT` when querying for `GEOSHAPE` [polygons](https://redis.io/docs/latest/develop/ai/search-and-query/query/geo-spatial/) (MOD-6178)


Bug fixes (since 2.10.4):
- [#4854](https://github.com/RediSearch/RediSearch/pull/4854) - Avoid expansion on stemming from numeric values (MOD-7025)

Improvements (since 2.10.4):
- [#4865](https://github.com/RediSearch/RediSearch/pull/4865) - Add coverage for cleaning garbage entries when indexing missing fields (MOD-7415)

{{< note >}}
- The version inside Redis will be 2.10.5 in semantic versioning. Since the version of a module in Redis is numeric, we could not add a Release Candidate flag.
- Minimal Redis version: 7.4
- If indexing and querying RedisJSON data structures, this version is best combined with RedisJSON 2.8 (v2.8.2 onwards)
- If one or more fields of a hash key expire after a query begins (using FT.SEARCH or FT.AGGREGATE), Redis does not account for these lazily expired fields. As a result, keys with expired fields may still be included in the query results, leading to potentially incorrect or inconsistent results.
{{< /note >}}
