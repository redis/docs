---
arguments:
- name: key
  type: key
- name: value
  type: double
- name: timestamp
  optional: true
  token: TIMESTAMP
  type: string
- name: retentionPeriod
  optional: true
  token: RETENTION
  type: integer
- name: uncompressed
  optional: true
  token: UNCOMPRESSED
  type: pure-token
- name: size
  optional: true
  token: CHUNK_SIZE
  type: integer
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
complexity: O(M) when M is the amount of compaction rules or O(1) with no compaction
description: Decrease the value of the sample with the maximum existing timestamp,
  or create a new sample with a value equal to the value of the sample with the maximum
  existing timestamp with a given decrement
group: timeseries
hidden: false
linkTitle: TS.DECRBY
module: TimeSeries
since: 1.0.0
stack_path: docs/data-types/timeseries
summary: Decrease the value of the sample with the maximum existing timestamp, or
  create a new sample with a value equal to the value of the sample with the maximum
  existing timestamp with a given decrement
syntax: "TS.DECRBY key subtrahend \n  [TIMESTAMP timestamp] \n  [RETENTION retentionPeriod]\
  \ \n  [UNCOMPRESSED] \n  [CHUNK_SIZE size] \n  [LABELS {label value}...]\n"
syntax_fmt: "TS.DECRBY key value [TIMESTAMP\_timestamp]\n  [RETENTION\_retentionPeriod]\
  \ [UNCOMPRESSED] [CHUNK_SIZE\_size]\n  [LABELS\_label value [label value ...]]"
syntax_str: "value [TIMESTAMP\_timestamp] [RETENTION\_retentionPeriod] [UNCOMPRESSED]\
  \ [CHUNK_SIZE\_size] [LABELS\_label value [label value ...]]"
title: TS.DECRBY
---

Decrease the value of the sample with the maximum existing timestamp, or create a new sample with a value equal to the value of the sample with the maximum existing timestamp with a given decrement

[Examples](#examples)

## Required arguments

<details open><summary><code>key</code></summary> 

is key name for the time series.
</details>

<details open><summary><code>subtrahend</code></summary> 

is numeric value of the subtrahend (double).
</details>

<note><b>Notes</b>
- When specified key does not exist, a new time series is created.
- You can use this command as a counter or gauge that automatically gets history as a time series.
- Explicitly adding samples to a compacted time series (using [`TS.ADD`]({{< baseurl >}}/commands/ts.add/), [`TS.MADD`]({{< baseurl >}}/commands/ts.madd/), [`TS.INCRBY`]({{< baseurl >}}/commands/ts.incrby/), or `TS.DECRBY`) may result in inconsistencies between the raw and the compacted data. The compaction process may override such samples.
</note>

## Optional arguments

<details open><summary><code>TIMESTAMP timestamp</code></summary> 

is Unix time (integer, in milliseconds) specifying the sample timestamp or `*` to set the sample timestamp to the Unix time of the server's clock.

Unix time is the number of milliseconds that have elapsed since 00:00:00 UTC on 1 January 1970, the Unix epoch, without adjustments made due to leap seconds.

`timestamp` must be equal to or higher than the maximum existing timestamp. When equal, the value of the sample with the maximum existing timestamp is decreased. If it is higher, a new sample with a timestamp set to `timestamp` is created, and its value is set to the value of the sample with the maximum existing timestamp minus `subtrahend`. 

If the time series is empty, the value is set to `subtrahend`.
  
When not specified, the timestamp is set to the Unix time of the server's clock.
</details>

<details open><summary><code>RETENTION retentionPeriod</code></summmary> 

is maximum retention period, compared to the maximum existing timestamp, in milliseconds. Use it only if you are creating a new time series. It is ignored if you are adding samples to an existing time series. See `RETENTION` in [`TS.CREATE`]({{< baseurl >}}/commands/ts.create/).
</details>

<details open><summary><code>UNCOMPRESSED</code></summary>

changes data storage from compressed (default) to uncompressed. Use it only if you are creating a new time series. It is ignored if you are adding samples to an existing time series. See `ENCODING` in [`TS.CREATE`]({{< baseurl >}}/commands/ts.create/).
</details>

<details open><summary><code>CHUNK_SIZE size</code></summary> 

is memory size, in bytes, allocated for each data chunk. Use it only if you are creating a new time series. It is ignored if you are adding samples to an existing time series. See `CHUNK_SIZE` in [`TS.CREATE`]({{< baseurl >}}/commands/ts.create/).
</details>

<details open><summary><code>LABELS [{label value}...]</code></summary> 

is set of label-value pairs that represent metadata labels of the key and serve as a secondary index. Use it only if you are creating a new time series. It is ignored if you are adding samples to an existing time series. See `LABELS` in [`TS.CREATE`]({{< baseurl >}}/commands/ts.create/).
</details>

<note><b>Notes</b>

 - You can use this command to add data to a nonexisting time series in a single command.
  This is why `RETENTION`, `UNCOMPRESSED`,  `CHUNK_SIZE`, and `LABELS` are optional arguments.
 - When specified and the key doesn't exist, a new time series is created.
  Setting the `RETENTION` and `LABELS` introduces additional time complexity.
</note>

## Return value

Returns one of these replies:

- [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) - the timestamp of the upserted sample
- [] on error (invalid arguments, wrong key type, etc.), or when `timestamp` is not equal to or higher than the maximum existing timestamp

## See also

[`TS.INCRBY`]({{< baseurl >}}/commands/ts.incrby/) | [`TS.CREATE`]({{< baseurl >}}/commands/ts.create/) 

## Related topics

[RedisTimeSeries]({{< relref "/develop/data-types/timeseries/" >}})
