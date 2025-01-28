---
Title: RedisJSON 2.0 release notes
alwaysopen: false
categories:
- docs
- operate
- stack
description: Index JSON documents. JSONPath support. Commands operate on multiple
  paths.
linkTitle: v2.0 (November 2021)
min-version-db: 6.0.0
min-version-rs: 6.0.0
weight: 99
---
## Requirements

RedisJSON v2.0.11 requires:

- Minimum Redis compatibility version (database): 6.0.0
- Minimum Redis Enterprise Software version (cluster): 6.0.0

## v2.0.11 (July 2022)

This is a maintenance release for RedisJSON 2.0.
Update urgency: `LOW` - No need to upgrade unless there are new features you want to use.

Details:

- Improvements:

  - Minor documentation changes and internal build improvements

## v2.0.9 (June 2022)

This is a maintenance release for RedisJSON 2.0.

Update urgency: `LOW`: No need to upgrade unless there are new features you want to use.

Details:

- Bug fixes:

  - [#721](https://github.com/RedisJSON/RedisJSON/pull/721) Skip String and Boolean scalars in `JSON.CLEAR` (MOD-3136)

- Improvements:

  - [#709](https://github.com/RedisJSON/RedisJSON/pull/709) Allow internal JSON API's `getdouble` to succeed with integer values

## v2.0.8 (April 2022)

This is a maintenance release for RedisJSON 2.0.

Update urgency: `LOW` - No need to upgrade unless there are new features you want to use.

Details:

- Bug fixes:

  - [#691](https://github.com/RedisJSON/RedisJSON/pull/691), [#667](https://github.com/RedisJSON/RedisJSON/issues/667) Duplicate results in JSONPath query

## v2.0.7 (March 2022)

This is a maintenance release for RedisJSON 2.0.

Update urgency: `LOW` - No need to upgrade unless there are new features you want to use.

Details:

- Improvements:

  - [#632](https://github.com/RedisJSON/RedisJSON/pull/632), [#605](https://github.com/RedisJSON/RedisJSON/pull/605) Support `JSON.CLEAR` for string, bool, and numeric scalars (MOD-2394)
  - [#637](https://github.com/RedisJSON/RedisJSON/pull/637) Add `intershard_tls_pass` support (MOD-2522)
  - [#594](https://github.com/RedisJSON/RedisJSON/pull/594) Support for `MEMORY USAGE` and memory info in `JSON.DEBUG` (MOD- 2079)

- Bug fixes:

  - [#646](https://github.com/RedisJSON/RedisJSON/pull/646), [#644](https://github.com/RedisJSON/RedisJSON/pull/644) Do not fail `JSON.MGET` on wrong/unregistered key type (MOD-2511)
  - [#643](https://github.com/RedisJSON/RedisJSON/pull/643) Null-terminate JSON string in `rdb_save`
  - [#591](https://github.com/RedisJSON/RedisJSON/pull/591) Avoid crash on overflow in `JSON.NUMINCRBY` or `JSON.NUMMULTBY` (MOD-2513)
  - [#593](https://github.com/RedisJSON/RedisJSON/pull/593) Return no updates when performing `JSON.SET` with `NX` to an existing array element (MOD-2512)

## v2.0.6 (December 2021)

This is a maintenance release for RedisJSON 2.0.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

This patch neutralizes the increased memory consumption from v1 to v2.

Details:

- Improvements:

  - [#563](https://github.com/RedisJSON/RedisJSON/pull/563) Introduction of [ijson](https://libraries.io/cargo/ijson).

## v2.0.5 (December 2021)

This is a maintenance release for RedisJSON 2.0.

Details:

- Bug fixes:
  - #[553](https://github.com/RedisJSON/RedisJSON/pull/553) Return an empty array on a nonexistent path
  - #[548](https://github.com/RedisJSON/RedisJSON/pull/548) Align error handling behavior
  - #[546](https://github.com/RedisJSON/RedisJSON/pull/546) #[545](https://github.com/RedisJSON/RedisJSON/pull/545) Fix key location in `JSON.DEBUG MEMORY`

## v2.0.4 (November 2021)

This is the General Availability release of RedisJSON 2.0.

### Headlines

RedisJSON is a [high-performance JSON document store](https://redis.com/blog/redisjson-public-preview-performance-benchmarking/) that allows developers to build modern applications. It stores and processes JSON in-memory, supporting millions of operations per second with sub-millisecond response times. The combination of `RediSearch`, native indexing, querying, and full-text search of JSON documents allows developers to create secondary indexes and query data at lightning speed.

#### Indexing JSON documents

Using [RediSearch](https://redisearch.io), it is now possible to [index, query, and search JSON documents]({{<relref "/develop/interact/search-and-query/indexing">}}), gaining full-text search capabilities and document retrieving based on their content.

To do so, you must install both modules, `RedisJSON` and `RediSearch`, on the same database.

#### Support of JSON Path

The commands [support JSONPath]({{<relref "/develop/data-types/json/path">}}) as specified in the [original specifications](https://goessner.net/articles/JsonPath).

The legacy path syntax is still supported.

#### Commands operate on multiple paths

A `JSONPath` query may resolve to several paths. Every command supports multiple paths and applies the operation to all the encountered paths.

Notice that the output of the commands evolved to provide multiple results according to the number of paths impacted. 

### Details

- Enhancements
  - #[477](https://github.com/RedisJSON/RedisJSON/pull/477) Support of Multipath
  - #[336](https://github.com/RedisJSON/RedisJSON/pull/336) Added generic JSON path implementation 
  - #[525](https://github.com/RedisJSON/RedisJSON/pull/525) Error messages prefixed with ERR or WRONGTYPE 
  - #[490](https://github.com/RedisJSON/RedisJSON/pull/490) Performance: Discard `to_value` method
  - #[426](https://github.com/RedisJSON/RedisJSON/pull/426) Move from next_string to next_str 
  - #[464](https://github.com/RedisJSON/RedisJSON/pull/464) Initial RedisJSON commands.json file 
  - #[488](https://github.com/RedisJSON/RedisJSON/pull/488) Docker with RediSearch revisited 

- Bug fixes
  - #[515](https://github.com/RedisJSON/RedisJSON/pull/515) JSON.DEL count deleted null value 
  - #[499](https://github.com/RedisJSON/RedisJSON/pull/499) Avoid crash in ARRTRIM 
  - #[458](https://github.com/RedisJSON/RedisJSON/pull/458) Docker/Debian: moved from Buster to Bullseye 
  - #[397](https://github.com/RedisJSON/RedisJSON/pull/397) Support RDB Short Read in RedisJSON (a.k.a diskless-load) 
  - #[398](https://github.com/RedisJSON/RedisJSON/pull/398) Avoid path clone when not needed 
  - #[416](https://github.com/RedisJSON/RedisJSON/pull/416) Add testGetWithBracketNotation
