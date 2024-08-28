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

RediSearch v2.6.20 requires:

- Minimum Redis compatibility version (database): 6.0.16
- Minimum Redis Enterprise Software version (cluster): 6.2.8

## v2.6.20 (July 2024)

This is a maintenance release for RediSearch 2.6

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

- Bug fixes:
  - [#4755](https://github.com/RediSearch/RediSearch/pull/4755) - Correct return the maximum value for negative values when using `MAX` reducer (MOD-7252)
  - [#4733](https://github.com/RediSearch/RediSearch/pull/4733) - Separators ignored when escaping backslash `\` after the escaped character such as in `hello\\,world` ignoring `,` (MOD-7240)
  - [#4717](https://github.com/RediSearch/RediSearch/pull/4717) - Sorting by multiple fields as in `SORTBY 2 @field1 @field2` was ignoring the subsequent field (MOD-7206)

- Improvements:
  - [#4793](https://github.com/RediSearch/RediSearch/pull/4793) - Add character validations to simple string replies and escape it when required(MOD-7258)
  - [#4769](https://github.com/RediSearch/RediSearch/pull/4769) - Indicate which value is missing on the error message at the aggregation pipeline (MOD-7201)
  - [#4746](https://github.com/RediSearch/RediSearch/pull/4746) - `GROUPBY` recursion cleanup (MOD-7245)

## v2.6.19 (June 2024)

This is a maintenance release for RediSearch 2.6

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

- Bug fixes:

  - [#4616](https://github.com/RediSearch/RediSearch/pull/4616) Shards become unresponsive when using FT.AGGREGATE with APPLY 'split(...)' (MOD-6759)
  - [#4557](https://github.com/RediSearch/RediSearch/pull/4557) FT.EXPLAIN returns additional } when querying using wildcards (MOD-6768)
  - [#4647](https://github.com/RediSearch/RediSearch/pull/4647) FT.DROPINDEX with DD flag deleted keys in one AA cluster but not the others (MOD-1855)

- Improvements:

  - [#4599](https://github.com/RediSearch/RediSearch/pull/4599) Report additional memory consumed by the TAG and TEXT tries (MOD-5902)
  - [#4688](https://github.com/RediSearch/RediSearch/pull/4688) Add missing FT.INFO fields when used within a cluster (MOD-6920)

## v2.6.18 (April 2024)

This is a maintenance release for RediSearch 2.6.

Update urgency: `LOW`: No need to upgrade unless there are new features you want to use.

Details:

- Bug fixes:

  - [#4557](https://github.com/RediSearch/RediSearch/pull/4557) Additional "`}`" on wildcards replies for `FT.EXPLAIN` (MOD-6768)

## v2.6.17 (April 2024)

This is a maintenance release for RediSearch 2.6.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

Details:

- Bug fixes:

  - [#4524](https://github.com/RediSearch/RediSearch/pull/4524) `FT.CURSOR READ` in a numeric query causing a crash (MOD-6597)
  - [#4543](https://github.com/RediSearch/RediSearch/pull/4543) `FT.SEARCH` accessing an inexistent memory address causes a crash if using deprecated `FT.ADD` command (MOD-6599)
  - [#4535](https://github.com/RediSearch/RediSearch/pull/4535) `FT.PROFILE` with incorrect arguments could cause a crash on cluster setup (MOD-6791)
  - [#4540](https://github.com/RediSearch/RediSearch/pull/4540) Unfree memory from an existing RDB while re-indexing loading a new RDB could cause a crash (MOD-6831, 6810)
  - [#4485](https://github.com/RediSearch/RediSearch/pull/4485) Some parameter settings using just prefixes instead of full values were working (MOD-6709)

- Improvements:

  - [#4502](https://github.com/RediSearch/RediSearch/pull/4502) Handle error properly when trying to execute Search commands on cluster setup as part of `MULTI ... EXEC` or LUA script (MOD-6541)

## v2.6.16 (March 2024)

This is a maintenance release for RediSearch 2.6.

Update urgency: `MODERATE` : Program an upgrade of the server, but it's not urgent.

Details:

- Bug fixes:

  - [#4477](https://github.com/RediSearch/RediSearch/pull/4477) Split `INFIX` and `SUFFIX` report on `FT.EXPLAIN` and `FT.EXPLAINCLI` (MOD-6186)
  - [#4468](https://github.com/RediSearch/RediSearch/pull/4468) Memory leak upon suffix query for a `TAG` indexed with `WITHSUFFIXTRIE` (MOD-6644)
  - [#4407](https://github.com/RediSearch/RediSearch/pull/4407) Clustered `FT.SEARCH` hangs forever without replying when an invalid topology is found (MOD-6557)
  - [#4359](https://github.com/RediSearch/RediSearch/pull/4359) Searching for a synonym will iterate in the same group multiple times, causing a performance hit (MOD-6490)
  - [#4310](https://github.com/RediSearch/RediSearch/pull/4310) Memory tracking on cluster setups causing high memory usage and potentially Out-of-Memory (MOD-6123, MOD-5639)

## v2.6.15 (December 2023)

This is a maintenance release for RediSearch 2.6.

Update urgency: `HIGH` : There is a critical bug that may affect a subset of users. Upgrade!

Details:

- Bug fixes:

  - [#4244](https://github.com/RediSearch/RediSearch/pull/4244), [#4255](https://github.com/RediSearch/RediSearch/pull/4255) Profiling `FT.AGGREGATE` using the `WITHCURSOR` flag causes a crash due to timeout (MOD-5512)
  - [#4238](https://github.com/RediSearch/RediSearch/pull/4238) Memory excessively growing on databases caused by unbalanced nodes on inverted index trie (MOD-5880, MOD-5952, MOD-6003) 
  - [#3995](https://github.com/RediSearch/RediSearch/pull/3995) `FT.CURSOR READ` with geo queries causing a crash when data is updated between the cursor reads (MOD-5646) 
  - [#4155](https://github.com/RediSearch/RediSearch/pull/4155) `FT.SEARCH` not responding when using TLS encryption on Amazon Linux 2 (MOD-6012)

- Improvements:

  - [#4176](https://github.com/RediSearch/RediSearch/pull/4176) Initialization of the maximum numeric value range leading to a better balance of the index leaf splitting (MOD-6232) 
  - [#4123](https://github.com/RediSearch/RediSearch/pull/4123) Possibly problematic index name alias check-in command multiplexing (MOD-5945)
  - [#4195](https://github.com/RediSearch/RediSearch/pull/4195) Query optimization when predicate contains multiple `INTERSECTION` (AND) of `UNION` (OR) (MOD-5910)

## v2.6.14 (November 2023)

This is a maintenance release for RediSearch 2.6.

Update urgency: `SECURITY`: There are security fixes in the release.

Details:

- Bug fixes:

  - [#3783](https://github.com/RediSearch/RediSearch/pull/3783) Broken lower and upper `APPLY` functions in `FT.AGGREGATE` on `DIALECT 3` (MOD-5041)
  - [#3823](https://github.com/RediSearch/RediSearch/pull/3823) `APPLY` or `FILTER` expression causing a leak (MOD-5751)
  - [#3899](https://github.com/RediSearch/RediSearch/pull/3899) Connection using TLS fail on Redis (MOD-5768)
  - [#3910](https://github.com/RediSearch/RediSearch/pull/3910) Heavy document updates causing memory growth if memory blocks weren't properly released (MOD-5181)(MOD-5757)
  - [#3928](https://github.com/RediSearch/RediSearch/pull/3928) Queries with `WITHCURSOR` making memory growth since `CURSOR` wasn't invalidated in the shards (MOD-5580)
  - [#3946](https://github.com/RediSearch/RediSearch/pull/3946) Vector range query could cause Out-of-Memory due to memory corruption (MOD-5791)
  - [#3972](https://github.com/RediSearch/RediSearch/pull/3972) Adding new nodes to OSS cluster can cause a crash (MOD-5778)
  - [#3957](https://github.com/RediSearch/RediSearch/pull/3957) After cleaning the index, the GC could corrupt unique values (MOD-5815)
  - [#4002](https://github.com/RediSearch/RediSearch/pull/4002) Setting a low `MAXIDLE` parameter value in `FT.AGGREGATE` causes a crash (MOD-5608)

- Security and privacy:

  - [#3844](https://github.com/RediSearch/RediSearch/pull/3844) Limits maximum phonetic length to avoid vulnerability (MOD 5767)

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
In addition, the 2.6 release is all about **multi-value indexing and querying of attributes** for any attribute type ( [Text]({{< relref "/develop/interact/search-and-query/indexing/" >}}#index-json-arrays-as-text), [Tag]({{< relref "/develop/interact/search-and-query/indexing/" >}}#index-json-arrays-as-tag), [Numeric]({{< relref "/develop/interact/search-and-query/indexing/" >}}#index-json-arrays-as-numeric), [Geo]({{< relref "/develop/interact/search-and-query/indexing/" >}}#index-json-arrays-as-geo) and [Vector]({{< relref "/develop/interact/search-and-query/indexing/" >}}#index-json-arrays-as-vector)) defined by a [JSONPath]({{< relref "/develop/data-types/json/path" >}}) leading to an array or to multiple scalar values.
Lastly, this version adds support for indexing double-precision floating-point vectors and range queries from a given vector.

### What's new in 2.6

### Details

- Improvements:

  - [#2886](https://github.com/RediSearch/RediSearch/pull/2886) Support for [wildcard queries]({{< relref "/develop/interact/search-and-query/advanced-concepts/query_syntax" >}}#wildcard-matching) for TEXT and TAG fields, where
    - `?` matches any single character
    - `*` matches zero or more characters
    - use `'` and `\` for escaping, other special characters are ignored
    - [#2932](https://github.com/RediSearch/RediSearch/pull/2932) Optimized wildcard query support (i.e., suffix trie)
  - Multi-value indexing and querying
    - [#2819](https://github.com/RediSearch/RediSearch/pull/2819), [#2947](https://github.com/RediSearch/RediSearch/pull/2947) Multi-value text search - perform full-text search on an [array of strings or on a JSONPath]({{< relref "/develop/interact/search-and-query/indexing/" >}}#index-json-arrays-as-tag) leading to multiple strings
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
