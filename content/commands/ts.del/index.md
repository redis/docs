---
acl_categories:
- '@timeseries'
- '@write'
- '@slow'
arguments:
- name: key
  type: key
- name: from_timestamp
  type: integer
- name: to_timestamp
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
complexity: O(N) where N is the number of data points that will be removed
description: Delete all samples between two timestamps for a given time series
group: timeseries
hidden: false
linkTitle: TS.DEL
module: TimeSeries
since: 1.6.0
stack_path: docs/data-types/timeseries
summary: Delete all samples between two timestamps for a given time series
syntax: 'TS.DEL key fromTimestamp toTimestamp

  '
syntax_fmt: TS.DEL key from_timestamp to_timestamp
syntax_str: from_timestamp to_timestamp
title: TS.DEL
---

Delete all samples between two timestamps for a given time series

[Examples](#examples)

## Required arguments

<details open><summary><code>key</code></summary> 

is key name for the time series.
</details>

<details open><summary><code>fromTimestamp</code></summary> 

is start timestamp for the range deletion.
</details>

<details open><summary><code>toTimestamp</code></summary>

is end timestamp for the range deletion.

The given timestamp interval is closed (inclusive), meaning that samples whose timestamp eqauls the `fromTimestamp` or `toTimestamp` are also deleted.

<note><b>Notes:</b>
  
- If fromTimestamp is older than the retention period compared to the maximum existing timestamp, the deletion is discarded and an error is returned.
- When deleting a sample from a time series for which compaction rules are defined:
  - If all the original samples for an affected compaction bucket are available, the compacted value is recalculated based on the remaining original samples, or removed if all original samples within the compaction bucket  were deleted.
  - If original samples for an affected compaction bucket were expired, the deletion is discarded and an error is returned.
- Explicitly deleting samples from a compacted time series may result in inconsistencies between the raw and the compacted data. The compaction process may override such samples. That being said, it is safe to explicitly delete samples from a compacted time series beyond the retention period of the original time series.

</note>

## Return value

Returns one of these replies:

- [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) - the number of samples that were deleted
- [] on error (invalid arguments, wrong key type, etc.), when `timestamp` is older than the retention period compared to the maximum existing timestamp, or when an affected compaction bucket cannot be recalculated

## Examples 

<details open><summary><b>Delete range of data points</b></summary>

Create time series for temperature in Tel Aviv and Jerusalem, then add different temperature samples.

{{< highlight bash >}}
127.0.0.1:6379> TS.CREATE temp:TLV LABELS type temp location TLV
OK
127.0.0.1:6379> TS.CREATE temp:JLM LABELS type temp location JLM
OK
127.0.0.1:6379> TS.MADD temp:TLV 1000 30 temp:TLV 1010 35 temp:TLV 1020 9999 temp:TLV 1030 40
1) (integer) 1000
2) (integer) 1010
3) (integer) 1020
4) (integer) 1030
127.0.0.1:6379> TS.MADD temp:JLM 1005 30 temp:JLM 1015 35 temp:JLM 1025 9999 temp:JLM 1035 40
1) (integer) 1005
2) (integer) 1015
3) (integer) 1025
4) (integer) 1035
{{< / highlight >}}

Delete the range of data points for temperature in Tel Aviv.

{{< highlight bash >}}
127.0.0.1:6379> TS.DEL temp:TLV 1000 1030
(integer) 4
{{< / highlight >}}
</details>

## See also

[`TS.ADD`]({{< baseurl >}}/commands/ts.add/) 

## Related topics

[RedisTimeSeries]({{< relref "/develop/data-types/timeseries/" >}})
