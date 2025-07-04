---
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
description: Ingest and query time series data with Redis
linkTitle: Time series
stack: true
title: Time series
weight: 150
---

[![Discord](https://img.shields.io/discord/697882427875393627?style=flat-square)](https://discord.gg/KExRgMb)
[![Github](https://img.shields.io/static/v1?label=&message=repository&color=5961FF&logo=github)](https://github.com/RedisTimeSeries/RedisTimeSeries/)

The Redis time series data type lets you store real-valued data points
along with the time they were collected. You can combine the values from a selection
of time series and query them by time or value range. You can also compute
aggregate functions of the data over periods of time and create new time series
from the results. When you create a time series, you can specify a maximum
retention period for the data, relative to the last reported timestamp, to
prevent the time series from growing indefinitely.

Time series support very fast reads and writes, making them ideal for
applications such as:

- Instrument data logging
- System performance metrics
- Financial market data
- Internet of Things (IoT) sensor data
- Smart metering
- Quality of service (QoS) monitoring

Redis time series are available in Redis Open Source, Redis Software, and Redis Cloud.
See
[Install Redis Open Source]({{< relref "/operate/oss_and_stack/install/install-stack" >}}) or
[Install Redis Enterprise]({{< relref "/operate/rs/installing-upgrading/install" >}})
for full installation instructions.

## Creating a time series

You can create a new empty time series with the [`TS.CREATE`]({{< relref "commands/ts.create/" >}}) command, specifying a key name. If you use [`TS.ADD`]({{< relref "commands/ts.add/" >}}) to add data to a time series key that does not exist, it is automatically created.

```bash
> TS.CREATE thermometer:1
OK
> TYPE thermometer:1
TSDB-TYPE
> TS.INFO thermometer:1
 1) totalSamples
 2) (integer) 0
    .
    .
```

The timestamp for each data point is a 64-bit integer value. This is designed
to support Unix timestamps, measured in milliseconds since the
[Unix epoch](https://en.wikipedia.org/wiki/Unix_time). However, you can interpret
the timestamps in any way you like (for example, as the number of days since a given start date).
When you create a time series, you can specify a maximum retention period for the
data, relative to the last reported timestamp. A retention period of `0` means
the data does not expire.

```bash
# Create a new time series with a first value of 10.8 (Celsius),
# recorded on day 1, with a retention period of 100 days.
> TS.ADD thermometer:2 1 10.8 RETENTION 100
(integer) 1
> TS.INFO thermometer:2
    .
    .
 9) retentionTime
10) (integer) 100
    .
    .
```

You can also add one or more *labels* to a time series when you create it. Labels
are key-value pairs where the value can be a string or a number. You can use
both the keys and values to select subsets of all the available time series
for queries and aggregations.

```bash
> TS.ADD thermometer:3 1 10.4 LABELS location UK type Mercury
(integer) 1
> TS.INFO thermometer:3
 1) totalSamples
 2) (integer) 1
 3) memoryUsage
 4) (integer) 5000
    .
    .
19) labels
20) 1) 1) "location"
       2) "UK"
    2) 1) "type"
       2) "Mercury"
    .
    .
```

## Adding data points

You can add individual data points with [`TS.ADD`]({{< relref "commands/ts.add/" >}}),
but you can also use [`TS.MADD`]({{< relref "commands/ts.madd/" >}}) to add multiple data
points to one or more time series in a single command. (Note that unlike `TS.ADD`, `TS.MADD`
doesn't create any new time series if you specify keys that don't exist.) The return value
is an array containing the number of samples in each time series after the operation.
If you use the `*` character as the timestamp, Redis will record the current
Unix time, as reported by the server's clock.

```bash
> TS.MADD thermometer:1 1 9.2 thermometer:1 2 9.9 thermometer:2 2 10.3
1) (integer) 1
2) (integer) 2
3) (integer) 2
```

## Querying data points

Use [`TS.GET`]({{< relref "commands/ts.get/" >}}) to retrieve the last data point
added to a time series. This returns both the timestamp and the value.

```bash
# The last recorded temperature for thermometer:2
# was 10.3 on day 2.
> TS.GET thermometer:2
1) (integer) 2
2) 10.3
```

Use [`TS.RANGE`]({{< relref "commands/ts.range/" >}}) to retrieve data points
from a time series that fall within a given timestamp range. The range is inclusive,
meaning that samples whose timestamp equals the start or end of the range are included.
You can use `-` and `+` as the start and end of the range, respectively, to
indicate the minimum and maximum timestamps in the series. The response is
an array of timestamp-value pairs returned in ascending order by timestamp.
If you want the results in descending order, use [`TS.REVRANGE`]({{< relref "commands/ts.revrange/" >}}) with the same parameters.

```bash
# Add 5 data points to a rain gauge time series.
> TS.CREATE rg:1
OK
> TS.MADD rg:1 0 18 rg:1 1 14 rg:1 2 22 rg:1 3 18 rg:1 4 24
1) (integer) 0
2) (integer) 1
3) (integer) 2
4) (integer) 3
5) (integer) 4

# Retrieve all the data points in ascending order.
> TS.RANGE rg:1 - +
1) 1) (integer) 0
   2) 18
2) 1) (integer) 1
   2) 14
3) 1) (integer) 2
   2) 22
4) 1) (integer) 3
   2) 18
5) 1) (integer) 4
   2) 24

# Retrieve data points up to day 1 (inclusive).
> TS.RANGE rg:1 - 1
1) 1) (integer) 0
   2) 18
2) 1) (integer) 1
   2) 14

# Retrieve data points from day 3 onwards.
> TS.RANGE rg:1 3 +
1) 1) (integer) 3
   2) 18
2) 1) (integer) 4
   2) 24

# Retrieve all the data points in descending order.
> TS.REVRANGE rg:1 - +
1) 1) (integer) 4
   2) 24
2) 1) (integer) 3
   2) 18
3) 1) (integer) 2
   2) 22
4) 1) (integer) 1
   2) 14
5) 1) (integer) 0
   2) 18

# Retrieve data points up to day 1 (inclusive), but
# return them in descending order.
> TS.REVRANGE rg:1 - 1
1) 1) (integer) 1
   2) 14
2) 1) (integer) 0
   2) 18
```

Both `TS.RANGE` and `TS.REVRANGE` also let you filter results. Specify
a list of timestamps to include only samples with those exact timestamps
in the results (you must still specify timestamp range parameters if you
use this option). Specify a minimum and maximum value to include only
samples within that range. The value range is inclusive and you can
use the same value for the minimum and maximum to filter for a single value.

```bash
> TS.RANGE rg:1 - + FILTER_BY_TS 0 2 4
1) 1) (integer) 0
   2) 18
2) 1) (integer) 2
   2) 22
3) 1) (integer) 4
   2) 24
> TS.REVRANGE rg:1 - + FILTER_BY_TS 0 2 4 FILTER_BY_VALUE 20 25
1) 1) (integer) 4
   2) 24
2) 1) (integer) 2
   2) 22
> TS.REVRANGE rg:1 - + FILTER_BY_TS 0 2 4 FILTER_BY_VALUE 22 22
1) 1) (integer) 2
   2) 22
```

### Querying multiple time series

The `TS.GET`, `TS.RANGE`, and `TS.REVRANGE` commands also have
corresponding
[`TS.MGET`]({{< relref "commands/ts.mget/" >}}),
[`TS.MRANGE`]({{< relref "commands/ts.mrange/" >}}), and
[`TS.MREVRANGE`]({{< relref "commands/ts.mrevrange/" >}}) versions that
operate on multiple time series. `TS.MGET` returns the last data point added
to each time series, while `TS.MRANGE` and `TS.MREVRANGE`
return data points from a range of timestamps in each time series.

The parameters are mostly the same except that the multiple time series
commands don't take a key name as the first parameter. Instead, you
specify a filter expression to include only time series with
specific labels. (See [Adding data points](#adding-data-points)
above to learn how to add labels to a time series.) The filter expressions
use a simple syntax that lets you include or exclude time series based on
the presence or value of a label. See the description in the
[`TS.MGET`]({{< relref "commands/ts.mget#required-arguments" >}}) command reference
for details of the filter syntax. You can also request that
data points be returned with all their labels or with a selected subset of them.

```bash
# Create three new rain gauge time series, two in the US
# and one in the UK, with different units and add some
# data points.
> TS.CREATE rg:2 LABELS location us unit cm
OK
> TS.CREATE rg:3 LABELS location us unit in
OK
> TS.CREATE rg:4 LABELS location uk unit mm
OK
> TS.MADD rg:2 0 1.8 rg:3 0 0.9 rg:4 0 25
1) (integer) 0
2) (integer) 0
3) (integer) 0
> TS.MADD rg:2 1 2.1 rg:3 1 0.77 rg:4 1 18
1) (integer) 1
2) (integer) 1
3) (integer) 1
127.0.0.1:6379> TS.MADD rg:2 2 2.3 rg:3 2 1.1 rg:4 2 21
1) (integer) 2
2) (integer) 2
3) (integer) 2
127.0.0.1:6379> TS.MADD rg:2 3 1.9 rg:3 3 0.81 rg:4 3 19
1) (integer) 3
2) (integer) 3
3) (integer) 3
127.0.0.1:6379> TS.MADD rg:2 4 1.78 rg:3 4 0.74 rg:4 4 23
1) (integer) 4
2) (integer) 4
3) (integer) 4

# Retrieve the last data point from each US rain gauge. If
# you don't specify any labels, an empty array is returned
# for the labels.
> TS.MGET FILTER location=us
1) 1) "rg:2"
   2) (empty array)
   3) 1) (integer) 4
      2) 1.78
2) 1) "rg:3"
   2) (empty array)
   3) 1) (integer) 4
      2) 7.4E-1

# Retrieve the same data points, but include the `unit`
# label in the results.
> TS.MGET SELECTED_LABELS unit FILTER location=us
1) 1) "rg:2"
   2) 1) 1) "unit"
         2) "cm"
   3) 1) (integer) 4
      2) 1.78
2) 1) "rg:3"
   2) 1) 1) "unit"
         2) "in"
   3) 1) (integer) 4
      2) 7.4E-1

# Retrieve data points up to day 2 (inclusive) from all
# rain gauges that report in millimeters. Include all
# labels in the results.
> TS.MRANGE - 2 WITHLABELS FILTER unit=mm
1) 1) "rg:4"
   2) 1) 1) "location"
         2) "uk"
      2) 1) "unit"
         2) "mm"
   3) 1) 1) (integer) 0
         2) 25
      2) 1) (integer) 1
         2) 18
      3) 1) (integer) 2
         2) 21

# Retrieve data points from day 1 to day 3 (inclusive) from
# all rain gauges that report in centimeters or millimeters,
# but only return the `location` label. Return the results
# in descending order of timestamp.
> TS.MREVRANGE 1 3 SELECTED_LABELS location FILTER unit=(cm,mm)
1) 1) "rg:2"
   2) 1) 1) "location"
         2) "us"
   3) 1) 1) (integer) 3
         2) 1.9
      2) 1) (integer) 2
         2) 2.3
      3) 1) (integer) 1
         2) 2.1
2) 1) "rg:4"
   2) 1) 1) "location"
         2) "uk"
   3) 1) 1) (integer) 3
         2) 19
      2) 1) (integer) 2
         2) 21
      3) 1) (integer) 1
         2) 18
```

## Deleting data points

Use [`TS.DEL`]({{< relref "commands/ts.del/" >}}) to delete data points
that fall within a given timestamp range. The range is inclusive, meaning that
samples whose timestamp equals the start or end of the range are deleted.
If you want to delete a single timestamp, use it as both the start and end of the range.

```bash
> TS.INFO thermometer:1
 1) totalSamples
 2) (integer) 2
 3) memoryUsage
 4) (integer) 4856
 5) firstTimestamp
 6) (integer) 1
 7) lastTimestamp
 8) (integer) 2
    .
    .
> TS.ADD thermometer:1 3 9.7
(integer) 3
127.0.0.1:6379> TS.INFO thermometer:1
 1) totalSamples
 2) (integer) 3
 3) memoryUsage
 4) (integer) 4856
 5) firstTimestamp
 6) (integer) 1
 7) lastTimestamp
 8) (integer) 3
    .
    .
> TS.DEL thermometer:1 1 2
(integer) 2
> TS.INFO thermometer:1
 1) totalSamples
 2) (integer) 1
 3) memoryUsage
 4) (integer) 4856
 5) firstTimestamp
 6) (integer) 3
 7) lastTimestamp
 8) (integer) 3
    .
    .
> TS.DEL thermometer:1 3 3
(integer) 1
> TS.INFO thermometer:1
 1) totalSamples
 2) (integer) 0
    .
    .
```

## Filtering
You can filter your time series by value, timestamp and labels:

### Filtering by label
You can retrieve datapoints from multiple timeseries in the same query, and the way to do this is by using label filters. For example:

```
TS.MRANGE - + FILTER area_id=32
```

This query will show data from all sensors (timeseries) that have a label of `area_id` with a value of `32`. The results will be grouped by timeseries.

Or we can also use the [`TS.MGET`]({{< relref "commands/ts.mget/" >}}) command to get the last sample that matches the specific filter:

```
TS.MGET FILTER area_id=32
```

### Filtering by value
We can filter by value across a single or multiple timeseries:

```
TS.RANGE sensor1 - + FILTER_BY_VALUE 25 30
```
This command will return all data points whose value sits between 25 and 30, inclusive.

To achieve the same filtering on multiple series we have to combine the filtering by value with filtering by label:

```
TS.MRANGE - +  FILTER_BY_VALUE 20 30 FILTER region=east
```

### Filtering by timestamp
To retrieve the datapoints for specific timestamps on one or multiple timeseries we can use the `FILTER_BY_TS` argument:

Filter on one timeseries:
```
TS.RANGE sensor1 - + FILTER_BY_TS 1626435230501 1626443276598
```

Filter on multiple timeseries:
```
TS.MRANGE - +  FILTER_BY_TS 1626435230501 1626443276598 FILTER region=east
```


## Aggregation
It's possible to combine values of one or more timeseries by leveraging aggregation functions:
```
TS.RANGE ... AGGREGATION aggType bucketDuration...
```

For example, to find the average temperature per hour in our `sensor1` series we could run:
```
TS.RANGE sensor1 - + + AGGREGATION avg 3600000
```

To achieve the same across multiple sensors from the area with id of 32 we would run:
```
TS.MRANGE - + AGGREGATION avg 3600000 FILTER area_id=32
```

### Aggregation bucket alignment
When doing aggregations, the aggregation buckets will be aligned to 0 as so:
```
TS.RANGE sensor3 10 70 + AGGREGATION min 25
```

```
Value:        |      (1000)     (2000)     (3000)     (4000)     (5000)     (6000)     (7000)
Timestamp:    |-------|10|-------|20|-------|30|-------|40|-------|50|-------|60|-------|70|--->

Bucket(25ms): |_________________________||_________________________||___________________________|
                           V                          V                           V
                  min(1000, 2000)=1000      min(3000, 4000)=3000     min(5000, 6000, 7000)=5000
```

And we will get the following datapoints: 1000, 3000, 5000.

You can choose to align the buckets to the start or end of the queried interval as so:
```
TS.RANGE sensor3 10 70 + AGGREGATION min 25 ALIGN start
```

```
Value:        |      (1000)     (2000)     (3000)     (4000)     (5000)     (6000)     (7000)
Timestamp:    |-------|10|-------|20|-------|30|-------|40|-------|50|-------|60|-------|70|--->

Bucket(25ms):          |__________________________||_________________________||___________________________|
                                    V                          V                           V
                        min(1000, 2000, 3000)=1000      min(4000, 5000)=4000     min(6000, 7000)=6000
```
The result array will contain the following datapoints: 1000, 4000 and 6000


### Aggregation across timeseries

By default, results of multiple timeseries will be grouped by timeseries, but (since v1.6) you can use the `GROUPBY` and `REDUCE` options to group them by label and apply an additional aggregation.

To find minimum temperature per region, for example, we can run:

```
TS.MRANGE - + FILTER region=(east,west) GROUPBY region REDUCE min
```

**Note:** When a sample is deleted, the data in all downsampled timeseries will be recalculated for the specific bucket. If part of the bucket has already been removed though, because it's outside of the retention period, we won't be able to recalculate the full bucket, so in those cases we will refuse the delete operation.

## Compaction

A time series can become large if samples are added very frequently. Instead
of dealing with individual samples, it is sometimes useful to split the full
time range of the series into equal-sized "buckets" and represent each
bucket by an aggregate value, such as the average or maximum value.
Reducing the number of data points in this way is known as *compaction*.

For example, if you expect to collect more than one billion data points in a day, you could aggregate the data using buckets of one minute. Since each bucket is represented by a single value, this compacts the dataset size to 1,440 data points (24 hours x 60 minutes = 1,440 minutes).

Use [`TS.CREATERULE`]({{< relref "commands/ts.createrule/" >}}) to create a

new
compacted time series from an existing one, leaving the original series unchanged.
Specify a duration for each bucket and an aggregation function to apply to each bucket.
The available aggregation functions are:

- `avg`: Arithmetic mean of all values
- `sum`: Sum of all values
- `min`: Minimum value
- `max`: Maximum value
- `range`: Difference between the highest and the lowest value
- `count`: Number of values
- `first`: Value with lowest timestamp in the bucket
- `last`:  Value with highest timestamp in the bucket
- `std.p`: Population standard deviation of the values
- `std.s`: Sample standard deviation of the values
- `var.p`: Population variance of the values
- `var.s`: Sample variance of the values
- `twa`: Time-weighted average over the bucket's timeframe (since RedisTimeSeries v1.8)

It's important to point out that there is no data rewriting on the original timeseries; the compaction happens in a new series, while the original one stays the same. In order to prevent the original timeseries from growing indefinitely, you can use the retention option, which will trim it down to a certain period of time.

**NOTE:** You need to create the destination (the compacted) timeseries before creating the rule.

```
TS.CREATERULE sourceKey destKey AGGREGATION aggregationType bucketDuration
```

Example:

```
TS.CREATE sensor1_compacted  # Create the destination timeseries first
TS.CREATERULE sensor1 sensor1_compacted AGGREGATION avg 60000   # Create the rule
```

With this creation rule, datapoints added to the `sensor1` timeseries will be grouped into buckets of 60 seconds (60000ms), averaged, and saved in the `sensor1_compacted` timeseries.


## Using with other metrics tools

In the [RedisTimeSeries](https://github.com/RedisTimeSeries) GitHub organization you can
find projects that help you integrate RedisTimeSeries with other tools, including:

1. [Prometheus](https://github.com/RedisTimeSeries/prometheus-redistimeseries-adapter), read/write adapter to use RedisTimeSeries as backend db.
2. [Grafana 7.1+](https://github.com/RedisTimeSeries/grafana-redis-datasource), using the [Redis Data Source](https://redislabs.com/blog/introducing-the-redis-data-source-plug-in-for-grafana/).
3. [Telegraf](https://github.com/influxdata/telegraf). Download the plugin from [InfluxData](https://portal.influxdata.com/downloads/). 
4. StatsD, Graphite exports using graphite protocol.
