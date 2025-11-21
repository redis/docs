---
acl_categories:
- '@timeseries'
- '@write'
- '@slow'
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
- name: policy
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
  \ \n  [ENCODING <COMPRESSED|UNCOMPRESSED>] \n  [CHUNK_SIZE size] \n  [DUPLICATE_POLICY policy] \n  [IGNORE ignoreMaxTimediff ignoreMaxValDiff]\ \ \n\ \ [LABELS [label value ...]]\n"
syntax_fmt: "TS.DECRBY key value [TIMESTAMP\_timestamp]\n  [RETENTION\_retentionPeriod]\
  \ [ENCODING\_<COMPRESSED|UNCOMPRESSED>] [CHUNK_SIZE\_size]\n [DUPLICATE_POLICY\_policy] [LABELS\_[label value ...]]"
syntax_str: "value [TIMESTAMP\_timestamp] [RETENTION\_retentionPeriod] [ENCODING\_<COMPRESSED|UNCOMPRESSED>]\
  \ [CHUNK_SIZE\_size] [DUPLICATE_POLICY\_policy] [LABELS\_[label value ...]]"
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
- If a policy for handling duplicate samples (`IGNORE`) is defined for this time series - `TS.DECRBY` operations are affected as well (sample additions/modifications can be filtered).
- Explicitly adding samples to a compacted time series (using [`TS.ADD`]({{< relref "commands/ts.add/" >}}), [`TS.MADD`]({{< relref "commands/ts.madd/" >}}), [`TS.INCRBY`]({{< relref "commands/ts.incrby/" >}}), or `TS.DECRBY`) may result in inconsistencies between the raw and the compacted data. The compaction process may override such samples.
</note>

## Optional arguments

<details open><summary><code>TIMESTAMP timestamp</code></summary> 

is Unix time (integer, in milliseconds) specifying the sample timestamp or `*` to set the sample timestamp to the Unix time of the server's clock.

Unix time is the number of milliseconds that have elapsed since 00:00:00 UTC on 1 January 1970, the Unix epoch, without adjustments made due to leap seconds.

`timestamp` must be equal to or higher than the maximum existing timestamp. When equal, the value of the sample with the maximum existing timestamp is decreased. If it is higher, a new sample with a timestamp set to `timestamp` is created, and its value is set to the value of the sample with the maximum existing timestamp minus `subtrahend`. 

If the time series is empty, the value is set to `subtrahend`.
  
When not specified, the timestamp is set to the Unix time of the server's clock.
</details>

<details open><summary><code>RETENTION retentionPeriod</code></summary> 

is maximum retention period, compared to the maximum existing timestamp, in milliseconds.

Use it only if you are creating a new time series. It is ignored if you are adding samples to an existing time series. See `RETENTION` in [`TS.CREATE`]({{< relref "commands/ts.create/" >}}).
</details>

<details open><summary><code>ENCODING enc</code></summary> 

specifies the series sample encoding format.

Use it only if you are creating a new time series. It is ignored if you are adding samples to an existing time series. See `ENCODING` in [`TS.CREATE`]({{< relref "commands/ts.create/" >}}).
</details>

<details open><summary><code>CHUNK_SIZE size</code></summary> 

is memory size, in bytes, allocated for each data chunk.

Use it only if you are creating a new time series. It is ignored if you are adding samples to an existing time series. See `CHUNK_SIZE` in [`TS.CREATE`]({{< relref "commands/ts.create/" >}}).
</details>

<details open><summary><code>DUPLICATE_POLICY policy</code></summary>

is policy for handling insertion ([`TS.ADD`]({{< relref "commands/ts.add/" >}}) and [`TS.MADD`]({{< relref "commands/ts.madd/" >}})) of multiple samples with identical timestamps.

Use it only if you are creating a new time series. It is ignored if you are adding samples to an existing time series. See `DUPLICATE_POLICY` in [`TS.CREATE`]({{< relref "commands/ts.create/" >}}).
</details>

<details open><summary><code>IGNORE ignoreMaxTimediff ignoreMaxValDiff</code></summary> 

is the policy for handling duplicate samples. A new sample is considered a duplicate and is ignored if the following conditions are met:

  - The time series is not a compaction;
  - The time series' `DUPLICATE_POLICY` IS `LAST`;
  - The sample is added in-order (`timestamp ≥ max_timestamp`);
  - The difference of the current timestamp from the previous timestamp (`timestamp - max_timestamp`) is less than or equal to `IGNORE_MAX_TIME_DIFF`;
  - The absolute value difference of the current value from the value at the previous maximum timestamp (`abs(value - value_at_max_timestamp`) is less than or equal to `IGNORE_MAX_VAL_DIFF`.

where `max_timestamp` is the timestamp of the sample with the largest timestamp in the time series, and `value_at_max_timestamp` is the value at `max_timestamp`.

When not specified: set to the global [IGNORE_MAX_TIME_DIFF]({{< relref "develop/data-types/timeseries/configuration#ignore_max_time_diff-and-ignore_max_val_diff" >}}) and [IGNORE_MAX_VAL_DIFF]({{< relref "develop/data-types/timeseries/configuration#ignore_max_time_diff-and-ignore_max_val_diff" >}}), which are, by default, both set to 0.

These parameters are used when creating a new time series to set the per-key parameters, and are ignored when called with an existing time series (the existing per-key configuration parameters are used).
</details>

<details open><summary><code>LABELS [{label value}...]</code></summary> 

is set of label-value pairs that represent metadata labels of the key and serve as a secondary index.

Use it only if you are creating a new time series. It is ignored if you are adding samples to an existing time series. See `LABELS` in [`TS.CREATE`]({{< relref "commands/ts.create/" >}}).
</details>

<note><b>Notes</b>
- You can use this command to create a new time series and add a sample to it in a single command.
  `RETENTION`, `ENCODING`, `CHUNK_SIZE`, `DUPLICATE_POLICY`, `IGNORE`, and `LABELS` are used only when creating a new time series, and ignored when adding or modifying samples in an existing time series.
- Setting `RETENTION` and `LABELS` introduces additional time complexity.
</note>

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

{{< multitabs id="ts-decrby-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

One of the following:
* [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): the timestamp of the upserted sample. If the sample is ignored (see `IGNORE` in [`TS.CREATE`]({{< relref "commands/ts.create/" >}})), the reply will be the largest timestamp in the time series.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid arguments, wrong key type, or when `timestamp` is not equal to or higher than the maximum existing timestamp.

-tab-sep-

One of the following:
* [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): the timestamp of the upserted sample. If the sample is ignored (see `IGNORE` in [`TS.CREATE`]({{< relref "commands/ts.create/" >}})), the reply will be the largest timestamp in the time series.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid arguments, wrong key type, or when `timestamp` is not equal to or higher than the maximum existing timestamp.

{{< /multitabs >}}

## See also

[`TS.INCRBY`]({{< relref "commands/ts.incrby/" >}}) | [`TS.CREATE`]({{< relref "commands/ts.create/" >}}) 

## Related topics

[RedisTimeSeries]({{< relref "/develop/data-types/timeseries/" >}})
