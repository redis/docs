---
acl_categories:
- '@timeseries'
- '@write'
- '@fast'
arguments:
- name: sourceKey
  type: key
- name: destKey
  type: key
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
description: Delete a compaction rule
group: timeseries
hidden: false
linkTitle: TS.DELETERULE
module: TimeSeries
since: 1.0.0
stack_path: docs/data-types/timeseries
summary: Delete a compaction rule
syntax: 'TS.DELETERULE sourceKey destKey

  '
syntax_fmt: TS.DELETERULE sourceKey destKey
syntax_str: destKey
title: TS.DELETERULE
---

Delete a compaction rule

## Required arguments

<details open><summary><code>sourceKey</code></summary>

is key name for the source time series.
</details>

<details open><summary><code>destKey</code></summary> 

is key name for destination (compacted) time series.
</details>

<note><b>Note:</b> This command does not delete the compacted series.</note>

## Return value

Returns one of these replies:

- [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) - `OK` if executed correctly
- [] on error (invalid arguments, etc.), or when such rule does not exist

## See also

[`TS.CREATERULE`]({{< relref "commands/ts.createrule/" >}}) 

## Related topics

[RedisTimeSeries]({{< relref "/develop/data-types/timeseries/" >}})
