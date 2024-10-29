---
arguments:
- name: key
  type: key
- name: retentionPeriod
  optional: true
  token: RETENTION
  type: integer
- arguments:
  - name: uncompressed
    token: UNCOMPRESSED
    type: pure-token
  - name: compressed
    token: COMPRESSED
    type: pure-token
  name: enc
  optional: true
  token: ENCODING
  type: oneof
- name: size
  optional: true
  token: CHUNK_SIZE
  type: integer
- arguments:
  - name: block
    token: BLOCK
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
  name: policy
  optional: true
  token: DUPLICATE_POLICY
  type: oneof
- arguments:
  - name: label
    type: string
  - name: value
    type: string
  multiple: true
  name: labels
  optional: true
  token: LABELS
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
complexity: O(1)
description: Create a new time series
group: timeseries
hidden: false
linkTitle: TS.CREATE
module: TimeSeries
since: 1.0.0
stack_path: docs/data-types/timeseries
summary: Create a new time series
syntax: "TS.CREATE key \n  [RETENTION retentionPeriod] \n  [ENCODING <COMPRESSED|UNCOMPRESSED>]\
  \ \n  [CHUNK_SIZE size] \n  [DUPLICATE_POLICY policy] \n  [IGNORE ignoreMaxTimediff ignoreMaxValDiff] \n  [LABELS [label value ...]]\n"
syntax_fmt: "TS.CREATE key [RETENTION\_retentionPeriod] [ENCODING\_<COMPRESSED |\n\
  \  UNCOMPRESSED>] [CHUNK_SIZE\_size] [DUPLICATE_POLICY\_<BLOCK | FIRST |\n  LAST |\
  \ MIN | MAX | SUM>]\n\ \ [IGNORE\_ignoreMaxTimediff\_ignoreMaxValDiff]\n\ \ [LABELS\_[label value ...]]"
syntax_str: "[RETENTION\_retentionPeriod] [ENCODING\_<COMPRESSED | UNCOMPRESSED>]\
  \ [CHUNK_SIZE\_size] [DUPLICATE_POLICY\_<BLOCK | FIRST | LAST | MIN | MAX | SUM>]\
  \ [IGNORE\_ignoreMaxTimediff\_ignoreMaxValDiff] [LABELS\_[label value ...]]"
title: TS.CREATE
---

Create a new time series

