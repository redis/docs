---
acl_categories:
- '@timeseries'
- '@read'
- '@slow'
arguments:
- name: key
  type: key
- name: fromTimestamp
  type: string
- name: toTimestamp
  type: string
- name: LATEST
  optional: true
  since: 1.8.0
  type: string
- multiple: true
  name: Timestamp
  optional: true
  token: FILTER_BY_TS
  type: integer
- arguments:
  - name: FILTER_BY_VALUE
    token: FILTER_BY_VALUE
    type: pure-token
  - name: min
    type: double
  - name: max
    type: double
  name: fbv
  optional: true
  type: block
- name: count
  optional: true
  token: COUNT
  type: integer
- arguments:
  - name: value
    optional: true
    token: ALIGN
    type: integer
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
  - name: buckettimestamp
    optional: true
    since: 1.8.0
    token: BUCKETTIMESTAMP
    type: pure-token
  - name: empty
    optional: true
    since: 1.8.0
    token: EMPTY
    type: pure-token
  name: aggregation
  optional: true
  type: block
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
complexity: O(n/m+k) where n = Number of data points, m = Chunk size (data points
  per chunk), k = Number of data points that are in the requested range
description: Query a range in reverse direction
group: timeseries
hidden: false
linkTitle: TS.REVRANGE
module: TimeSeries
railroad_diagram: /images/railroad/ts.revrange.svg
since: 1.4.0
stack_path: docs/data-types/timeseries
summary: Query a range in reverse direction
syntax: "TS.REVRANGE key fromTimestamp toTimestamp\n  [LATEST]\n  [FILTER_BY_TS ts...]\n\
  \  [FILTER_BY_VALUE min max]\n  [COUNT count]\n  [[ALIGN align] AGGREGATION aggregator\
  \ bucketDuration [BUCKETTIMESTAMP bt] [EMPTY]]\n"
syntax_fmt: "TS.REVRANGE key fromTimestamp toTimestamp [LATEST]\n  [FILTER_BY_TS\_\
  Timestamp [Timestamp ...]] [FILTER_BY_VALUE min max]\n  [COUNT\_count] [[ALIGN\_\
  value] AGGREGATION\_<AVG | FIRST | LAST | MIN\n  | MAX | SUM | RANGE | COUNT | STD.P\
  \ | STD.S | VAR.P | VAR.S | TWA>\n  bucketDuration [BUCKETTIMESTAMP] [EMPTY]]"
syntax_str: "fromTimestamp toTimestamp [LATEST] [FILTER_BY_TS\_Timestamp [Timestamp\
  \ ...]] [FILTER_BY_VALUE min max] [COUNT\_count] [[ALIGN\_value] AGGREGATION\_<AVG\
  \ | FIRST | LAST | MIN | MAX | SUM | RANGE | COUNT | STD.P | STD.S | VAR.P | VAR.S\
  \ | TWA> bucketDuration [BUCKETTIMESTAMP] [EMPTY]]"
title: TS.REVRANGE
---

Query a range in reverse direction

