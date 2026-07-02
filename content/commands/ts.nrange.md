---
acl_categories:
- '@read'
- '@timeseries'
arguments:
- display_text: numkeys
  name: numkeys
  type: integer
- display_text: key
  key_spec_index: 0
  multiple: true
  name: key
  type: key
- display_text: fromTimestamp
  name: fromTimestamp
  type: string
- display_text: toTimestamp
  name: toTimestamp
  type: string
- display_text: latest
  name: latest
  optional: true
  token: LATEST
  type: pure-token
- arguments:
  - display_text: filter_by_ts_token
    name: filter_by_ts_token
    token: FILTER_BY_TS
    type: pure-token
  - display_text: ts
    multiple: true
    name: ts
    type: integer
  name: filter_by_ts_block
  optional: true
  type: block
- arguments:
  - display_text: filter_by_value_token
    name: filter_by_value_token
    token: FILTER_BY_VALUE
    type: pure-token
  - display_text: min
    name: min
    type: double
  - display_text: max
    name: max
    type: double
  name: filter_by_value_block
  optional: true
  type: block
- arguments:
  - display_text: count_token
    name: count_token
    token: COUNT
    type: pure-token
  - display_text: count
    name: count
    type: integer
  name: count_block
  optional: true
  type: block
- arguments:
  - arguments:
    - display_text: align_token
      name: align_token
      token: ALIGN
      type: pure-token
    - display_text: align
      name: align
      type: string
    name: align_block
    optional: true
    type: block
  - display_text: aggregation
    name: aggregation
    token: AGGREGATION
    type: pure-token
  - display_text: aggregators
    multiple: true
    name: aggregators
    type: string
  - display_text: bucketDuration
    name: bucketDuration
    type: integer
  - arguments:
    - display_text: buckettimestamp_token
      name: buckettimestamp_token
      token: BUCKETTIMESTAMP
      type: pure-token
    - arguments:
      - display_text: start
        name: start
        token: start
        type: pure-token
      - display_text: start
        name: start
        token: '-'
        type: pure-token
      - display_text: end
        name: end
        token: end
        type: pure-token
      - display_text: end
        name: end
        token: +
        type: pure-token
      - display_text: mid
        name: mid
        token: mid
        type: pure-token
      - display_text: mid
        name: mid
        token: '~'
        type: pure-token
      name: bt
      type: oneof
    name: buckettimestamp_block
    optional: true
    type: block
  - display_text: empty_token
    name: empty_token
    optional: true
    token: EMPTY
    type: pure-token
  name: aggregation_block
  optional: true
  type: block
arity: -5
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
command_flags:
- readonly
- module
- movablekeys
complexity: O(numkeys*(n/m+k)) where n = Number of samples, m = Chunk size (samples
  per chunk), k = Number of samples that are in the requested range
description: Query a range across multiple time series in forward direction, returning
  the results pivoted by timestamp (one value column per key)
group: timeseries
hidden: false
key_specs:
- RO: true
  access: true
  begin_search:
    spec:
      index: 1
    type: index
  find_keys:
    spec:
      firstkey: 1
      keynumidx: 0
      keystep: 1
    type: keynum
linkTitle: TS.NRANGE
module: TimeSeries
railroad_diagram: /images/railroad/ts.nrange.svg
since: 8.10.0
stack_path: docs/data-types/timeseries
summary: Query a range across multiple time series in forward direction, returning
  the results pivoted by timestamp (one value column per key)
syntax_fmt: "TS.NRANGE numkeys key [key ...] fromTimestamp toTimestamp [LATEST]\n\
  \  [FILTER_BY_TS ts [ts ...]] [FILTER_BY_VALUE min max] [COUNT count]\n  [[ALIGN\
  \ align] AGGREGATION aggregators [aggregators ...] bucketDuration\n  [BUCKETTIMESTAMP <start | - |\
  \ end | + | mid | ~>] [EMPTY]]"
title: TS.NRANGE
---
Query a range across an explicit list of time series in the forward direction, returning the results pivoted by timestamp: one row per distinct timestamp, ordered by increasing timestamp, with each row listing the keys' values in input order.

{{< note >}}
In a Redis cluster, all specified keys must map to the same hash slot. `TS.NRANGE` is a [single hash slot]({{< relref "/operate/oss_and_stack/reference/cluster-spec#key-distribution-model" >}}) command; it does not split a request across shards or merge replies from multiple hash slots.
{{< /note >}}

