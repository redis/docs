---
acl_categories:
- '@timeseries'
- '@write'
- '@slow'
arguments:
- arguments:
  - name: key
    type: key
  - name: timestamp
    type: string
  - name: value
    type: double
  multiple: true
  name: ktv
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
complexity: O(N*M) when N is the amount of series updated and M is the amount of compaction
  rules or O(N) with no compaction
description: Append new samples to one or more time series
group: timeseries
hidden: false
linkTitle: TS.MADD
module: TimeSeries
railroad_diagram: /images/railroad/ts.madd.svg
since: 1.0.0
stack_path: docs/data-types/timeseries
summary: Append new samples to one or more time series
syntax_fmt: TS.MADD key timestamp value [key timestamp value ...]
title: TS.MADD
---

Append new samples to one or more time series

[Examples](#examples)

## Required arguments

<details open>
<summary><code>key</code></summary> 

is the key name for the time series.
</details>

<details open>
<summary><code>timestamp</code></summary>

is Unix time (integer, in milliseconds) specifying the sample timestamp or `*` to set the sample timestamp to the Unix time of the server's clock.

Unix time is the number of milliseconds that have elapsed since 00:00:00 UTC on 1 January 1970, the Unix epoch, without adjustments made due to leap seconds.
</details>

<details open>
<summary><code>value</code></summary>

is numeric data value of the sample (double). The double number should follow <a href="https://tools.ietf.org/html/rfc7159">RFC 7159</a> (the JSON standard). The parser rejects overly large values that would not fit in binary64. It does not accept infinite values. NaN (Not a Number) values are supported starting from Redis 8.6.
</details>

<note><b>Notes:</b>
- If `timestamp` is older than the retention period compared to the maximum existing timestamp, the sample is discarded and an error is returned.
- Explicitly adding samples to a compacted time series (using [`TS.ADD`]({{< relref "commands/ts.add/" >}}), `TS.MADD`, [`TS.INCRBY`]({{< relref "commands/ts.incrby/" >}}), or [`TS.DECRBY`]({{< relref "commands/ts.decrby/" >}})) may result in inconsistencies between the raw and the compacted data. The compaction process may override such samples.
- `ignoreMaxTimeDiff` and `ignoreMaxValDiff` cannot be specified as is the case with `TS.ADD`. However, the same logic still applies based on the values of the per-key configuration parameters. See the [`TS.ADD`]({{< relref "commands/ts.add/" >}}) command page for more information.
</note>

## Complexity

If a compaction rule exits on a time series, TS.MADD performance might be reduced.
The complexity of TS.MADD is always `O(N*M)`, where `N` is the amount of series updated and `M` is the number of compaction rules or `O(N)` with no compaction.

## Examples

<details open>
<summary><b>Add stock prices at different timestamps</b></summary>

Create two stocks and add their prices at three different timestamps.

{{< highlight bash >}}
127.0.0.1:6379> TS.CREATE stock:A LABELS type stock name A
OK
127.0.0.1:6379> TS.CREATE stock:B LABELS type stock name B
OK
127.0.0.1:6379> TS.MADD stock:A 1000 100 stock:A 1010 110 stock:A 1020 120 stock:B 1000 120 stock:B 1010 110 stock:B 1020 100
1) (integer) 1000
2) (integer) 1010
3) (integer) 1020
4) (integer) 1000
5) (integer) 1010
6) (integer) 1020
{{< / highlight >}}
</details>

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |

## Return information

{{< multitabs id="ts-madd-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

One of the following:
* [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}), where each element is an [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) representing the timestamp of a upserted sample. For each element that is ignored (see `IGNORE` in [`TS.CREATE`]({{< relref "commands/ts.create/" >}})), the reply element value will be the largest timestamp in the time series.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid arguments, wrong key type, duplication policy is `BLOCK`, or when `timestamp` is older than the retention period compared to the maximum existing timestamp.

-tab-sep-

One of the following:
* [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}), where each element is an [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) representing the timestamp of a upserted sample. For each element that is ignored (see `IGNORE` in [`TS.CREATE`]({{< relref "commands/ts.create/" >}})), the reply element value will be the largest timestamp in the time series.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid arguments, wrong key type, duplication policy is `BLOCK`, or when `timestamp` is older than the retention period compared to the maximum existing timestamp.

{{< /multitabs >}}

## See also

[`TS.MRANGE`]({{< relref "commands/ts.mrange/" >}}) | [`TS.RANGE`]({{< relref "commands/ts.range/" >}}) | [`TS.MREVRANGE`]({{< relref "commands/ts.mrevrange/" >}}) | [`TS.REVRANGE`]({{< relref "commands/ts.revrange/" >}})

## Related topics

[RedisTimeSeries]({{< relref "/develop/data-types/timeseries/" >}})
