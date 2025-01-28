---
arguments:
- name: key
  type: key
- name: retentionPeriod
  optional: true
  token: RETENTION
  type: integer
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
complexity: O(N) where N is the number of labels requested to update
description: Update the retention, chunk size, duplicate policy, and labels of an
  existing time series
group: timeseries
hidden: false
linkTitle: TS.ALTER
module: TimeSeries
since: 1.0.0
stack_path: docs/data-types/timeseries
summary: Update the retention, chunk size, duplicate policy, and labels of an existing
  time series
syntax: "TS.ALTER key \n  [RETENTION retentionPeriod] \n  [CHUNK_SIZE size] \n  [DUPLICATE_POLICY\
  \ policy] \n  [IGNORE ignoreMaxTimediff ignoreMaxValDiff] \n  [LABELS [label value ...]]\n"
syntax_fmt: "TS.ALTER key [RETENTION\_retentionPeriod] [CHUNK_SIZE\_size]\n  [DUPLICATE_POLICY\_\
  <BLOCK | FIRST | LAST | MIN | MAX | SUM>]\n  [IGNORE ignoreMaxTimediff ignoreMaxValDiff] \n  [LABELS\ [label value ...]]"
syntax_str: "[RETENTION\_retentionPeriod] [CHUNK_SIZE\_size] [DUPLICATE_POLICY\_<BLOCK\
  \ | FIRST | LAST | MIN | MAX | SUM>] [IGNORE ignoreMaxTimediff ignoreMaxValDiff] [LABELS\ [label value ...]]"
title: TS.ALTER
---

Update the retention, chunk size, duplicate policy, and labels of an existing time series

[Examples](#examples)

## Required arguments

<details open><summary><code>key</code></summary> 

is key name for the time series.
</details>

<note><b>Note:</b> This command alters only the specified element. For example, if you specify only `RETENTION` and `LABELS`, the chunk size and the duplicate policy are not altered. </note>

## Optional arguments

<details open><summary><code>RETENTION retentionPeriod</code></summary>

is maximum retention period, compared to the maximum existing timestamp, in milliseconds. See `RETENTION` in [`TS.CREATE`]({{< baseurl >}}/commands/ts.create/).
</details>

<details open><summary><code>CHUNK_SIZE size</code></summary> 

is the initial allocation size, in bytes, for the data part of each new chunk. Actual chunks may consume more memory. See `CHUNK_SIZE` in [`TS.CREATE`]({{< baseurl >}}/commands/ts.create/). Changing this value does not affect existing chunks.
</details>

<details open><summary><code>DUPLICATE_POLICY policy</code></summary> 

is policy for handling multiple samples with identical timestamps. See `DUPLICATE_POLICY` in [`TS.CREATE`]({{< baseurl >}}/commands/ts.create/).
</details>

<details open><summary><code>IGNORE ignoreMaxTimediff ignoreMaxValDiff</code></summary> 

is the policy for handling duplicate samples. See `IGNORE` in [`TS.CREATE`]({{< baseurl >}}/commands/ts.create/).
</details>

<details open><summary><code>LABELS [{label value}...]</code></summary> 

is set of label-value pairs that represent metadata labels of the key and serve as a secondary index.

If `LABELS` is specified, the given label list is applied. Labels that are not present in the given list are removed implicitly. Specifying `LABELS` with no label-value pairs removes all existing labels. See `LABELS` in [`TS.CREATE`]({{< baseurl >}}/commands/ts.create/).
</details>

## Return value

Returns one of these replies:

- [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) - `OK` if executed correctly
- [] on error (invalid arguments, wrong key type, key does not exist, etc.)

## Examples

<details open><summary><b>Alter a temperature time series</b></summary>

Create a temperature time series.

{{< highlight bash >}}
127.0.0.1:6379> TS.CREATE temperature:2:32 RETENTION 60000 DUPLICATE_POLICY MAX LABELS sensor_id 2 area_id 32
OK
{{< / highlight >}}

Alter the labels in the time series.

{{< highlight bash >}}
127.0.0.1:6379> TS.ALTER temperature:2:32 LABELS sensor_id 2 area_id 32 sub_area_id 15
OK
{{< / highlight >}}
</details>

## See also

[`TS.CREATE`]({{< baseurl >}}/commands/ts.create/) 

## Related topics

[RedisTimeSeries]({{< relref "/develop/data-types/timeseries/" >}})