[Examples](#examples)

## Required arguments

<details open>
<summary><code>numkeys</code></summary>

is the number of time series keys that follow. It must be a positive integer and must equal the number of `key` arguments.
</details>

<details open>
<summary><code>key [key ...]</code></summary>

are the explicit time series keys to query. Key order and duplicate keys are significant: the reply has one value per `key` argument, in the order the keys are given. A repeated key produces a separate value for each occurrence.
</details>

<details open>
<summary><code>fromTimestamp</code></summary>

is the start timestamp for the range query (integer Unix timestamp in milliseconds) or `-` to denote the timestamp of the earliest sample among the specified time series. The range is inclusive.
</details>

<details open>
<summary><code>toTimestamp</code></summary>

is the end timestamp for the range query (integer Unix timestamp in milliseconds) or `+` to denote the timestamp of the latest sample among the specified time series. The range is inclusive.
</details>

## Optional arguments

<details open>
<summary><code>LATEST</code></summary>

is used when a time series is a compaction. With `LATEST`, TS.NRANGE also reports the compacted value of the latest, possibly partial, bucket, given that this bucket's start time falls within `[fromTimestamp, toTimestamp]`. Without `LATEST`, TS.NRANGE does not report the latest, possibly partial, bucket. When a time series is not a compaction, `LATEST` is ignored.

The data in the latest bucket of a compaction is possibly partial. A bucket is _closed_ and compacted only upon arrival of a new sample that _opens_ a new _latest_ bucket. There are cases, however, when the compacted value of the latest, possibly partial, bucket is also required. In such a case, use `LATEST`.
</details>

<details open>
<summary><code>FILTER_BY_TS ts...</code></summary>

filters samples by a list of specific timestamps. A sample passes the filter if its exact timestamp is specified and falls within `[fromTimestamp, toTimestamp]`. Samples are filtered before pivoting.

When used together with `AGGREGATION`: samples are filtered before being aggregated.
</details>

<details open>
<summary><code>FILTER_BY_VALUE min max</code></summary>

filters samples by minimum and maximum values. A sample passes the filter if its value is within the inclusive range `[min, max]`. `min` and `max` cannot be NaN values. Samples are filtered before pivoting.

When used together with `AGGREGATION`: samples are filtered before being aggregated.
</details>

<details open>
<summary><code>COUNT count</code></summary>

limits the number of returned pivot rows, keeping the rows with the lowest timestamps. The limit is applied after the per-timestamp merge.
</details>

<details open>
<summary><code>ALIGN align</code></summary>

is a time bucket alignment control for `AGGREGATION`. It controls the time bucket timestamps by changing the reference timestamp on which a bucket is defined.

`align` values include:

 - `start` or `-`: The reference timestamp will be the query start interval time (`fromTimestamp`) which can't be `-`
 - `end` or `+`: The reference timestamp will be the query end interval time (`toTimestamp`) which can't be `+`
 - A specific timestamp: align the reference timestamp to a specific time

<note><b>Note:</b> When not provided, alignment is set to `0`.</note>
</details>

<details open>
<summary><code>AGGREGATION aggregators [aggregators ...] bucketDuration</code></summary>

aggregates samples into time buckets.

Supply one aggregation spec per key, as separate, space-separated arguments in the same order as the keys: the spec in position _i_ applies to the key in position _i_, and the number of specs must equal `numkeys`. All keys share the same `bucketDuration`.

Each spec is a comma-separated list of one or more aggregators, exactly as in [`TS.RANGE`]({{< relref "commands/ts.range/" >}}) (for example `avg,max`); no whitespace is allowed inside a spec. A key contributes one value for each aggregator in its spec, and these values are concatenated into each pivot row in key order, then in the order the aggregators are listed. To apply several aggregators to one series, give that key a comma-separated spec such as `min,max`.

  - each `aggregator` is one of the following:

    | aggregator   | Description                                                     |
    | ------------ | --------------------------------------------------------------- |
    | `avg`        | Arithmetic mean of all non-NaN values                           |
    | `sum`        | Sum of all non-NaN values                                       |
    | `min`        | Minimum non-NaN value                                           |
    | `max`        | Maximum non-NaN value                                           |
    | `range`      | Difference between the maximum and the minimum non-NaN values   |
    | `count`      | Number of non-NaN values                                        |
    | `countNaN`   | Number of NaN values                                            |
    | `countAll`   | Number of values, including NaN and non-NaN                     |
    | `first`      | The non-NaN value with the lowest timestamp in the bucket       |
    | `last`       | The non-NaN value with the highest timestamp in the bucket      |
    | `std.p`      | Population standard deviation of the non-NaN values             |
    | `std.s`      | Sample standard deviation of the non-NaN values                 |
    | `var.p`      | Population variance of the non-NaN values                       |
    | `var.s`      | Sample variance of the non-NaN values                           |
    | `twa`        | Time-weighted average over the bucket's timeframe (ignores NaN values) |

  - `bucketDuration` is the duration of each bucket, in milliseconds.

  Without `ALIGN`, bucket start times are multiples of `bucketDuration`.

  With `ALIGN align`, bucket start times are multiples of `bucketDuration` with remainder `align % bucketDuration`.

  The first bucket start time is less than or equal to `fromTimestamp`.
</details>

<details open>
<summary><code>[BUCKETTIMESTAMP bt]</code></summary>

controls how bucket timestamps are reported.

| `bt`             | Timestamp reported for each bucket                            |
| ---------------- | ------------------------------------------------------------- |
| `-` or `start`   | the bucket's start time (default)                             |
| `+` or `end`     | the bucket's end time                                         |
| `~` or `mid`     | the bucket's mid time (rounded down if not an integer)        |
</details>

<details open>
<summary><code>[EMPTY]</code></summary>

is a flag, which, when specified, reports aggregations also for empty buckets.

| aggregator           | Value reported for each empty bucket |
| -------------------- | ------------------------------------ |
| `sum`, `count`       | `0`                                  |
| `last`               | The value of the last sample before the bucket's start. `NaN` when no such sample. |
| `twa`                | Average value over the bucket's timeframe based on linear interpolation of the last sample before the bucket's start and the first sample after the bucket's end. `NaN` when no such samples. |
| `min`, `max`, `range`, `avg`, `first`, `std.p`, `std.s` | `NaN` |

Regardless of the values of `fromTimestamp` and `toTimestamp`, no data is reported for buckets that end before the earliest sample or begin after the latest sample in the time series. When a bucket is reported for one key but a different key has no data in that bucket, that key's value is `NaN`.
</details>

## Examples

<details open>
<summary><b>Pivot raw samples from multiple series by timestamp</b></summary>

Create two time series and add samples at partially overlapping timestamps.

{{< highlight bash >}}
127.0.0.1:6379> TS.CREATE {sensor}:1
OK
127.0.0.1:6379> TS.CREATE {sensor}:2
OK
127.0.0.1:6379> TS.MADD {sensor}:1 1000 10 {sensor}:1 2000 12
1) (integer) 1000
2) (integer) 2000
127.0.0.1:6379> TS.MADD {sensor}:2 1000 20 {sensor}:2 3000 25
1) (integer) 1000
2) (integer) 3000
{{< / highlight >}}

