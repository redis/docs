---
Title: RedisTimeSeries 1.4 release notes
alwaysopen: false
categories:
- docs
- operate
- stack
description: Added ability to backfill time series.
linkTitle: v1.4 (September 2020)
min-version-db: 5.0.0
min-version-rs: 6.0.12
weight: 98
---
## Requirements

RedisTimeSeries v1.4.14 requires:

- Minimum Redis compatibility version (database): 5.0.0
- Minimum Redis Enterprise Software version (cluster): 6.0.12

## v1.4.14 (February 2022)

This is a maintenance release for RedisTimeSeries 1.4.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Bug fixes:

- [#891](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/891), [#892](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/892) Fixed memory leak in parseCreateArgs when parsing error occurs (MOD-1958)

## v1.4.13 (November 2021)

This is a maintenance release for RedisTimeSeries 1.4.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Bug fixes:

- [#881](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/881) Replicate only successful insertion of `TS.MADD`

## v1.4.11 (November 2021)

This is a maintenance release for RedisTimeSeries 1.4.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Bug fixes:

- [#862](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/862) Index dictionary should be freed on removing the last element

## v1.4.10 (July 2021)

This is a maintenance release for RedisTimeSeries 1.4.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

Bug fixes:

- [#760](https://github.com/RedisTimeSeries/RedisTimeSeries/issues/760) Avoid closing the same key twice, causing server crash on [`RENAME`]({{< relref "/commands/rename" >}}) of other keys

## v1.4.9 (May 2021)

This is a maintenance release for version 1.4.

Update urgency: Medium

Headlines:

- This release improves overall stability and provides fixes for issues found after the previous release.

Bug fixes:

- #[#712](https://github.com/RedisTimeSeries/RedisTimeSeries/issues/712) Missing keytype check on TS.INCRBY/DECRBY causes shards to crash
- #[#719](https://github.com/RedisTimeSeries/RedisTimeSeries/issues/719) Support for renaming time series keys

## v1.4.8 (March 2021)

This is a maintenance release for version 1.4.

Headlines:

- This release improves overall stability and provides fixes for issues found after the previous release.

Bug fixes:

- [#612](https://github.com/RedisTimeSeries/RedisTimeSeries/issues/612) Crash on `MGET`/`MRANGE`
- [#606](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/606) Memory leak when key loaded from RDB
- [#624](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/624) Uninitialised memory access on log


## v1.4.7 (December 2020)

This is a maintenance release for version 1.4.

Headlines:

- This release improves overall stability, and provides fixes for issues found after the previous release.

Bug fixes:

- [#581](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/581) Misaligned allocators usage might crash Redis.
- [#588](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/588) `ON_DUPLICATE` min/max rules not working for negative value.

## v1.4.6 (November 2020)

This is a maintenance release for version 1.4.

Headlines:

This release improves overall stability and provides fixes for issues found after the previous release.

Minor enhancements:

- [#565](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/565)
    duplicate policy: add `SUM` option: If a previous sample exists, add the new sample to it so that the updated value is equal to (previous + new).
    If no previous sample exists, set the updated value equal to the new value. (PR [#565](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/565)
- [#559](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/559)
    Compressed chunk will be be the default global option
- [#559](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/559)
    Added `chunkType` to `TS.INFO`

Bug fixes:

- [#528](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/528)
    Out of order insert might crash Redis if there's an update to an empty downsampled key
- [#561](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/561)
    `TS.MRANGE` command might crash if there's an expired key that was deleted in the result set

## v1.4 GA (September 2020)

This is the General Availability release for RedisTimeSeries 1.4.

Highlights:

**Ability to backfill time series!** You can now add samples to a time series where the time of the sample is older than the newest sample in the series. This enables:

- Adding out of order of samples to time series.
- Batch loading of historical samples into an existing series.
- Updating existing samples (for example for compliance reasons).

This has been the most requested feature for RedisTimeSeries. We look forward to your feedback so we can move to a general availability release soon.

Details:

- Added functionality:
    - [#254](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/254) TS.REVRANGE and TS.MREVRANGE commands allow for querying in descending order of Timestamps.
    - [#503](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/503) - RDB saves the whole chunk instead of individual samples giving a speed and space improvement when saving or loading an RDB file
    - [#502](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/502) - The ability to set, at creation time, the data section size of each chunk using flag `CHUNK_SIZE`. TS.INFO uses `chunkSize` instead of `maxSamplesPerChunk`.
    - [#437](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/437) Allow backfilling of samples and updating of existing samples
        - Works with [compressed](https://redislabs.com/blog/redistimeseries-version-1-2-is-here/) and uncompressed series.
        - This comes with a performance hit when a sample is written out-of-order. We will publish numbers once we are generally available, but are still considering optimisations.
    - [#521](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/521) `DUPLICATE_POLICY` allows to configure on module, series and sample level how to handle duplicate samples. A duplicate sample is a sample for which the series holds already a sample on the same timestamp. Note that the default behaviour is equal to v1.2: `BLOCK`

Notes:
The version inside Redis will be 10405 or 1.4.5 in semantic versioning. Since the version of a module in Redis is numeric, we could not add an GA flag.
