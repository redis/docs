---
bannerText: Time series support is available in Lettuce 8.0 beta releases and may be subject to change.
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- oss
- kubernetes
- clients
description: Store and query time series data with Lettuce
linkTitle: Time series
title: Store and query time series data
weight: 42
---

A Redis [time series](/content/develop/data-types/timeseries/_index.md) stores
*samples*. Each sample has a timestamp in milliseconds and a floating-point value.
You can attach labels (name/value pairs) to a series to find it later, and add
compaction rules that aggregate its samples into another series.

Lettuce 8.0 and later supports the time series commands through the
`RedisTimeSeriesCommands` interface. The asynchronous and reactive APIs have matching
interfaces (`RedisTimeSeriesAsyncCommands` and `RedisTimeSeriesReactiveCommands`).
These are part of the standard command interfaces, so you can call them on any
connection, as the examples below show. Argument types are in the
`io.lettuce.core.timeseries.arguments` package, and result types are in
`io.lettuce.core.timeseries`.

## Server versions

The examples on this page work on Redis 8.0 and later, where the time series
commands ship with the server. Some commands and options need a later version:

-   Redis 8.8: several aggregations in one range query, such as `MIN` and `MAX` together.
-   Redis 8.10: [`TS.READ`](/content/commands/ts.read.md),
    [`TS.NRANGE`](/content/commands/ts.nrange.md),
    [`TS.NREVRANGE`](/content/commands/ts.nrevrange.md) and
    [`TS.QUERYLABELS`](/content/commands/ts.querylabels.md).

Lettuce doesn't check the server version. It sends the command, and the server rejects
anything it doesn't support.

## Create a series

Use `tsCreate()` to create an empty series. Pass a `TsCreateArgs` object to set the
retention period, labels, and other options. Options that you leave out use the
server defaults. The example below creates two series with the same `type` label
and different `location` labels:

{{< clients-example set="timeseries_tutorial" step="ts_create" lang_filter="Lettuce-Sync,Java-Async,Java-Reactive" description="Foundational: Create time series with a retention period and labels" difficulty="beginner" >}}
{{< /clients-example >}}

## Add samples

Use `tsAdd()` to add one sample. It returns the timestamp of the new sample, and it
creates the series if it doesn't exist. To let the server clock set the timestamp,
use `tsAddNow()`.

Use `tsMAdd()` to add several samples in one call. Unlike `tsAdd()`, it doesn't
create series. A sample that the server rejects, for example because its key doesn't
exist, gives a `null` element at its position in the result, and the server still adds
the other samples. The reactive API returns `Value` objects, so a rejected sample is an
empty `Value`.

{{< clients-example set="timeseries_tutorial" step="ts_add" lang_filter="Lettuce-Sync,Java-Async,Java-Reactive" description="Foundational: Add single and multiple samples to time series with TS.ADD and TS.MADD" difficulty="beginner" >}}
{{< /clients-example >}}

## Read samples

Use `tsGet()` to read the latest sample of a series. It returns `null` if the series is
empty. Use `tsRange()` to read the samples within a range of timestamps in ascending
order, or `tsRevRange()` for descending order. The range is a `Range<Long>` whose
bounds are inclusive when you use `Range.create()`. Use `Range.unbounded()` to
cover the earliest to the latest sample.

{{< clients-example set="timeseries_tutorial" step="ts_get" lang_filter="Lettuce-Sync,Java-Async,Java-Reactive" description="Foundational: Read the latest sample and a range of samples with TS.GET and TS.RANGE" difficulty="beginner" >}}
{{< /clients-example >}}

To aggregate samples into buckets, pass a `TsRangeArgs` object with a bucket duration
(in milliseconds or as a `Duration`) and one or more aggregations. Each reported sample
has the start of its bucket as its timestamp. With several aggregations (Redis 8.8 and
later), each sample has one value per aggregation, in the order you requested them.
Read them with `getValues()`.

{{< clients-example set="timeseries_tutorial" step="ts_aggregate" lang_filter="Lettuce-Sync,Java-Async,Java-Reactive" description="Intermediate: Aggregate samples into time buckets with a range query" difficulty="intermediate" >}}
{{< /clients-example >}}

## Compact a series

A compaction rule aggregates the samples of a source series into buckets and writes
one sample per bucket to a destination series. Create both series first, and then call
`tsCreateRule()` with the aggregation and the bucket duration in milliseconds.
The rule applies only to samples that you add after you create it. The destination
series contains a bucket only after the bucket is complete, so the final, still open
bucket in the example below isn't reported yet.

{{< clients-example set="timeseries_tutorial" step="ts_compaction" lang_filter="Lettuce-Sync,Java-Async,Java-Reactive" description="Intermediate: Create a compaction rule that averages samples into a destination series" difficulty="intermediate" >}}
{{< /clients-example >}}

## Find series by label

The `tsQueryIndex()`, `tsMGet()` and `tsMRange()` methods find series by their labels
instead of by key. Describe the series you want with `TsFilter` objects, such as
`TsFilter.equal("location", "lab")`. If you pass several filters, a series must match
all of them. The server requires at least one filter that matches a label value
(`equal()` or `in()`).

-   `tsQueryIndex()` returns the keys of the matching series, in no particular order.
-   `tsMGet()` returns the latest sample of each matching series. Add
    `TsMGetArgs.Builder.withLabels()` to include the labels.
-   `tsMRange()` returns a range of samples from each matching series. Use
    `TsMRangeArgs.Builder.groupBy()` to combine the series that share a label value
    with a reducer such as `TsReducerType.MAX`.

{{< clients-example set="timeseries_tutorial" step="ts_labels" lang_filter="Lettuce-Sync,Java-Async,Java-Reactive" description="Intermediate: Query multiple series by label with TS.QUERYINDEX, TS.MGET and TS.MRANGE" difficulty="intermediate" >}}
{{< /clients-example >}}

## Read new samples as they arrive

From Redis 8.10, `tsRead()` reads the samples that follow a starting point, which
you set with a `TsReadOffset`. Use `TsReadOffset.earliest()` for the first call and
`TsReadOffset.from(lastTimestamp + 1)` for the calls after that. Pass
`TsReadArgs.Builder.block()` to wait for new samples. If the wait ends with no new
samples, `tsRead()` returns an empty list.

A blocking `tsRead()` call holds its connection until it returns, so other commands
on that connection wait. Use a dedicated connection for it, and make sure the
command timeout of the connection is longer than the block time.

## Use time series with Redis Cluster

In Redis Cluster, the source and destination keys of a compaction rule must hash to
the same slot. Use a shared
[hash tag](/content/operate/oss_and_stack/reference/cluster-spec.md#hash-tags),
such as `{sensor1}:raw` and `{sensor1}:avg`. Lettuce splits a `tsMAdd()` call that
spans several slots into one command per slot, and the commands aren't atomic as a
group. Keep the series that you update together in the same slot.