Query both series and pivot the samples by timestamp. One row is returned for every distinct timestamp produced by at least one key, with the values ordered by input key. A key with no sample at a row's timestamp has a `NaN` value.

{{< highlight bash >}}
127.0.0.1:6379> TS.NRANGE 2 {sensor}:1 {sensor}:2 - +
1) 1) (integer) 1000
   2) 1) 10
      2) 20
2) 1) (integer) 2000
   2) 1) 12
      2) NaN
3) 1) (integer) 3000
   2) 1) NaN
      2) 25
{{< / highlight >}}
</details>

<details open>
<summary><b>Aggregate each series with a per-key aggregator</b></summary>

In aggregation mode, supply one aggregation spec per key, in key order. Here `{sensor}:1` is aggregated with `avg` and `{sensor}:2` with `sum`, both over 1000-millisecond buckets.

{{< highlight bash >}}
127.0.0.1:6379> TS.MADD {sensor}:1 1000 10 {sensor}:1 1100 20 {sensor}:1 2000 30
1) (integer) 1000
2) (integer) 1100
3) (integer) 2000
127.0.0.1:6379> TS.MADD {sensor}:2 1000 5 {sensor}:2 1100 15 {sensor}:2 2000 25
1) (integer) 1000
2) (integer) 1100
3) (integer) 2000
127.0.0.1:6379> TS.NRANGE 2 {sensor}:1 {sensor}:2 - + AGGREGATION avg sum 1000
1) 1) (integer) 1000
   2) 1) 15
      2) 20
