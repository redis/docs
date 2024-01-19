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
syntax: "TS.CREATE key 
  [RETENTION retentionPeriod] 
  [ENCODING [UNCOMPRESSED|COMPRESSED]]\
  \ 
  [CHUNK_SIZE size] 
  [DUPLICATE_POLICY policy] 
  [LABELS {label value}...]
"
syntax_fmt: "TS.CREATE key [RETENTION\_retentionPeriod] [ENCODING\_<UNCOMPRESSED |
\
  \  COMPRESSED>] [CHUNK_SIZE\_size] [DUPLICATE_POLICY\_<BLOCK | FIRST |
  LAST |\
  \ MIN | MAX | SUM>] [LABELS\_label value [label value ...]]"
syntax_str: "[RETENTION\_retentionPeriod] [ENCODING\_<UNCOMPRESSED | COMPRESSED>]\
  \ [CHUNK_SIZE\_size] [DUPLICATE_POLICY\_<BLOCK | FIRST | LAST | MIN | MAX | SUM>]\
  \ [LABELS\_label value [label value ...]]"
title: TS.CREATE
---

Create a new time series

[Examples](#examples)

## Required arguments

<details open><summary><code>key</code></summary> 

is key name for the time series.
</details>

<note><b>Notes:</b>

- If a key already exists, you get a Redis error reply, `TSDB: key already exists`. You can check for the existence of a key with the [`EXISTS`](/commands/exists) command.
- Other commands that also create a new time series when called with a key that does not exist are [`TS.ADD`](/commands/ts.add), [`TS.INCRBY`](/commands/ts.incrby), and [`TS.DECRBY`](/commands/ts.decrby).
</note>

## Optional arguments

<details open><summary><code>RETENTION retentionPeriod</code></summary> 

is maximum age for samples compared to the highest reported timestamp, in milliseconds. Samples are expired based solely on the difference between their timestamp and the timestamps passed to subsequent [`TS.ADD`](/commands/ts.add), [`TS.MADD`](/commands/ts.madd), [`TS.INCRBY`](/commands/ts.incrby), and [`TS.DECRBY`](/commands/ts.decrby) calls with this key.

When set to 0, samples never expire. When not specified, the option is set to the global [RETENTION_POLICY](/docs/stack/timeseries/configuration/#retention_policy) configuration of the database, which by default is 0.
</details>

<details open><summary><code>ENCODING enc</code></summary> 

specifies the series samples encoding format as one of the following values:
 - `COMPRESSED`, applies compression to the series samples.
 - `UNCOMPRESSED`, keeps the raw samples in memory. Adding this flag keeps data in an uncompressed form. 

`COMPRESSED` is almost always the right choice. Compression not only saves memory but usually improves performance due to a lower number of memory accesses. It can result in about 90% memory reduction. The exception are highly irregular timestamps or values, which occur rarely.

When not specified, the option is set to `COMPRESSED`.
</details>

<details open><summary><code>CHUNK_SIZE size</code></summary> 

is initial allocation size, in bytes, for the data part of each new chunk. Actual chunks may consume more memory. Changing chunkSize (using [`TS.ALTER`](/commands/ts.alter)) does not affect existing chunks.

Must be a multiple of 8 in the range [48 .. 1048576]. When not specified, it is set to the global [CHUNK_SIZE_BYTES](/docs/stack/timeseries/configuration/#chunk_size_bytes) configuration of the database, which by default is 4096 (a single memory page).

Note: Before v1.6.10 no minimum was enforced. Between v1.6.10 and v1.6.17 and in v1.8.0 the minimum value was 128. Since v1.8.1 the minimum value is 48.

The data in each key is stored in chunks. Each chunk contains header and data for a given timeframe. An index contains all chunks. Iterations occur inside each chunk. Depending on your use case, consider these tradeoffs for having smaller or larger sizes of chunks:

  - Insert performance: Smaller chunks result in slower inserts (more chunks need to be created).
  - Query performance: Queries for a small subset when the chunks are very large are slower, as we need to iterate over the chunk to find the data.
  - Larger chunks may take more memory when you have a very large number of keys and very few samples per key, or less memory when you have many samples per key.

 If you are unsure about your use case, select the default.
</details>

<details open><summary><code>DUPLICATE_POLICY policy</code></summary> 

is policy for handling insertion ([`TS.ADD`](/commands/ts.add) and [`TS.MADD`](/commands/ts.madd)) of multiple samples with identical timestamps, with one of the following values:
  - `BLOCK`: ignore any newly reported value and reply with an error
  - `FIRST`: ignore any newly reported value
  - `LAST`: override with the newly reported value
  - `MIN`: only override if the value is lower than the existing value
  - `MAX`: only override if the value is higher than the existing value
  - `SUM`: If a previous sample exists, add the new sample to it so that the updated value is equal to (previous + new). If no previous sample exists, set the updated value equal to the new value.

  When not specified: set to the global [DUPLICATE_POLICY](/docs/stack/timeseries/configuration/#duplicate_policy) configuration of the database (which, by default, is `BLOCK`).
</details>

<details open><summary><code>LABELS {label value}...</code></summary> 

is set of label-value pairs that represent metadata labels of the key and serve as a secondary index.

The [`TS.MGET`](/commands/ts.mget), [`TS.MRANGE`](/commands/ts.mrange), and [`TS.MREVRANGE`](/commands/ts.mrevrange) commands operate on multiple time series based on their labels. The [`TS.QUERYINDEX`](/commands/ts.queryindex) command returns all time series keys matching a given filter based on their labels.
</details>

## Return value

Returns one of these replies:

- [Simple string reply](/docs/reference/protocol-spec#simple-strings) - `OK` if executed correctly
- [] on error (invalid arguments, key already exists, etc.)

## Examples 

<details open><summary><b>Create a temperature time series</b></summary>

{{< highlight bash >}}
127.0.0.1:6379> TS.CREATE temperature:2:32 RETENTION 60000 DUPLICATE_POLICY MAX LABELS sensor_id 2 area_id 32
OK
{{< / highlight >}}
</details>

## See also

[`TS.ADD`](/commands/ts.add) | [`TS.INCRBY`](/commands/ts.incrby) | [`TS.DECRBY`](/commands/ts.decrby) | [`TS.MGET`](/commands/ts.mget) | [`TS.MRANGE`](/commands/ts.mrange) | [`TS.MREVRANGE`](/commands/ts.mrevrange) | [`TS.QUERYINDEX`](/commands/ts.queryindex)

## Related topics

- [RedisTimeSeries](/docs/stack/timeseries)
- [RedisTimeSeries Version 1.2 Is Here!](https://redis.com/blog/redistimeseries-version-1-2-is-here/)
