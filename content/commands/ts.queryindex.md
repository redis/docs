---
acl_categories:
- '@timeseries'
- '@read'
- '@slow'
arguments:
- arguments:
  - name: l=v
    type: string
  - name: l!=v
    type: string
  - name: l=
    type: string
  - name: l!=
    type: string
  - name: l=(v1,v2,...)
    type: string
  - name: l!=(v1,v2,...)
    type: string
  multiple: true
  name: filterExpr
  type: oneof
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
complexity: O(n) where n is the number of time-series that match the filters
description: Get all time series keys matching a filter list
group: timeseries
hidden: false
linkTitle: TS.QUERYINDEX
module: TimeSeries
railroad_diagram: /images/railroad/ts.queryindex.svg
since: 1.0.0
stack_path: docs/data-types/timeseries
summary: Get all time series keys matching a filter list
syntax: "TS.QUERYINDEX filterExpr..."
syntax_fmt: "TS.QUERYINDEX <l=v | l!=v | l= | l!= | l=(v1,v2,...) |\n  l!=(v1,v2,...)\
  \ [l=v | l!=v | l= | l!= | l=(v1,v2,...) |\n  l!=(v1,v2,...) ...]>"
title: TS.QUERYINDEX
---
{{< note >}}
This command is affected by cross-slot operations. See the [multi-key operations]({{< relref "/develop/using-commands/multi-key-operations" >}}) page for more information.
{{< /note >}}



Get all time series keys matching a filter list. Note: all matching keys will be listed, whether or not the user has read access.

[Examples](#examples)

## Required arguments

<details open>
<summary><code>filterExpr...</code></summary>

filters time series based on their labels and label values. Each filter expression has one of the following syntaxes:

  - `label!=` - the time series has a label named `label`
  - `label=value` - the time series has a label named `label` with a value equal to `value`
  - `label=(value1,value2,...)` - the time series has a label named `label` with a value equal to one of the values in the list
  - `label=` - the time series does not have a label named `label`
  - `label!=value` - the time series does not have a label named `label` with a value equal to `value`
  - `label!=(value1,value2,...)` - the time series does not have a label named `label` with a value equal to any of the values in the list

  <note><b>Notes:</b>
   - At least one filter expression with a syntax `label=value` or `label=(value1,value2,...)` is required.
   - Filter expressions are conjunctive. For example, the filter `type=temperature room=study` means that a time series is a temperature time series of a study room.
   - Whitespaces are unallowed in a filter expression except between quotes or double quotes in values - e.g., `x="y y"` or `x='(y y,z z)'`.
   </note>
</details>

<note><b>Note:</b> The `QUERYINDEX` command cannot be part of a transaction when running on a Redis cluster.</note>

## Examples

<details open>
<summary><b>Find keys by location and sensor type</b></summary>

Create a set of sensors to measure temperature and humidity in your study and kitchen.

{{< highlight bash >}}
127.0.0.1:6379> TS.CREATE telemetry:study:temperature LABELS room study type temperature
OK
127.0.0.1:6379> TS.CREATE telemetry:study:humidity LABELS room study type humidity
OK
127.0.0.1:6379> TS.CREATE telemetry:kitchen:temperature LABELS room kitchen type temperature
OK
127.0.0.1:6379> TS.CREATE telemetry:kitchen:humidity LABELS room kitchen type humidity
OK
{{< / highlight >}}

Retrieve keys of all time series representing sensors located in the kitchen. 

{{< highlight bash >}}
127.0.0.1:6379> TS.QUERYINDEX room=kitchen
1) "telemetry:kitchen:humidity"
2) "telemetry:kitchen:temperature"
{{< / highlight >}}

To retrieve the keys of all time series representing sensors that measure temperature, use this query:

{{< highlight bash >}}
127.0.0.1:6379> TS.QUERYINDEX type=temperature
1) "telemetry:kitchen:temperature"
2) "telemetry:study:temperature"
{{< / highlight >}}
</details>

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |

## Return information

{{< multitabs id="ts-queryindex-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

One of the following:
* [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) where each element is a [Bulk string reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}): a time series key. The array is empty if no time series matches the filter.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid filter expression.

-tab-sep-

One of the following:
* [Set reply]({{< relref "/develop/reference/protocol-spec#sets" >}}) where each element is a [Bulk string reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}): a time series key. The set is empty if no time series matches the filter.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid filter expression.

{{< /multitabs >}}

## See also

[`TS.CREATE`]({{< relref "commands/ts.create/" >}}) | [`TS.MRANGE`]({{< relref "commands/ts.mrange/" >}}) | [`TS.MREVRANGE`]({{< relref "commands/ts.mrevrange/" >}}) | [`TS.MGET`]({{< relref "commands/ts.mget/" >}})

## Related topics

[RedisTimeSeries]({{< relref "/develop/data-types/timeseries/" >}})
