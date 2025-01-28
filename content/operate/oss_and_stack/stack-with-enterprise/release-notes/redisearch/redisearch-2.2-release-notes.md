---
Title: RediSearch 2.2 release notes
alwaysopen: false
categories:
- docs
- operate
- stack
description: Search and index JSON documents. Profiling queries. Field aliasing.
linkTitle: v2.2 (November 2021)
min-version-db: 6.0.0
min-version-rs: 6.0.0
weight: 94
---
## Requirements

RediSearch v2.2.10 requires:

- Minimum Redis compatibility version (database): 6.0.0
- Minimum Redis Enterprise Software version (cluster): 6.0.0

## v2.2.10 (March 2022)

This is a maintenance release for RediSearch 2.2.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Details:

- Improvements:

  - Mac M1 support
  - [#2645](https://github.com/RediSearch/RediSearch/pull/2645) Ignore `NULL` values in JSON documents on indexing (prior behaviour would ignore the entire document)
  - [#2623](https://github.com/RediSearch/RediSearch/pull/2623) Improved Multi Sortby error message for `FT.SEARCH`

- Bug fixes:

  - [#2641](https://github.com/RediSearch/RediSearch/pull/2641) Memory leak in Coordinator
  - [#2651](https://github.com/RediSearch/RediSearch/pull/2651) Client freeze on docs expire during query
  - [#2670](https://github.com/RediSearch/RediSearch/pull/2670) Memory leak in RediSearch found in Active-Active (MOD-2518)

## v2.2.9 (March 2022)

This is a maintenance release for RediSearch 2.2.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Details:

- Improvements:

  - [#2605](https://github.com/RediSearch/RediSearch/pull/2605) Added support for `tls-key-file-pass` capability (MOD-2086)
  - [#2583](https://github.com/RediSearch/RediSearch/pull/2583) Release index-specific information off the main thread (performance enhancement)

- Bug fixes:

  - [#2436](https://github.com/RediSearch/RediSearch/pull/2436) When indexing JSON documents, filters cause no documents to be indexed (MOD-2214)
  - [#2507](https://github.com/RediSearch/RediSearch/pull/2507) `QUANTILE` aggregation function outputting wrong values (MOD-2432)
  - [#2521](https://github.com/RediSearch/RediSearch/pull/2521) `contains()` with an empty string argument leaves Redis hanging at CPU 100% indefinitely (MOD-2428)
  - [#2560](https://github.com/RediSearch/RediSearch/pull/2560) Free prefix and cursor efficiently for cases with many indices (MOD-2080)
  - [#2541](https://github.com/RediSearch/RediSearch/pull/2541) Numeric types for `FT.INFO` on coordinator
  - [#2553](https://github.com/RediSearch/RediSearch/pull/2553) Fix union high iterator
  - [#2404](https://github.com/RediSearch/RediSearch/pull/2404) Update coordination strategy of `FlatSearchCommandHandler`

## v2.2.7 (February 2022)

This is a maintenance release for RediSearch 2.2.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Details:

- Bug fixes:
  - [#2466](https://github.com/RediSearch/RediSearch/pull/2466) `FT.PROFILE` for `FT.AGGREGATE` on clustered databases
  - [#2473](https://github.com/RediSearch/RediSearch/pull/2473) `FT.PROFILE` with no result processor present
  - [#2490](https://github.com/RediSearch/RediSearch/pull/2490) Case sensitivity issue in searches of TAG field on JSON

- Improvements:
  - [#2469](https://github.com/RediSearch/RediSearch/pull/2469) Add API for TAG children query nodes

## v2.2.6 (January 2022)

This is a maintenance release for RediSearch 2.2.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Details:

- Bug fixes:

    - [#2362](https://github.com/RediSearch/RediSearch/pull/2362) Crash on empty field name
    - [#2407](https://github.com/RediSearch/RediSearch/pull/2407) Inconsistency with `FT.CREATE` and `ON`: return error for spec without fields parameters
    - [#2392](https://github.com/RediSearch/RediSearch/pull/2392) Remove limit on Geo field precision
    - [#2440](https://github.com/RediSearch/RediSearch/pull/2440) Fix in NOT(-) iterator
    - [#2414](https://github.com/RediSearch/RediSearch/pull/2414) Prevent server freeze when `FT.SEARCH` timeout while sorting
    - [#2386](https://github.com/RediSearch/RediSearch/pull/2386) Memory leak in numeric field index

- Improvements:

    - [#2424](https://github.com/RediSearch/RediSearch/pull/2424), [#2425](https://github.com/RediSearch/RediSearch/pull/2425) Performance improvements for numeric indices
    - [#2408](https://github.com/RediSearch/RediSearch/pull/2408) API: Added `RediSearch_IndexInfo`
    - [#2448](https://github.com/RediSearch/RediSearch/pull/2448) API: Added `setLang` and `setScore`

## v2.2.5 (November 2021)

This is the General Availability release of RediSearch 2.2.

### Headlines

#### Searching and indexing JSON documents

This release introduces the ability to [index, query, and full-text search JSON documents]({{<relref "/develop/interact/search-and-query/indexing">}}) using JSONPath queries.

On the schema creation `FT.CREATE`, it is now possible to map a JSONPath query with a field. When a JSON document is indexed, the value extracted by the JSONPath query is indexed in the given field.

 _This features require the module [RedisJSON 2.0](https://www.redisjson.io) to be installed._ 

#### Profiling queries

With the new `FT.PROFILE` command, it is now possible to profile in detail the execution time of several internal steps involved in the execution of `FT.SEARCH` and `FT.AGGREGATE`.
That way, it is possible to understand which part of the query is taking most of the resources.

#### Field aliasing

With the support of JSON document indexing, it is now possible to map a JSONPath query to an alias. Therefore, it is possible to index the same value in different indexing attributes with different indexing strategies.

{{<note>}}
As of RediSearch v2.2, index `fields` are now known as `attributes` in order to avoid confusion with hash fields. This change impacts the `FT.INFO` command's response, which might break clients.  It is advised to upgrade your application to the latest supported Redis clients prior to upgrading to RediSearch 2.2.
{{</note>}}

### Details

- Enhancements:
  - #[2337](https://github.com/redisearch/redisearch/issues/2337) Add support for Redis COPY command 
  - #[2243](https://github.com/redisearch/redisearch/issues/2243) Add `LOAD *` for `FT.AGGREGATE`
  - #[2207](https://github.com/redisearch/redisearch/issues/2207) Add multi value recursive decent tag
  - #[2188](https://github.com/redisearch/redisearch/issues/2188) Add `UNF` flag for `SORTABLE` fields
  - #[2184](https://github.com/redisearch/redisearch/issues/2184) LLAPI getter functions for score, language, and stopwords list
  - #[2133](https://github.com/redisearch/redisearch/issues/2133) JSON array can be stored in a TAG field
  - #[2153](https://github.com/redisearch/redisearch/issues/2153) Improve FT.INFO complexity to O(1) 
  - #[2138](https://github.com/redisearch/redisearch/issues/2138) Add `CASESENSITIVE` to `TAG` fields
  - #[2137](https://github.com/redisearch/redisearch/issues/2137) `FT.INFO` has identifier and attribute for fields

- Bug fixes:
  - #[2341](https://github.com/redisearch/redisearch/issues/2341) Fix score field for JSON
  - #[2325](https://github.com/redisearch/redisearch/issues/2325) Fix escaping for tags
  - #[2269](https://github.com/redisearch/redisearch/issues/2269) Remove empty tag values
  - #[2223](https://github.com/redisearch/redisearch/issues/2223) Replace NULL with empty iterator for child of negative iterator
  - #[2215](https://github.com/redisearch/redisearch/issues/2215) Update field limit on tags
  - #[2143](https://github.com/redisearch/redisearch/issues/2143) Partial JSON documents are not indexed
  - #[2109](https://github.com/redisearch/redisearch/issues/2109) Field loaded with 'AS' can't be used by functions

Notes:
This is the first GA version of 2.2. The version inside Redis will be 2.2.5 in semantic versioning.
_Since the version of a module in Redis is numeric, we could not add a GA flag._
