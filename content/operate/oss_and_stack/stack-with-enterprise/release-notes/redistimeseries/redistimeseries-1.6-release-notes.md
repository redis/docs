---
Title: RedisTimeSeries 1.6 release notes
linkTitle: v1.6 (January 2022)
description: Added support for aggregating across multiple time series (multi-key). Can compute queries such as “the maximum observed value of a set of time series” server-side instead of client-side.
min-version-db: "6.0.16"
min-version-rs: "6.2.8"
weight: 97
alwaysopen: false
categories: ["Modules"]
aliases: /modules/redistimeseries/release-notes/redistimeseries-1.6-release-notes/
---
## Requirements

RedisTimeSeries v1.6.19 requires:

- Minimum Redis compatibility version (database): 6.0.16
- Minimum Redis Enterprise Software version (cluster): 6.2.8

## v1.6.19 (February 2023)

This is a maintenance release for RedisTimeSeries 1.6.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Details:

- Bug fixes:

    - [#1397](https://github.com/RedisTimeSeries/RedisTimeSeries/issues/1397) Memory leak when trying to create an already existing key (MOD-4724, RED-93418)

## v1.6.17 (July 2022)

This is a maintenance release for RedisTimeSeries 1.6.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

Details:

- Bug fixes:

    - [#1240](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1240) Compaction rules are not saved to [RoF](https://docs.redis.com/latest/rs/databases/redis-on-flash) (Redis Enterprise)

## v1.6.16 (June 2022)

This is a maintenance release for RedisTimeSeries 1.6.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

Details:

- Features:

    - [#1193](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1193) Commands that don’t execute on the main thread now appear in [SLOWLOG]({{< relref "/commands/slowlog" >}})

- Bug fixes:

    - [#1203](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1203) Compaction rules are not replicated (Replica Of) on Redis Enterprise
    - [#1204](https://github.com/RedisTimeSeries/RedisTimeSeries/issues/1204) When the last sample is deleted with [`TS.DEL`]({{< baseurl >}}/commands/ts.del), it may still be accessible with [`TS.GET`]({{< baseurl >}}/commands/ts.get)
    - [#1226](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1226) [`TS.MRANGE`]({{< baseurl >}}/commands/ts.mrange), [`TS.MREVRANGE`]({{< baseurl >}}/commands/ts.mrevrange): on a multi-shard environment, some chunks may be skipped

{{<note>}}
New RDB version (v5). RDB files created with 1.6.16 are not backward compatible.
{{</note>}}

## v1.6.13 (June 2022)

This is a maintenance release for RedisTimeSeries 1.6.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

Details:

- Bug fixes:

    - [#1176](https://github.com/RedisTimeSeries/RedisTimeSeries/issues/1176), [#1187](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1187) When executing [`DEL`]({{< baseurl >}}/commands/ts.del), chunk index could be set to a wrong value and cause some data to be inaccessible
    - [#1180](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1180) When executing [`MADD`]({{< baseurl >}}/commands/ts.madd), make sure that only successful insertions are replicated

## v1.6.11 (May 2022)

This is a maintenance release for RedisTimeSeries 1.6.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

Details:

- Bug fixes:

    - [#1166](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1166) Stop forwarding multi-shard commands during cluster resharding and upgrade (MOD-3154)
    - [#1165](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1165) Stop forwarding multi-shard commands during transactions (`MULTI EXEC`) (MOD-3182)
    - [LibMR](https://github.com/RedisGears/LibMR): Fixed crash on multi-shard commands in some rare scenarios (MOD-3182)

## v1.6.10 (May 2022)

This is a maintenance release for RedisTimeSeries 1.6.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Details:

- Bug fixes:

    - [#1074](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1074) [`RANGE`]({{< baseurl >}}/commands/ts.range), [`REVRANGE`]({{< baseurl >}}/commands/ts.revrange), [`MRANGE`]({{< baseurl >}}/commands/ts.mrange), and [`MREVRANGE`]({{< baseurl >}}/commands/ts.mrevrange): Possibly incorrect result when using `ALIGN` and aggregating a bucket with a timestamp close to 0
    - [#1094](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1094) [LibMR](https://github.com/RedisGears/LibMR): Potential memory leak; memory release delay
    - [#1127](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1127) Memory leak on [`RANGE`]({{< baseurl >}}/commands/ts.range) and [`REVRANGE`]({{< baseurl >}}/commands/ts.revrange) when argument parsing fails
    - [#1096](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1096) [`RANGE`]({{< baseurl >}}/commands/ts.range), [`REVRANGE`]({{< baseurl >}}/commands/ts.revrange), [`MRANGE`]({{< baseurl >}}/commands/ts.mrange), and [`MREVRANGE`]({{< baseurl >}}/commands/ts.mrevrange): Using `FILTER_BY_TS` without specifying timestamps now returns an error as expected

## v1.6.9 (February 2022)

This is a maintenance release for RedisTimeSeries 1.6.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Details:

- Security and privacy:

    - [#1061](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1061) Internode communications encryption: support passphrases for PEM files

- Bug fixes:

    - [#1056](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/1056) Return an error when a shard is down (in v1.6.8, returned an empty result)


## v1.6 GA (v1.6.8) (January 2022)

This is the General Availability release of RedisTimeSeries 1.6.

### Highlights

RedisTimeSeries 1.6 adds support for aggregating across multiple time series (multi-key). Before this version, queries such as “the maximum observed value of a set of time series” needed to be calculated client-side. Such queries can now be computed server-side, leveraging the heart of RedisGears ([LibMR](https://github.com/RedisGears/LibMR)) for clustered databases.

### What's new in 1.6

- Introduction of `GROUPBY` and `REDUCE` in `TS.MRANGE` and `TS.MREVRANGE` to add support for "multi-key aggregation" and support for such aggregations spanning multiple shards, leveraging [LibMR](https://github.com/RedisGears/LibMR). Currently, we support `min`, `max`, and `sum` as reducers and grouping by a label.

- [#722](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/722), [#275](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/275) Filter results using `FILTER_BY_TS` by providing a list of timestamps and `FILTER_BY_VALUE` by providing a `min` and a `max` value (`TS.RANGE`, `TS.REVRANGE`, `TS.MRANGE`, and `TS.MREVRANGE`).

- [#603](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/603), [#611](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/611), [#841](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/841) Introduction of TS.DEL which allows deleting samples in a time series within two timestamps (inclusive).

- [#762](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/762) Limit the number of returned labels in the response of read commands (`TS.MRANGE`, `TS.MREVRANGE`, and `TS.MGET`) using `SELECTED_LABELS`. This can be a significant performance improvement when returning a large number of series.

- [#655](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/655), [#801](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/801) Ability to align the aggregation buckets with the requested start, end, or specific timestamp on aggregation queries using `ALIGN` (`TS.RANGE`, `TS.REVRANGE`, `TS.MRANGE`, and `TS.MREVRANGE`).

- [#675](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/675) Add keyspace notifications for all CRUD commands. Check out [this test](https://github.com/RedisTimeSeries/RedisTimeSeries/blob/master/tests/flow/test_ts_keyspace.py) for the details.

- [#882](https://github.com/RedisTimeSeries/RedisTimeSeries/pull/882) [Auto Tiering ](https://docs.redis.com/latest/rs/databases/redis-on-flash//#:~:text=Redis%20on%20Flash%20%20offers,dedicated%20flash%20memory%20(SSD).) support.
