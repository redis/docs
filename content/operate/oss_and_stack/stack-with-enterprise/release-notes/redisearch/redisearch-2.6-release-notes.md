---
Title: RediSearch 2.6 release notes
alwaysopen: false
categories:
- docs
- operate
- stack
description: Search using wildcard queries for TEXT and TAG fields, multi-value indexing
  and querying of attributes for any attribute type, and indexing double-precision
  floating-point vectors and range queries from a given vector.
linkTitle: v2.6 (November 2022)
min-version-db: 6.0.16
min-version-rs: 6.2.8
weight: 92
---
## Requirements

RediSearch v2.6.12 requires:

- Minimum Redis compatibility version (database): 6.0.16
- Minimum Redis Enterprise Software version (cluster): 6.2.8

## v2.6.12 (July 2023)

This is a maintenance release for RediSearch 2.6.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

Details:

- Bug fixes:

  - [#3557](https://github.com/RediSearch/RediSearch/pull/3557) `TIMEOUT` configuration on `FT.AGGREGATE` query being ignored (MOD-5208)
  - [#3552](https://github.com/RediSearch/RediSearch/pull/3552) `FT.CURSOR READ` on `JSON` numeric queries not returning results (MOD-4830)
  - [#3606](https://github.com/RediSearch/RediSearch/pull/3606) Update numeric inverted index `numEntries` avoiding excessive memory consumption (MOD-5181)
  - [#3597](https://github.com/RediSearch/RediSearch/pull/3597) Duplicating alias as output name on `FT.AGGREGATE` reducer (`REDUCE` argument) doesn't return results (MOD-5268)
  - [#3654](https://github.com/RediSearch/RediSearch/pull/3654) Added check for `@` prefix on `GROUPBY` fields returning an error instead of wrong results

- Improvements:

  - [#3628](https://github.com/RediSearch/RediSearch/pull/3628) Background indexing scanning performance (MOD-5259)
  - [#3259](https://github.com/RediSearch/RediSearch/pull/3259) Allow alias name beginning with `as`
  - [#3641](https://github.com/RediSearch/RediSearch/pull/3641) Indexing sanitizing trigger in heavy data updates scenario

## v2.6.9 (April 2023)

This is a maintenance release for RediSearch 2.6.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

Details:

- Bug fixes:

  - [#3468](https://github.com/RediSearch/RediSearch/pull/3468) KNN searching for 0 vectors with a filter resulted in crash (MOD-5006)
  - [#3499](https://github.com/RediSearch/RediSearch/pull/3499) `MAXSEARCHRESULTS` set to `0` causing `FT.SEARCH` to crash (MOD-5062)
  - [#3494](https://github.com/RediSearch/RediSearch/pull/3494) Removing `MAXSEARCHRESULTS` limit causes crash on `FT.AGGREGATE` (MOD-4974)
  - [#3504](https://github.com/RediSearch/RediSearch/pull/3504) Uninitialised vector similarity query parameter bug (MOD-5063)

- Improvements:

  - [#3430](https://github.com/RediSearch/RediSearch/pull/3430) Improve min-max heap structure for better readability and performance
  - [#3450](https://github.com/RediSearch/RediSearch/pull/3450) Display `NOHL` option in `FT.INFO` command
  - [#3534](https://github.com/RediSearch/RediSearch/pull/3534) Vector Similarity 0.6.1: Improve multi-value index deletion logic ([#346](https://github.com/RedisAI/VectorSimilarity/pull/346))

## v2.6.6 (March 2023)

This is a maintenance release for RediSearch 2.6.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Details:

- Bug fixes:

  - [#3403](https://github.com/RediSearch/RediSearch/pull/3403) Fix suffix and prefix matching when using `CASESENSITIVE` flag (MOD-4872)

- Improvements:

  - [#3397](https://github.com/RediSearch/RediSearch/pull/3397) Improve the Vecsim initial capacity default value

## v2.6.5 (February 2023)

This is a maintenance release for RediSearch 2.6.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

Details:

- Bug fixes:

  - [#3354](https://github.com/RediSearch/RediSearch/pull/3354) Library update preventing a crash during cluster failover (MOD-4560)
  - [#3357](https://github.com/RediSearch/RediSearch/pull/3357) Handling division by zero in expressions preventing nodes to restart (MOD-4296)
  - [#3332](https://github.com/RediSearch/RediSearch/pull/3332) Fix wildcards `*` queries on `DIALECT 2` and `DIALECT 3`

- Improvements:
  
  - [#3361](https://github.com/RediSearch/RediSearch/pull/3361) Enable the use of IPv6 for all cluster and module communication

## v2.6.4 (December 2022)

This is a maintenance release for RediSearch 2.6.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Details:

- Bug fixes:

  - [#3289](https://github.com/RediSearch/RediSearch/pull/3289) Potential crash when querying multiple fields (MOD-4639)
  - [#3279](https://github.com/RediSearch/RediSearch/pull/3279) Potential crash when querying using wildcard `*` on TAG field (MOD-4653)

- Improvements:
  
  - [#3256](https://github.com/RediSearch/RediSearch/pull/3256) Support IPv6 on cluster set command
  - [#3194](https://github.com/RediSearch/RediSearch/pull/3194) Add the query dialects that are in use to `FT.INFO` and `INFO MODULE` commands (MOD-4232)
  - [#3258](https://github.com/RediSearch/RediSearch/pull/3258) Add the module version and Redis version to `INFO MODULE`  

## v2.6 GA (v2.6.3) (November 2022)

This is the General Availability release of RediSearch 2.6.

### Highlights

This new major version introduces the ability to search using **wildcard queries** for TEXT and TAG fields. This enables the frequently requested feature **suffix search** (`*vatore` and `ant?rez` are now supported).
In addition, the 2.6 release is all about **multi-value indexing and querying of attributes** for any attribute type ( [Text]({{< relref "/integrate/redisvl/user-guide/get-started" >}}search/indexing_json/#index-json-arrays-as-text), [Tag]({{< relref "/integrate/redisvl/user-guide/get-started" >}}search/indexing_json/#index-json-arrays-as-tag), [Numeric]({{< relref "/integrate/redisvl/user-guide/get-started" >}}search/indexing_json/#index-json-arrays-as-numeric), [Geo]({{< relref "/integrate/redisvl/user-guide/get-started" >}}search/indexing_json/#index-json-arrays-as-geo) and [Vector]({{< relref "/integrate/redisvl/user-guide/get-started" >}}search/indexing_json/#index-json-arrays-as-vector)) defined by a [JSONPath]({{< relref "/integrate/redisvl/user-guide/get-started" >}}json/path/) leading to an array or to multiple scalar values.
Lastly, this version adds support for indexing double-precision floating-point vectors and range queries from a given vector.

### What's new in 2.6

### Details

- Improvements:

  - [#2886](https://github.com/RediSearch/RediSearch/pull/2886) Support for [wildcard queries]({{< relref "/integrate/redisvl/user-guide/get-started" >}}search/reference/query_syntax/#wildcard-matching) for TEXT and TAG fields, where
    - `?` matches any single character
    - `*` matches zero or more characters
    - use `'` and `\` for escaping, other special characters are ignored
    - [#2932](https://github.com/RediSearch/RediSearch/pull/2932) Optimized wildcard query support (i.e., suffix trie)
  - Multi-value indexing and querying
    - [#2819](https://github.com/RediSearch/RediSearch/pull/2819), [#2947](https://github.com/RediSearch/RediSearch/pull/2947) Multi-value text search - perform full-text search on an [array of strings or on a JSONPath]({{< relref "/integrate/redisvl/user-guide/get-started" >}}search/indexing_json/#index-json-arrays-as-tag) leading to multiple strings
    - [#3131](https://github.com/RediSearch/RediSearch/pull/3131) Geo [#3118](https://github.com/RediSearch/RediSearch/pull/3118) Vector [#2985](https://github.com/RediSearch/RediSearch/pull/2985) Numeric [#3180](https://github.com/RediSearch/RediSearch/pull/3180) Tag
    - [#3060](https://github.com/RediSearch/RediSearch/pull/3060) Return JSON rather than scalars from multi-value attributes.  This is enabled via Dialect 3 in order not to break existing applications.
    - Support indexing and querying of multi-value JSONPath attributes and/or arrays (requires JSON >2.4.1)
    - [#3182](https://github.com/RediSearch/RediSearch/pull/3182) Support for `SORTABLE` fields on JSON in an implicit un-normalized form (UNF)
  - [#3156](https://github.com/RediSearch/RediSearch/pull/3156) Vector similarity 0.5.1:
    - Better space optimization selection ([#175](https://github.com/RedisAI/VectorSimilarity/pull/175)) 
    - Aligning index capacity with block size ([#177](https://github.com/RedisAI/VectorSimilarity/pull/177)) 
    - [#3129](https://github.com/RediSearch/RediSearch/pull/3129) Support FLOAT64 as vector data type 
    - [#3176](https://github.com/RediSearch/RediSearch/pull/3176) Range query support
    - [#3105](https://github.com/RediSearch/RediSearch/pull/3105) Support query attributes for vector queries

- Bugs (since 2.6-RC1 / v2.6.1):

  - [#3197](https://github.com/RediSearch/RediSearch/pull/3197) Failure to create temporary indices
  - [#3098](https://github.com/RediSearch/RediSearch/pull/3098) Wrong return value in Geo query
  - [#3230](https://github.com/RediSearch/RediSearch/issues/3230) Use the correct total number of matching records

{{<note>}}
With this release, we stop supporting direct upgrades from RediSearch v1.4 and v1.6 that are End-of-Life. Such RDB files can still be upgraded to RediSearch 2.0 first.
{{</note>}}

{{<note>}}
If indexing and querying RedisJSON data structures, this version is best combined with RedisJSON 2.4 GA (v2.4.1 onwards).
{{</note>}}