[Examples](#examples)

## Required arguments

<details open>
<summary><code>key</code></summary>

is the key name for the time series.
</details>

<details open>
<summary><code>fromTimestamp</code></summary>

is start timestamp for the range query (integer Unix timestamp in milliseconds) or `-` to denote the timestamp of the earliest sample in the time series.
</details>

<details open>
<summary><code>toTimestamp</code></summary>

is end timestamp for the range query (integer Unix timestamp in milliseconds) or `+` to denote the timestamp of the latest sample in the time series.

<note><b>Note:</b>  When the time series is a compaction, the last compacted value may aggregate raw values with timestamp beyond `toTimestamp`. That is because `toTimestamp` limits only the timestamp of the compacted value, which is the start time of the raw bucket that was compacted.</note>

</details>

## Optional arguments

<details open>
<summary><code>LATEST</code> (since RedisTimeSeries v1.8)</summary>

is used when a time series is a compaction. With `LATEST`, TS.REVRANGE also reports the compacted value of the latest, possibly partial, bucket, given that this bucket's start time falls within `[fromTimestamp, toTimestamp]`. Without `LATEST`, TS.REVRANGE does not report the latest, possibly partial, bucket. When a time series is not a compaction, `LATEST` is ignored.
  
The data in the latest bucket of a compaction is possibly partial. A bucket is _closed_ and compacted only upon arrival of a new sample that _opens_ a new _latest_ bucket. There are cases, however, when the compacted value of the latest, possibly partial, bucket is also required. In such a case, use `LATEST`.
</details>

<details open>
<summary><code>FILTER_BY_TS ts...</code> (since RedisTimeSeries v1.6)</summary>

filters samples by a list of specific timestamps. A sample passes the filter if its exact timestamp is specified and falls within `[fromTimestamp, toTimestamp]`.

When used together with `AGGREGATION`: samples are filtered before being aggregated.
</details>

<details open>
<summary><code>FILTER_BY_VALUE min max</code> (since RedisTimeSeries v1.6)</summary>

filters samples by minimum and maximum values.

When used together with `AGGREGATION`: samples are filtered before being aggregated.
</details>

<details open>
<summary><code>COUNT count</code></summary>

When used without `AGGREGATION`: limits the number of reported samples.

When used together with `AGGREGATION`: limits the number of reported buckets.
</details>

<details open>
<summary><code>ALIGN align</code> (since RedisTimeSeries v1.6)</summary>

is a time bucket alignment control for `AGGREGATION`. It controls the time bucket timestamps by changing the reference timestamp on which a bucket is defined. 
Values include:
   
 - `start` or `-`: The reference timestamp will be the query start interval time (`fromTimestamp`) which can't be `-`
 - `end` or `+`: The reference timestamp will be the query end interval time (`toTimestamp`) which can't be `+`
 - A specific timestamp: align the reference timestamp to a specific time
   
<note><b>NOTE:</b> When not provided, alignment is set to `0`.</note>

</details>

<details open>
<summary><code>AGGREGATION aggregator bucketDuration</code></summary>
aggregates samples into time buckets, where:

  - `aggregator` takes one of the following aggregation types:

    | `aggregator` | Description                                                                    |
    | ------------ | ------------------------------------------------------------------------------ |
    | `avg`        | Arithmetic mean of all values                                                  |
    | `sum`        | Sum of all values                                                              |
    | `min`        | Minimum value                                                                  |
    | `max`        | Maximum value                                                                  |
    | `range`      | Difference between the maximum and the minimum value                           |
    | `count`      | Number of values                                                               |
    | `first`      | Value with lowest timestamp in the bucket                                      |
    | `last`       | Value with highest timestamp in the bucket                                     |
    | `std.p`      | Population standard deviation of the values                                    |
    | `std.s`      | Sample standard deviation of the values                                        |
    | `var.p`      | Population variance of the values                                              |
    | `var.s`      | Sample variance of the values                                                  |
    | `twa`        | Time-weighted average over the bucket's timeframe (since RedisTimeSeries v1.8) |

  - `bucketDuration` is duration of each bucket, in milliseconds.
  
  Without `ALIGN`, bucket start times are multiples of `bucketDuration`.
  
  With `ALIGN align`, bucket start times are multiples of `bucketDuration` with remainder `align % bucketDuration`.
  
  The first bucket start time is less than or equal to `fromTimestamp`.  
</details>

<details open>
<summary><code>[BUCKETTIMESTAMP bt]</code> (since RedisTimeSeries v1.8)</summary>

controls how bucket timestamps are reported.

| `bt`             | Timestamp reported for each bucket                            |
| ---------------- | ------------------------------------------------------------- |
| `-` or `start`   | the bucket's start time (default)                             |
| `+` or `end`     | the bucket's end time                                         |
| `~` or `mid`     | the bucket's mid time (rounded down if not an integer)        |
</details>

<details open>
<summary><code>[EMPTY]</code> (since RedisTimeSeries v1.8)</summary>
is a flag, which, when specified, reports aggregations also for empty buckets.

| `aggregator`         | Value reported for each empty bucket |
| -------------------- | ------------------------------------ |
| `sum`, `count`       | `0`                                  |
| `last`               | The value of the last sample before the bucket's start. `NaN` when no such sample. |
| `twa`                | Average value over the bucket's timeframe based on linear interpolation of the last sample before the bucket's start and the first sample after the bucket's end. `NaN` when no such samples. |
| `min`, `max`, `range`, `avg`, `first`, `std.p`, `std.s` | `NaN` |

Regardless of the values of `fromTimestamp` and `toTimestamp`, no data is reported for buckets that end before the earliest sample or begin after the latest sample in the time series.
</details>

## Complexity

TS.REVRANGE complexity can be improved in the future by using binary search to find the start of the range, which makes this `O(Log(n/m)+k*m)`.
But, because `m` is small, you can disregard it and look at the operation as `O(Log(n)+k)`.

## Examples

<details open>
<summary><b>Filter results by timestamp or sample value</b></summary>

Consider a metric where acceptable values are between -100 and 100, and the value 9999 is used as an indication of bad measurement.

{{< highlight bash >}}
127.0.0.1:6379> TS.CREATE temp:TLV LABELS type temp location TLV
OK
127.0.0.1:6379> TS.MADD temp:TLV 1000 30 temp:TLV 1010 35 temp:TLV 1020 9999 temp:TLV 1030 40
1) (integer) 1000
2) (integer) 1010
3) (integer) 1020
4) (integer) 1030
{{< / highlight >}}