[Examples](#examples)

## Required arguments

<details open><summary><code>key</code></summary> 

is key name for the time series.
</details>

<note><b>Notes:</b>

- If a key already exists, you get a Redis error reply, `TSDB: key already exists`. You can check for the existence of a key with the [`EXISTS`]({{< relref "/commands/exists" >}}) command.
- Other commands that also create a new time series when called with a key that does not exist are [`TS.ADD`]({{< baseurl >}}/commands/ts.add/), [`TS.INCRBY`]({{< baseurl >}}/commands/ts.incrby/), and [`TS.DECRBY`]({{< baseurl >}}/commands/ts.decrby/).
</note>

## Optional arguments

<details open><summary><code>RETENTION retentionPeriod</code></summary> 

is maximum age for samples compared to the highest reported timestamp, in milliseconds. Samples are expired based solely on the difference between their timestamp and the timestamps passed to subsequent [`TS.ADD`]({{< baseurl >}}/commands/ts.add/), [`TS.MADD`]({{< baseurl >}}/commands/ts.madd/), [`TS.INCRBY`]({{< baseurl >}}/commands/ts.incrby/), and [`TS.DECRBY`]({{< baseurl >}}/commands/ts.decrby/) calls with this key.

When set to 0, samples never expire. When not specified, the option is set to the global [RETENTION_POLICY]({{< baseurl >}}/develop/data-types/timeseries/configuration#retention_policy) configuration of the database, which by default is 0.
</details>

<details open><summary><code>ENCODING enc</code></summary> 

specifies the series samples encoding format as one of the following values:
 - `COMPRESSED`, applies compression to the series samples.
 - `UNCOMPRESSED`, keeps the raw samples in memory. Adding this flag keeps data in an uncompressed form. 

`COMPRESSED` is almost always the right choice. Compression not only saves memory but usually improves performance due to a lower number of memory accesses. It can result in about 90% memory reduction. The exception are highly irregular timestamps or values, which occur rarely.

When not specified, the option is set to `COMPRESSED`.
</details>

<details open><summary><code>CHUNK_SIZE size</code></summary> 

is initial allocation size, in bytes, for the data part of each new chunk. Actual chunks may consume more memory. Changing chunkSize (using [`TS.ALTER`]({{< baseurl >}}/commands/ts.alter/)) does not affect existing chunks.

Must be a multiple of 8 in the range [48 .. 1048576]. When not specified, it is set to the global [CHUNK_SIZE_BYTES]({{< baseurl >}}/develop/data-types/timeseries/configuration#chunk_size_bytes) configuration of the database, which by default is 4096 (a single memory page).

Note: Before v1.6.10 no minimum was enforced. Between v1.6.10 and v1.6.17 and in v1.8.0 the minimum value was 128. Since v1.8.1 the minimum value is 48.

The data in each key is stored in chunks. Each chunk contains header and data for a given timeframe. An index contains all chunks. Iterations occur inside each chunk. Depending on your use case, consider these tradeoffs for having smaller or larger sizes of chunks:

  - Insert performance: Smaller chunks result in slower inserts (more chunks need to be created).
  - Query performance: Queries for a small subset when the chunks are very large are slower, as we need to iterate over the chunk to find the data.
  - Larger chunks may take more memory when you have a very large number of keys and very few samples per key, or less memory when you have many samples per key.

 If you are unsure about your use case, select the default.
</details>

<details open><summary><code>DUPLICATE_POLICY policy</code></summary> 

is policy for handling insertion ([`TS.ADD`]({{< baseurl >}}/commands/ts.add/) and [`TS.MADD`]({{< baseurl >}}/commands/ts.madd/)) of multiple samples with identical timestamps, with one of the following values:
  - `BLOCK`: ignore any newly reported value and reply with an error
  - `FIRST`: ignore any newly reported value
  - `LAST`: override with the newly reported value
  - `MIN`: only override if the value is lower than the existing value
  - `MAX`: only override if the value is higher than the existing value
  - `SUM`: If a previous sample exists, add the new sample to it so that the updated value is equal to (previous + new). If no previous sample exists, set the updated value equal to the new value.

  When not specified: set to the global [DUPLICATE_POLICY]({{< baseurl >}}/develop/data-types/timeseries/configuration#duplicate_policy) configuration of the database (which, by default, is `BLOCK`).

`BLOCK` is often used to avoid accidental changes. `FIRST` can be used as an optimization when duplicate reports are possible. `LAST` can be used when updates are being reported. `SUM` is used for counters (e.g., the number of cars entering a parking lot per minute when there are multiple reporting counting devices). `MIN` and `MAX` can be used, for example, to store the minimal/maximal stock price per minute (instead of storing all the samples and defining a compaction rule).

</details>

<details open><summary><code>IGNORE ignoreMaxTimediff ignoreMaxValDiff</code></summary> 

is the policy for handling duplicate samples. A new sample is considered a duplicate and is ignored if the following conditions are met:

  - The time series is not a compaction;
  - The time series' `DUPLICATE_POLICY` IS `LAST`;
  - The sample is added in-order (`timestamp ≥ max_timestamp`);
  - The difference of the current timestamp from the previous timestamp (`timestamp - max_timestamp`) is less than or equal to `IGNORE_MAX_TIME_DIFF`;
  - The absolute value difference of the current value from the value at the previous maximum timestamp (`abs(value - value_at_max_timestamp`) is less than or equal to `IGNORE_MAX_VAL_DIFF`.
 
where `max_timestamp` is the timestamp of the sample with the largest timestamp in the time series, and `value_at_max_timestamp` is the value at `max_timestamp`.

When not specified: set to the global [IGNORE_MAX_TIME_DIFF]({{< baseurl >}}/develop/data-types/timeseries/configuration#ignore_max_time_diff-and-ignore_max_val_diff) and [IGNORE_MAX_VAL_DIFF]({{< baseurl >}}/develop/data-types/timeseries/configuration#ignore_max_time_diff-and-ignore_max_val_diff), which are, by default, both set to 0.
</details>

<details open><summary><code>LABELS {label value}...</code></summary> 

is set of label-value pairs that represent metadata labels of the key and serve as a secondary index.

The [`TS.MGET`]({{< baseurl >}}/commands/ts.mget/), [`TS.MRANGE`]({{< baseurl >}}/commands/ts.mrange/), and [`TS.MREVRANGE`]({{< baseurl >}}/commands/ts.mrevrange/) commands operate on multiple time series based on their labels. The [`TS.QUERYINDEX`]({{< baseurl >}}/commands/ts.queryindex/) command returns all time series keys matching a given filter based on their labels.
</details>

## Return value

Returns one of these replies:

- [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) - `OK` if executed correctly
- [] on error (invalid arguments, key already exists, etc.)

## Examples 

<details open><summary><b>Create a temperature time series</b></summary>

{{< highlight bash >}}
127.0.0.1:6379> TS.CREATE temperature:2:32 RETENTION 60000 DUPLICATE_POLICY MAX LABELS sensor_id 2 area_id 32
OK
{{< / highlight >}}
</details>

## See also

[`TS.ADD`]({{< baseurl >}}/commands/ts.add/) | [`TS.INCRBY`]({{< baseurl >}}/commands/ts.incrby/) | [`TS.DECRBY`]({{< baseurl >}}/commands/ts.decrby/) | [`TS.MGET`]({{< baseurl >}}/commands/ts.mget/) | [`TS.MRANGE`]({{< baseurl >}}/commands/ts.mrange/) | [`TS.MREVRANGE`]({{< baseurl >}}/commands/ts.mrevrange/) | [`TS.QUERYINDEX`]({{< baseurl >}}/commands/ts.queryindex/)

## Related topics

- [RedisTimeSeries]({{< relref "/develop/data-types/timeseries/" >}})
- [RedisTimeSeries Version 1.2 Is Here!](https://redis.com/blog/redistimeseries-version-1-2-is-here/)
