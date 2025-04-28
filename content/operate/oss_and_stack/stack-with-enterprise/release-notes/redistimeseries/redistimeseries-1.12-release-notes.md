---
Title: RedisTimeSeries 1.12 release notes
alwaysopen: false
categories:
- docs
- operate
- stack
description: RedisTimeSeries 1.12 adds a highly requested feature - insertion-filter for close samples.
linkTitle: v1.12 (July 2024)
min-version-db: '7.4'
min-version-rs: 7.6 (TBD)
toc: 'true'
weight: 94
---
## Requirements

RedisTimeSeries v1.12.6 requires:

- Minimum Redis compatibility version (database): 7.4
- Minimum Redis Enterprise Software version (cluster): 7.6 (TBD)

## v1.12.6 (April 2025)

This is a maintenance release for RedisTimeSeries 1.12.

Update urgency: `MODERATE`: Plan an upgrade of the server, but it's not urgent.

Details:

Bug fixes:
- [#1725](https://github.com/redistimeseries/redistimeseries/pull/1725) `TS.DEL` crashes on keys with compactions if the deletion removes the last compaction bucket (MOD-8936)
- [LibMR[#58](https://github.com/redistimeseries/redistimeseries/pull/58)](https://github.com/RedisGears/LibMR/pull/58) Crash when a cluster contains both 1.8 and newer nodes (MOD-8976, MOD-9192)

Improvements:
- [#1712](https://github.com/redistimeseries/redistimeseries/pull/1712) Added support for Azure Linux 3 (MOD-9170)
- [#1736](https://github.com/redistimeseries/redistimeseries/pull/1736) (Redis Enterprise only) Cross-key commands are handled by a random shard rather than the first shard (MOD-9262, MOD-9314)

## v1.12.5 (January 2025)

This is a maintenance release for RedisTimeSeries 1.12.

Update urgency: `SECURITY`: There are security fixes in the release.

Details:

- **Security and privacy:**
  - [#1674](https://github.com/redistimeseries/redistimeseries/pull/1674) (CVE-2024-51480) `TS.QUERYINDEX`, `TS.MGET`, `TS.MRANGE`, `TS.MREVRANGE` - potential integer overflow leading to an out-of-bounds write (MOD-7548)

- Improvements:
  - [#1662](https://github.com/redistimeseries/redistimeseries/pull/1662) Added support for Ubuntu 22 and macOS 13 and 14

## v1.12 GA (v1.12.2) (July 2024)

This is the General Availability release of RedisTimeSeries 1.12

### Headlines

RedisTimeSeries 1.12 adds a highly requested feature: insertion-filter for close samples. Many sensors report data periodically. Often, the difference between the measured value and the previous measured value is negligible and related to random noise or to measurement accuracy limitations. When both the time difference and the value difference between the current and the previous sample are small, it may be preferable to ignore (not to add) the new measurement.

### What's new in 1.12

- [#1543](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1543) insertion-filter for close samples:

  - Two new [module configuration parameters](https://redis.io/docs/data-types/timeseries/configuration/) are introduced: `IGNORE_MAX_TIME_DIFF` and `IGNORE_MAX_VAL_DIFF`.
  - Two new similar per-key parameters are introduced: `ignoreMaxTimeDiff` and `ignoreMaxValDiff`.
  - `TS.ADD`, `TS.INCRBY`, and `TS.DECRBY` now have a new optional argument: `[IGNORE ignoreMaxTimeDiff ignoreMaxValDiff]`.
    When creating a new time series, these two values are used to set the per-key parameters and override the two module configuration parameters. These values are ignored when specified with an existing time series.
  - `[IGNORE ignoreMaxTimeDiff ignoreMaxValDiff]` is also supported by `TS.ALTER`.
  - For each call to `TS.ADD`, if the following conditions are met:
      - series is not a compaction
      - the series' `DUPLICATE_POLICY` is `LAST`
      - `timestamp` ≥ `max_timestamp`
      - `timestamp` - `max_timestamp` ≤ `ignoreMaxTimeDiff`
      - abs(`value` - `value_at_max_timestamp`) ≤ `ignoreMaxValDiff`))
    then this sample is ignored (not added) to the time series. `max_timestamp` is the maximal timestamp in the time series.
  - The same logic also applies for each call to `TS.MADD` based on the values of the per-key parameters.
  - When a sample is ignored, the returned value for `TS.ADD` and for the applicable array element in `TS.MADD` is `max_timestamp`.

### Details

- Bug fixes (since 1.12-RC1)

  - [#1607](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1607) Potential crash after deleting and recreating a source key of a compaction rule (MOD-7338)
  - [#1610](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1610) `COUNT` argument accepts non-positive values (MOD-5413)

{{< note >}}
- The version inside Redis will be 1.12.2 in semantic versioning. Since the version of a module in Redis is numeric, we could not add a GA flag.
- Minimal Redis version: 7.4
{{< /note >}}