2) 1) (integer) 2000
   2) 1) 30
      2) 25
{{< / highlight >}}
</details>

<details open>
<summary><b>Apply multiple aggregators to a series</b></summary>

Give a key a comma-separated spec to compute several aggregators for it in one query. Here `{sensor}:1` uses the spec `avg,max` (two values) and `{sensor}:2` uses `sum` (one value). Each row's value array is flat: it holds `{sensor}:1`'s `avg`, then its `max`, then `{sensor}:2`'s `sum`.

{{< highlight bash >}}
127.0.0.1:6379> TS.NRANGE 2 {sensor}:1 {sensor}:2 - + AGGREGATION avg,max sum 1000
1) 1) (integer) 1000
   2) 1) 15
      2) 20
      3) 20
2) 1) (integer) 2000
   2) 1) 30
      2) 30
      3) 25
{{< / highlight >}}
</details>

## Details

### Semantics

`TS.NRANGE` behaves like running a compatible [`TS.RANGE`]({{< relref "commands/ts.range/" >}}) over each input key and then performing a server-side outer join by timestamp. Rows are returned from the lowest timestamp to the highest.

In raw mode (no `AGGREGATION`):

- One row is returned for every distinct timestamp produced by at least one key.
- If a key has no sample at that timestamp, that key's value is `NaN`.

In aggregation mode (with `AGGREGATION`):

- One aggregation spec applies to each key position; the spec at position _i_ maps to the key at position _i_, and the number of specs must equal `numkeys`.
- Each spec is a comma-separated list of one or more aggregators. A key contributes one value per aggregator in its spec.
- Each row's value array is flat: the aggregator values are concatenated in key order, and within each key in the order its aggregators are listed. All keys share one `bucketDuration`.
- When a key has no data at a row's bucket, all of that key's value slots are `NaN`.
- With `EMPTY`, empty buckets can produce rows in which every value is `NaN`.

### NaN values

A `NaN` value can mean that a key had no sample (or no aggregation bucket) at the row's timestamp, or that the key stored or aggregated to a real `NaN`. These two cases are indistinguishable in the reply.

| Case                                            | Value                                           |
| ----------------------------------------------- | ----------------------------------------------- |
| Key has a raw sample at the row timestamp        | The sample value                                |
| Key has no raw sample at the row timestamp       | `NaN`                                           |
| Key has aggregated data for the row bucket       | The aggregated value                            |
| Key has no data for the row bucket               | `NaN`                                           |
| Key stores or aggregates to a real `NaN`         | `NaN`, indistinguishable from no data           |

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Not supported</span><br /> | <span title="Not supported">&#x274c; Flexible & Annual</span><br /><span title="Not supported">&#x274c; Free & Fixed</nobr></span> |  |

## Return information

{{< multitabs id="ts-nrange-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

One of the following:
* [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of pivot rows, ordered by increasing timestamp. Each row is an [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of an [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) (the timestamp) and a flat [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) values. The values are concatenated across keys in input order; with `AGGREGATION`, each key contributes one value per aggregator in its spec, otherwise one value per key. A missing value is reported as `NaN`. The reply is an empty array when no samples match.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid arguments, wrong number of aggregation specs, unknown aggregation type, wrong key type, etc.

-tab-sep-

One of the following:
* [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of pivot rows, ordered by increasing timestamp. Each row is an [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of an [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) (the timestamp) and a flat [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [Double reply]({{< relref "/develop/reference/protocol-spec#doubles" >}}) values. The values are concatenated across keys in input order; with `AGGREGATION`, each key contributes one value per aggregator in its spec, otherwise one value per key. A missing value is reported as `NaN`. The reply is an empty array when no samples match.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid arguments, wrong number of aggregation specs, unknown aggregation type, wrong key type, etc.

{{< /multitabs >}}

## See also

[`TS.NREVRANGE`]({{< relref "commands/ts.nrevrange/" >}}) | [`TS.RANGE`]({{< relref "commands/ts.range/" >}}) | [`TS.MRANGE`]({{< relref "commands/ts.mrange/" >}})

## Related topics

[RedisTimeSeries]({{< relref "/develop/data-types/timeseries/" >}})
