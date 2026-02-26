---
Title: RedisJSON 2.6 release notes
alwaysopen: false
categories:
- docs
- operate
- stack
description: RESP3 support. New commands JSON.MERGE and JSON.MSET.
linkTitle: v2.6 (July 2023)
min-version-db: '7.2'
min-version-rs: 7.2.4
toc: 'true'
weight: 96
---
## Requirements

RedisJSON v2.6.22 requires:

- Minimum Redis compatibility version (database): 7.2
- Minimum Redis Enterprise Software version (cluster): 7.2.4

## v2.6.22 (October 2025)

This is a maintenance release for RedisJSON 2.6.

Update urgency: `LOW`: No need to upgrade unless there are new features you want to use.

Details:

Improvements:

- Added support for Rocky Linux 9 and RHEL9 ARM.

## v2.6.21 (September 2025)

This is a maintenance release for RedisJSON 2.6.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Details:

Bug fixes
- [#1374](https://github.com/redisjson/redisjson/pull/1374) - `JSON.DEL` doesn’t delete all matching object members / array elements (MOD-11032, MOD-11067).

## v2.6.15 (April 2025)

This is a maintenance release for RedisJSON 2.6.

Update urgency: `LOW`: No need to upgrade unless there are new features you want to use.

Details:

Bug fixes
- [#1329](https://github.com/redisjson/redisjson/pull/1329) Memory usage calculation: some allocations are counted twice (MOD-9169) 

Improvements:
- [#1335](https://github.com/redisjson/redisjson/pull/1335) Added support for Azure Linux 3 (MOD-9172)

## v2.6.14 (January 2025)

This is a maintenance release for RedisJSON 2.6

Update urgency: `LOW`: No need to upgrade unless there are new features you want to use.

Details:

- Bug fixes:
  - [#1313](https://github.com/redisjson/redisjson/pull/1313) (Redis Enterprise A-A only) Potential crash on `JSON.DEBUG MEMORY` (MOD-8412)

- Improvements:
  - [#1312](https://github.com/redisjson/redisjson/pull/1312) Added support for Ubuntu 22 and macOS 13 and 14


## v2.6.12 (September 2024)

This is a maintenance release for RedisJSON 2.6

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Details:

- Bug fixes:

  - [#1225](https://github.com/redisjson/redisjson/pull/1225) Crash on SET commands with recursive overlapping paths (MOD-7279)
  - HDT#261 (Redis Enterprise A-A only) Crash when a JSON contains an EOF character (MOD-7464)

## v2.6.10 (April 2024)

This is a maintenance release for RedisJSON 2.6.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Details:

- Bug fixes:

  - [#1192](https://github.com/RedisJSON/RedisJSON/pull/1192) Crashes with numeric values greater than i64::MAX (MOD-6501, MOD-4551, MOD-4856, MOD-5714)
  - HDT#228 (Redis Enterprise A-A only) Incorrect error when processing escaped characters (MOD-6645)

## v2.6.9 (January 2024)

This is a maintenance release for RedisJSON 2.6.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Details:

- Improvements:

   - [#1131](https://github.com/RedisJSON/RedisJSON/issues/1131), [#1143](https://github.com/RedisJSON/RedisJSON/pull/1143) **BREAKING** - Revert JSONPath default path value from `$` to `.` under RESP3 (MOD-6156)

- Bug fixes:

  - [#1095](https://github.com/RedisJSON/RedisJSON/pull/1095) Fix for RediSearch deadlock. See RediSearch 2.8.10 release notes (MOD-5895)

## v2.6.8 (November 2023)

This is a maintenance release for RedisJSON 2.6.

Update urgency: `LOW`: No need to upgrade unless there are new features you want to use.

Details:

{{<note>}}
RHEL 7 is no longer supported as of v2.6.8.
{{</note>}}

This is a version number alignment with RedisJSON for Redis Enterprise (with Active-Active support).

## v2.6.7 (October 2023)

This is a maintenance release for RedisJSON 2.6.

Update urgency: `LOW`: No need to upgrade unless there are new features you want to use.

Details:

- Improvements:

  - [#1102](https://github.com/RedisJSON/RedisJSON/pull/1102) Added support for CBL-Mariner 2
  - [#1099](https://github.com/RedisJSON/RedisJSON/pull/1099) Added support for RHEL9 and Rocky Linux 9

## v2.6.6 (August 2023)

This is a maintenance release for RedisJSON 2.6.

Update urgency: `LOW`: No need to upgrade unless there are new features you want to use.

Details:

This is just a version number alignment with RedisJSON for Redis Enterprise (with Active-Active support).

## v2.6 GA (v2.6.4) (July 2023)

This is the General Availability release of RedisJSON 2.6.

### Headlines

RedisJSON 2.6 introduces support for RESP3 and new commands.

### What's new in 2.6

- Introduce [`JSON.MERGE`]({{< relref "commands/json.merge" >}}) in compliance with [RFC 7396](https://datatracker.ietf.org/doc/html/rfc7396), supporting:

  - Creating new attributes on an existing JSON document

  - Updating and replacing values in parent and child attributes

  - Deleting existing attributes (by setting the value to `null`)

  - Array update - replacing an entire array with the new value

- Introduce [`JSON.MSET`]({{< relref "commands/json.mset" >}}), supporting atomic multiple sets for keys in the same hash slot

- New `FORMAT` argument in `JSON.ARRPOP` and `JSON.GET` to retrieve the results as JSON strings or RESP3 hierarchical structures (RESP3 only)

- `JSON.RESP` is now regarded as deprecated

- Legacy paths (paths that don't start with either `$.` or `$[` or equal to `$`), except those starting with `.`, are now deprecated

{{<note>}}
- The version inside Redis will be 2.6.4 in semantic versioning. Since the version of a module in Redis is numeric, we could not add a GA flag.

- Minimal Redis version: 7.2
{{</note>}}
