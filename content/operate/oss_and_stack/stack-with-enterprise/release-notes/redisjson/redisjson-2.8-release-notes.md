---
Title: RedisJSON 2.8 release notes
alwaysopen: false
categories:
- docs
- operate
- stack
description: RedisJSON 2.8 introduces bug fixes.
linkTitle: v2.8 (July 2024)
min-version-db: '7.4'
min-version-rs: 7.6 (TBD)
toc: 'true'
weight: 95
---

## Requirements

RedisJSON v2.8.8 requires:

- Minimum Redis compatibility version (database): 7.4
- Minimum Redis Enterprise Software version (cluster): 7.6 (TBD)

## v2.8.8 (January 2025)

This is a maintenance release for RedisJSON 2.8

Update urgency: `LOW`: No need to upgrade unless there are new features you want to use.

Details:  

- Bug fixes:
  - [#1313](https://github.com/redisjson/redisjson/pull/1313) (Redis Enterprise A-A only) Potential crash on `JSON.DEBUG MEMORY` (MOD-8412)

- Improvements:
  - [#1262](https://github.com/redisjson/redisjson/pull/1262) Support active memory defragmentation (MOD-7888)
  - [#1308](https://github.com/redisjson/redisjson/pull/1308) Added support for Ubuntu 22 and macOS 13 and 14

## v2.8.4 (September 2024)

This is a maintenance release for RedisJSON 2.8

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Details:

- Bug fixes:

  - [#1225](https://github.com/redisjson/redisjson/pull/1225) Crash on SET commands with recursive overlapping paths (MOD-7279)
  - HDT#261 (Redis Enterprise A-A only) Crash when a JSON contains an EOF character (MOD-7464)

## v2.8 GA (v2.8.3) (July 2024)

This is the General Availability release of RedisJSON 2.8

### Headlines:

RedisJSON 2.8 introduces bug fixes.

Details

- Bug fixes

  - [#1212](https://github.com/RedisJSON/RedisJSON/pull/1212) `JSON.MSET`- AOF commands are duplicated multiple times (MOD-7293)

{{< note >}}
- The version inside Redis will be 2.8.3 in semantic versioning. Since the version of a module in Redis is numeric, we could not add a GA flag.
- Minimal Redis version: 7.4
{{< /note >}}
