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
railroad_diagram: /images/railroad/ts.deleterule.svg
since: 1.0.0
stack_path: docs/data-types/timeseries
summary: Delete a compaction rule
syntax_fmt: TS.DELETERULE sourceKey destKey
title: TS.DELETERULE
---
> [!NOTE]
> This command's behavior varies in clustered Redis environments. See the [multi-key operations](/content/develop/using-commands/multi-key-operations.md) page for more information.



Delete a compaction rule

## Required arguments

<details open><summary><code>sourceKey</code></summary>

is key name for the source time series.
</details>

<details open><summary><code>destKey</code></summary> 

is key name for destination (compacted) time series.
</details>

<note><b>Note:</b> This command does not delete the compacted series.</note>

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |

## Return information

{{< multitabs id="ts-deleterule-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

One of the following:
* [Simple string reply](/content/develop/reference/protocol-spec.md#simple-strings): `OK` when the compaction rule is deleted successfully.
* [Simple error reply](/content/develop/reference/protocol-spec.md#simple-errors) in these cases: invalid arguments, or when such rule does not exist.

-tab-sep-

One of the following:
* [Simple string reply](/content/develop/reference/protocol-spec.md#simple-strings): `OK` when the compaction rule is deleted successfully.
* [Simple error reply](/content/develop/reference/protocol-spec.md#simple-errors) in these cases: invalid arguments, or when such rule does not exist.

{{< /multitabs >}}

## See also

[`TS.CREATERULE`](/content/commands/ts.createrule.md) 

## Related topics

[RedisTimeSeries](/content/develop/data-types/timeseries/_index.md)
