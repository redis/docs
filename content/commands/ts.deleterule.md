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

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

{{< multitabs id="ts-deleterule-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

One of the following:
* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}): `OK` when the compaction rule is deleted successfully.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid arguments, or when such rule does not exist.

-tab-sep-

One of the following:
* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}): `OK` when the compaction rule is deleted successfully.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid arguments, or when such rule does not exist.

{{< /multitabs >}}

## See also

[`TS.CREATERULE`]({{< relref "commands/ts.createrule/" >}}) 

## Related topics

[RedisTimeSeries]({{< relref "/develop/data-types/timeseries/" >}})
