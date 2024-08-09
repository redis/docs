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

RediSearch v2.8.15 requires:

- Minimum Redis compatibility version (database): 7.2
- Minimum Redis Enterprise Software version (cluster): 7.2.4

## v2.8.15 (July 2024)

Update urgency: `HIGH` : There is a critical bug that may affect a subset of users. Upgrade!

- Bug fixes:
  - [#4754](https://github.com/RediSearch/RediSearch/pull/4754) - Correct return the maximum value for negative values when using `MAX` reducer (MOD-7252)
  - [#4737](https://github.com/RediSearch/RediSearch/pull/4737) - Separators ignored when escaping backslash `\` after the escaped character such as in `hello\\,world` ignoring `,` (MOD-7240)
  - [#4717](https://github.com/RediSearch/RediSearch/pull/4717) - Sorting by multiple fields `SORTBY 2 @field1 @field2` was ignoring the subsequent field(MOD-7206)
  - [#4803](https://github.com/RediSearch/RediSearch/pull/4803) - Keys expiring during query returning empty array (MOD-7010)
  - [#4794](https://github.com/RediSearch/RediSearch/pull/4794) - Index sanitiser (GC) trying to clean deleted numeric index could cause a crash (MOD-7303)

- Improvements:
  - [#4792](https://github.com/RediSearch/RediSearch/pull/4792) - Add character validations to simple string replies and escape it when required(MOD-7258)
  - [#4768](https://github.com/RediSearch/RediSearch/pull/4768) - Indicate which value is missing on the error message at the aggregation pipeline (MOD-7201)
  - [#4745](https://github.com/RediSearch/RediSearch/pull/4745) - `GROUPBY` recursion cleanup (MOD-7245)
  - [#4823](https://github.com/RediSearch/RediSearch/pull/4823) - Mechanism of keys expiration during the query execution clearing intermediate results

## v2.8.14 (June 2024)

This is a maintenance release for RediSearch 2.8

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

- Bug fixes:

  - [#4614](https://github.com/RediSearch/RediSearch/pull/4614) Shards become unresponsive when using `FT.AGGREGATE` with `APPLY 'split(...)'`(MOD-6759)
  - [#4556](https://github.com/RediSearch/RediSearch/pull/4556) `FT.EXPLAIN` returns additional `}` when querying using wildcards (MOD-6768)
  - [#4646](https://github.com/RediSearch/RediSearch/pull/4646) `FT.DROPINDEX` with `DD` flag deleted keys in one AA cluster but not the others (MOD-1855)

- Improvements:
  - [#4595](https://github.com/RediSearch/RediSearch/pull/4595) Report memory of the `TAG` and `TEXT` tries (MOD-5902)
  - [#4669](https://github.com/RediSearch/RediSearch/pull/4669) Inverted index memory counting (MOD-5977,MOD-5866)
  - [#4687](https://github.com/RediSearch/RediSearch/pull/4687) Add missing `FT.INFO` fields when used within a cluster (MOD-6920)

## v2.8.13 (March 2024)

This is a maintenance release for RediSearch 2.8.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

Details:

- Bug fixes:

  - [#4481](https://github.com/RediSearch/RediSearch/pull/4481) Query syntax on `GEOSHAPE` accepting just prefix instead of complete predicate (MOD-6663)
  - [#4513](https://github.com/RediSearch/RediSearch/pull/4513) `FT.CURSOR READ` in a numeric query causing a crash (MOD-6597)
  - [#4534](https://github.com/RediSearch/RediSearch/pull/4534) `FT.PROFILE` with incorrect arguments could cause a crash on cluster setup (MOD-6791)
  - [#4530](https://github.com/RediSearch/RediSearch/pull/4530) Some parameter settings using just prefixes instead of full values were working (MOD-6709)
  - [#4539](https://github.com/RediSearch/RediSearch/pull/4539) Unfree memory while re-indexing a new RDB as it's loading could cause a crash (MOD-6831, 6810)
  - [#4498](https://github.com/RediSearch/RediSearch/pull/4498) Vector pre-filtered query (hybrid query) that times out causing a crash due to deadlock when trying to write a new document (MOD-6510, MOD-6244)
  - [#4495](https://github.com/RediSearch/RediSearch/pull/4495) `FT.SEARCH` accessing an inexistent memory address causes a crash if using the deprecated `FT.ADD` command (MOD-6599)

- Improvements:

  - [#4502](https://github.com/RediSearch/RediSearch/pull/4502) Handle error properly when trying to execute Search commands on cluster setup as part of `MULTI ... EXEC` or LUA script (MOD-6541)
  - [#4526](https://github.com/RediSearch/RediSearch/pull/4526) Adding detailed geometry info on error messages (MOD-6701)

## v2.8.12 (March 2024)

This is a maintenance release for RediSearch 2.8.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Details:

- Bug fixes:

  - [#4476](https://github.com/RediSearch/RediSearch/pull/4476) Split `INFIX` and `SUFFIX` report on `FT.EXPLAIN` and `FT.EXPLAINCLI` (MOD-6186)
  - [#4467](https://github.com/RediSearch/RediSearch/pull/4467) Memory leak upon suffix query for a `TAG` indexed with `WITHSUFFIXTRIE` (MOD-6644)
  - [#4403](https://github.com/RediSearch/RediSearch/pull/4403) Clustered `FT.SEARCH` hangs forever without replying when an invalid topology is found (MOD-6557)
  - [#4355](https://github.com/RediSearch/RediSearch/pull/4355) Searching for a synonym will iterate in the same group multiple times, causing a performance hit (MOD-6490)

- Improvements:

  - [#4313](https://github.com/RediSearch/RediSearch/pull/4313) Memory allocation patterns on the memory used to query `GEOSHAPE` types (MOD-6431)

## v2.8.11 (January 2024)

This is a maintenance release for RediSearch 2.8.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Details:

- Bug fixes:

  - [#4324](https://github.com/RediSearch/RediSearch/pull/4324) Internal cluster mechanism not waiting until all replies from shards causing a crash (MOD-6287)
  - [#4297](https://github.com/RediSearch/RediSearch/pull/4297) Execution loader when using `FT.AGGREGATE` with `LOAD` stage failing to buffer the right results potentially causing a crash (MOD-6385)

- Improvements:

  - [#4264](https://github.com/RediSearch/RediSearch/pull/4264) Granularity of the time reporting counters on `FT.PROFILE` (MOD-6002)

## v2.8.10 (January 2024)

This is a maintenance release for RediSearch 2.8.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

Details:

- Bug fixes:

  - [#4287](https://github.com/RediSearch/RediSearch/pull/4287) Re-index process while syncing from the replica causes a crash due to internal index variable initialization (MOD-6337, MOD-6336)
  - [#4249](https://github.com/RediSearch/RediSearch/pull/4249) Memory tracking on cluster setups causing high memory usage and potentially Out-of-Memory (MOD-6123, MOD-5639)
  - [#4244](https://github.com/RediSearch/RediSearch/pull/4244) Profiling `FT.AGGREGATE` using the `WITHCURSOR` flag with a `-` clause causes a crash due to timeout (MOD-5512)
  - [#3916](https://github.com/RediSearch/RediSearch/pull/3916) Expiring `JSON` documents while querying it causing a crash due to deadlock (MOD-5769, MOD-5895, MOD-6189, MOD-5895)
  - [#4235](https://github.com/RediSearch/RediSearch/pull/4235) Memory excessively growing on databases caused by unbalanced nodes on inverted index trie (MOD-5880, MOD-5952, MOD-6003) 
  - [#4190](https://github.com/RediSearch/RediSearch/pull/4190) Profiling `FT.AGGREGATE` causes a crash on RESP3 replies (MOD-6250, MOD-6295)
  - [#4148](https://github.com/RediSearch/RediSearch/pull/4148), [#4038](https://github.com/RediSearch/RediSearch/pull/4038) `ON_TIMEOUT FAIL\RETURN` policies in the cluster setup not being respected (MOD-6035, MOD-5948, MOD-6090)
  - [#4110](https://github.com/RediSearch/RediSearch/pull/4110) Format of error response contains inconsistencies when timing out (MOD-6011, MOD-5965)
  - [#4104](https://github.com/RediSearch/RediSearch/pull/4104) `FT.SEARCH` not responding when using TLS encryption on Amazon Linux 2 (MOD-6012)
  - [#4009](https://github.com/RediSearch/RediSearch/pull/4009) In cluster setup does not return a timeout error for `FT.SEARCH` (MOD-5911)
  - [#3920](https://github.com/RediSearch/RediSearch/pull/3920) In cluster setup does not return a timeout error for `FT.AGGREGATE` (MOD-5209)
  - [#3914](https://github.com/RediSearch/RediSearch/pull/3914) `FT.CURSOR READ` with geo queries causing a crash when data is updated between the cursor reads (MOD-5646) 
  - [#4220](https://github.com/RediSearch/RediSearch/pull/4220) Server crash when attempting to run the ForkGC (Garbage Collection routine) after dropping the index (MOD-6276)

- Improvements:

  - [#3682](https://github.com/RediSearch/RediSearch/pull/3682) Report last key error and field type indexing failures on `FT.INFO` (MOD-5364)
  - [#4236](https://github.com/RediSearch/RediSearch/pull/4236) Adding Vector index parameters at the `FT.INFO` report (MOD-6198)
  - [#4196](https://github.com/RediSearch/RediSearch/pull/4196) Check for timeout after results processing in `FT.SEARCH` on cluster setup (MOD-6278)
  - [#4164](https://github.com/RediSearch/RediSearch/pull/4164) Report `TIMEOUT`, `MAXPREFIXEXPANSION` warnings in RESP3 replies (MOD-6234)
  - [#4165](https://github.com/RediSearch/RediSearch/pull/4165) Indicate timeout on `FT.PROFILE` report (MOD-6184)
  - [#4149](https://github.com/RediSearch/RediSearch/pull/4149) Indicate timeout from Cursor on `FAIL` timeout policy (MOD-5990)
  - [#4147](https://github.com/RediSearch/RediSearch/pull/4147) Initialization of the maximum numeric value range leading to a better balance of the index leaf splitting (MOD-6232)
  - [#3940](https://github.com/RediSearch/RediSearch/pull/3940) Query optimization when predicate contains multiple `INTERSECTION` (AND) of `UNION` (OR) (MOD-5910)
  - [#4059](https://github.com/RediSearch/RediSearch/pull/4059) Return cursor id when experiencing a timeout, when the policy is `ON_TIMEOUT RETURN` (MOD-5966)
  - [#4006](https://github.com/RediSearch/RediSearch/pull/4006) Possibly problematic index name alias validation (MOD-5945)

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

  - Adding `GEOSHAPE` [field type]({{< baseurl >}}/commands/ft.create) to map polygons in the `SCHEMA` on `FT.CREATE` (MOD-4798)

  - Support for polygons `POLYGON` and `POINT` using [WKT notation](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry), for example `POLYGON((lon1 lat1, lon2 lat2, ...))`

  - Adjust the [query syntax]({{< baseurl >}}/commands/ft.search#examples) on `FT.SEARCH` for polygons using the predicate `@geom:[OPERATOR $poly]` and defining polygon in WKT format as `PARAMS 2 poly "POLYGON((10 20, ...))"` using `DIALECT 3`

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