Now, retrieve all values except out-of-range values.

{{< highlight bash >}}
TS.REVRANGE temp:TLV - + FILTER_BY_VALUE -100 100
1) 1) (integer) 1030
   2) 40
2) 1) (integer) 1010
   2) 35
3) 1) (integer) 1000
   2) 30
{{< / highlight >}}

Now, retrieve the average value, while ignoring out-of-range values.

{{< highlight bash >}}
TS.REVRANGE temp:TLV - + FILTER_BY_VALUE -100 100 AGGREGATION avg 1000
1) 1) (integer) 1000
   2) 35
{{< / highlight >}}
</details>

<details open>
<summary><b>Align aggregation buckets</b></summary>

To demonstrate alignment, let’s create a stock and add prices at three different timestamps.

{{< highlight bash >}}
127.0.0.1:6379> TS.CREATE stock:A LABELS type stock name A
OK
127.0.0.1:6379> TS.MADD stock:A 1000 100 stock:A 1010 110 stock:A 1020 120
1) (integer) 1000
2) (integer) 1010
3) (integer) 1020
127.0.0.1:6379> TS.MADD stock:A 2000 200 stock:A 2010 210 stock:A 2020 220
1) (integer) 2000
2) (integer) 2010
3) (integer) 2020
127.0.0.1:6379> TS.MADD stock:A 3000 300 stock:A 3010 310 stock:A 3020 320
1) (integer) 3000
2) (integer) 3010
3) (integer) 3020
{{< / highlight >}}

Next, aggregate without using `ALIGN`, defaulting to alignment 0.

{{< highlight bash >}}
127.0.0.1:6379> TS.REVRANGE stock:A - + AGGREGATION min 20
1) 1) (integer) 3020
   2) 320
2) 1) (integer) 3000
   2) 300
3) 1) (integer) 2020
   2) 220
4) 1) (integer) 2000
   2) 200
5) 1) (integer) 1020
   2) 120
6) 1) (integer) 1000
   2) 100
{{< / highlight >}}

And now set `ALIGN` to 10 to have a bucket start at time 10, and align all the buckets with a 20 milliseconds duration.

{{< highlight bash >}}
127.0.0.1:6379> TS.REVRANGE stock:A - + ALIGN 10 AGGREGATION min 20
1) 1) (integer) 3010
   2) 310
2) 1) (integer) 2990
   2) 300
3) 1) (integer) 2010
   2) 210
4) 1) (integer) 1990
   2) 200
5) 1) (integer) 1010
   2) 110
6) 1) (integer) 990
   2) 100
{{< / highlight >}}

When the start timestamp for the range query is explicitly stated (not `-`), you can set ALIGN to that time by setting align to `-` or to `start`.

{{< highlight bash >}}
127.0.0.1:6379> TS.REVRANGE stock:A 5 + ALIGN - AGGREGATION min 20
1) 1) (integer) 3005
   2) 310
2) 1) (integer) 2985
   2) 300
3) 1) (integer) 2005
   2) 210
4) 1) (integer) 1985
   2) 200
5) 1) (integer) 1005
   2) 110
6) 1) (integer) 985
   2) 100
{{< / highlight >}}

Similarly, when the end timestamp for the range query is explicitly stated, you can set ALIGN to that time by setting align to `+` or to `end`.
</details>

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

{{< multitabs id="ts-revrange-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

One of the following:
* [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of ([Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}), [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}})) pairs representing (timestamp, value) in reverse chronological order.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid filter value, wrong key type, key does not exist, etc.

-tab-sep-

One of the following:
* [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of ([Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}), [Double reply]({{< relref "/develop/reference/protocol-spec#doubles" >}})) pairs representing (timestamp, value) in reverse chronological order.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid filter value, wrong key type, key does not exist, etc.

{{< /multitabs >}}

## See also

[`TS.RANGE`]({{< relref "commands/ts.range/" >}}) | [`TS.MRANGE`]({{< relref "commands/ts.mrange/" >}}) | [`TS.MREVRANGE`]({{< relref "commands/ts.mrevrange/" >}})

## Related topics

[RedisTimeSeries]({{< relref "/develop/data-types/timeseries/" >}})
