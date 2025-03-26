---
arguments:
- name: sourceKey
  type: key
- name: destKey
  type: key
- arguments:
  - name: avg
    token: AVG
    type: pure-token
  - name: first
    token: FIRST
    type: pure-token
  - name: last
    token: LAST
    type: pure-token
  - name: min
    token: MIN
    type: pure-token
  - name: max
    token: MAX
    type: pure-token
  - name: sum
    token: SUM
    type: pure-token
  - name: range
    token: RANGE
    type: pure-token
  - name: count
    token: COUNT
    type: pure-token
  - name: std.p
    token: STD.P
    type: pure-token
  - name: std.s
    token: STD.S
    type: pure-token
  - name: var.p
    token: VAR.P
    type: pure-token
  - name: var.s
    token: VAR.S
    type: pure-token
  - name: twa
    since: 1.8.0
    token: TWA
    type: pure-token
  name: aggregator
  token: AGGREGATION
  type: oneof
- name: bucketDuration
  type: integer
- name: alignTimestamp
  optional: true
  since: 1.8.0
  type: integer
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
complexity: O(1)
description: Create a compaction rule
group: timeseries
hidden: false
linkTitle: TS.CREATERULE
module: TimeSeries
since: 1.0.0
stack_path: docs/data-types/timeseries
summary: Create a compaction rule
syntax: "TS.CREATERULE sourceKey destKey \n  AGGREGATION aggregator bucketDuration\
  \ \n  [alignTimestamp]\n"
syntax_fmt: "TS.CREATERULE sourceKey destKey AGGREGATION\_<AVG | FIRST | LAST |\n\
  \  MIN | MAX | SUM | RANGE | COUNT | STD.P | STD.S | VAR.P | VAR.S |\n  TWA> bucketDuration\
  \ [alignTimestamp]"
syntax_str: "destKey AGGREGATION\_<AVG | FIRST | LAST | MIN | MAX | SUM | RANGE |\
  \ COUNT | STD.P | STD.S | VAR.P | VAR.S | TWA> bucketDuration [alignTimestamp]"
title: TS.CREATERULE
---

Create a compaction rule

[Examples](#examples)

## Required arguments

<details open><summary><code>sourceKey</code></summary>

is key name for the source time series.
</details>

<details open><summary><code>destKey</code></summary> 

is key name for destination (compacted) time series. It must be created before `TS.CREATERULE` is called. 
</details>

<details open><summary><code>AGGREGATION aggregator bucketDuration</code></summary> 

aggregates results into time buckets.

  - `aggregator` takes one of the following aggregation types:

    | `aggregator` | Description                                                                    |
    | ------------ | ------------------------------------------------------------------------------ |
    | `avg`        | Arithmetic mean of all values                                                  |
    | `sum`        | Sum of all values                                                              |
    | `min`        | Minimum value                                                                  |
    | `max`        | Maximum value                                                                  |
    | `range`      | Difference between the highest and the lowest value                            |
    | `count`      | Number of values                                                               |
    | `first`      | Value with lowest timestamp in the bucket                                      |
    | `last`       | Value with highest timestamp in the bucket                                     |
    | `std.p`      | Population standard deviation of the values                                    |
    | `std.s`      | Sample standard deviation of the values                                        |
    | `var.p`      | Population variance of the values                                              |
    | `var.s`      | Sample variance of the values                                                  |
    | `twa`        | Time-weighted average over the bucket's timeframe (since RedisTimeSeries v1.8) |

  - `bucketDuration` is duration of each bucket, in milliseconds.
  
<note><b>Notes</b>

- Only new samples that are added into the source series after the creation of the rule will be aggregated.
- Calling `TS.CREATERULE` with a nonempty `destKey` may result in inconsistencies between the raw and the compacted data.
- Explicitly adding samples to a compacted time series (using [`TS.ADD`]({{< relref "commands/ts.add/" >}}), [`TS.MADD`]({{< relref "commands/ts.madd/" >}}), [`TS.INCRBY`]({{< relref "commands/ts.incrby/" >}}), or [`TS.DECRBY`]({{< relref "commands/ts.decrby/" >}})) may result in inconsistencies between the raw and the compacted data. The compaction process may override such samples.
- If no samples are added to the source time series during a bucket period. no _compacted sample_ is added to the destination time series.
- The timestamp of a compacted sample added to the destination time series is set to the start timestamp the appropriate compaction bucket. For example, for a 10-minute compaction bucket with no alignment, the compacted samples timestamps are `x:00`, `x:10`, `x:20`, and so on.
- Deleting `destKey` will cause the compaction rule to be deleted as well.

{{% warning %}}
In a clustered environment, you must use [hash tags]({{< relref "/operate/oss_and_stack/reference/cluster-spec" >}}#hash-tags) to force `sourceKey` and `destKey` to be stored in the same hash slot. If you don't, Redis may fail to compact the data without displaying any error messages.
{{% /warning %}}
  
</note>

## Optional arguments

<details open><summary><code>alignTimestamp</code> (since RedisTimeSeries v1.8)</summary>

ensures that there is a bucket that starts exactly at `alignTimestamp` and aligns all other buckets accordingly. It is expressed in milliseconds. The default value is 0: aligned with the Unix epoch.

For example, if `bucketDuration` is 24 hours (`24 * 3600 * 1000`), setting `alignTimestamp` to 6 hours after the Unix epoch (`6 * 3600 * 1000`) ensures that each bucket’s timeframe is `[06:00 .. 06:00)`.
</details>

## Return value

Returns one of these replies:

- [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) - `OK` if executed correctly
- [] on error (invalid arguments, wrong key type, etc.), when `sourceKey` does not exist, when `destKey` does not exist, when `sourceKey` is already a destination of a compaction rule, when `destKey` is already a source or a destination of a compaction rule, or when `sourceKey` and `destKey` are identical

## Examples

<details open>
<summary><b>Create a compaction rule</b></summary>

Create a time series to store the temperatures measured in Tel Aviv.

{{< highlight bash >}}
127.0.0.1:6379> TS.CREATE temp:TLV LABELS type temp location TLV
OK
{{< / highlight >}}

Next, create a compacted time series named _dailyAvgTemp_ containing one compacted sample per 24 hours: the time-weighted average of all measurements taken from midnight to next midnight.

{{< highlight bash >}}
127.0.0.1:6379> TS.CREATE dailyAvgTemp:TLV LABELS type temp location TLV
127.0.0.1:6379> TS.CREATERULE temp:TLV dailyAvgTemp:TLV AGGREGATION twa 86400000 
{{< / highlight >}}

Now, also create a compacted time series named _dailyDiffTemp_. This time series will contain one compacted sample per 24 hours: the difference between the minimum and the maximum temperature measured between 06:00 and 06:00 next day.
 Here, 86400000 is the number of milliseconds in 24 hours, 21600000 is the number of milliseconds in 6 hours.

{{< highlight bash >}}
127.0.0.1:6379> TS.CREATE dailyDiffTemp:TLV LABELS type temp location TLV
127.0.0.1:6379> TS.CREATERULE temp:TLV dailyDiffTemp:TLV AGGREGATION range 86400000 21600000
{{< / highlight >}}
  
</details>

## See also

[`TS.DELETERULE`]({{< relref "commands/ts.deleterule/" >}}) 

## Related topics

[RedisTimeSeries]({{< relref "/develop/data-types/timeseries/" >}})
