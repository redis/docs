---
Title: RedisTimeSeries 1.10 release notes
alwaysopen: false
categories:
- docs
- operate
- stack
description: RESP3 support. Performance improvements.
linkTitle: v1.10 (July 2023)
min-version-db: '7.2'
min-version-rs: 7.2.4
toc: 'true'
weight: 95
---
## Requirements

RedisTimeSeries v1.10.17 requires:

- Minimum Redis compatibility version (database): 7.2
- Minimum Redis Enterprise Software version (cluster): 7.2.4

## v1.10.17 (April 2025)

This is a maintenance release for RedisTimeSeries 1.10.

Update urgency: `MODERATE`: Plan an upgrade of the server, but it's not urgent.

Details:

Bug fixes:
- [#1725](https://github.com/redistimeseries/redistimeseries/pull/1725) `TS.DEL` crashes on keys with compactions if the deletion removes the last compaction bucket (MOD-8936)
- [LibMR#58](https://github.com/RedisGears/LibMR/pull/58) Crash when a cluster contains both 1.8 and newer nodes (MOD-8976, MOD-9192)

Improvements:
- [#1712](https://github.com/redistimeseries/redistimeseries/pull/1712) Added support for Azure Linux 3 (MOD-9170)
- [#1736](https://github.com/redistimeseries/redistimeseries/pull/1736) (Redis Enterprise only) Cross-key commands are handled by a random shard rather than the first shard (MOD-9262, MOD-9314)

## v1.10.16 (January 2025)

This is a maintenance release for RedisTimeSeries 1.10.

Update urgency: `SECURITY`: There are security fixes in the release.

Details:

- **Security and privacy:**
  - [#1673](https://github.com/redistimeseries/redistimeseries/pull/1673) (CVE-2024-51480) `TS.QUERYINDEX`, `TS.MGET`, `TS.MRANGE`, `TS.MREVRANGE` - potential integer overflow leading to an out-of-bounds write (MOD-7548)

- Improvements:
  - [#1663](https://github.com/redistimeseries/redistimeseries/pull/1663) Added support for Ubuntu 22 and macOS 13 and 14

## v1.10.12 (March 2024)

This is a maintenance release for RedisTimeSeries 1.10.

Update urgency: `LOW`: No need to upgrade unless there are new features you want to use.

Details:

- Improvements:

  - [#1593](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1593) More detailed LibMR error messages

## v1.10.11 (October 2023)

This is a maintenance release for RedisTimeSeries 1.10.

Update urgency: `LOW`: No need to upgrade unless there are new features you want to use.

Details:

- Bug fixes:

  - [LibMR#51](https://github.com/RedisGears/LibMR/pull/51) Crash on SSL initialization failure (MOD-5647)
  - [#1538](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1538) Amazon Linux 2: crash on SSL initialization. We now use openssl11-devel instead of openssl-devel (MOD-6015)

## v1.10.9 (October 2023)

This is a maintenance release for RedisTimeSeries 1.10.

Update urgency: `LOW`: No need to upgrade unless there are new features you want to use.

Details:

- Improvements:

  - [#1516](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1516) Added support for CBL-Mariner 2
  - [#1514](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1514) Added support for Rocky Linux 9 and RHEL9

## v1.10.6 (September 2023)

This is a maintenance release for RedisTimeSeries 1.10.

Update urgency: `SECURITY`: There are security fixes in the release.

Details:

- Security and privacy:

  - [#1506](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1506) Don’t expose internal commands (MOD-5643)

## v1.10 GA (v1.10.4) (July 2023)

This is the General Availability release of RedisTimeSeries 1.10.

### Headlines

RedisTimeSeries 1.10 introduces support for RESP3, performance improvements, and bug fixes.

### Details

Bug fixes (since 1.10-RC3):

- [#1494](https://github.com/RedisTimeSeries/RedisTimeSeries/issues/1494) Potential crash when using an invalid argument value

{{<note>}}
- The version inside Redis will be 1.10.4 in semantic versioning. Since the version of a module in Redis is numeric, we could not add a GA flag.

- Minimal Redis version: 7.2
{{</note>}}
