---
acl_categories:
- '@read'
- '@timeseries'
arguments:
- arguments:
  - display_text: LABELS
    name: LABELS
    token: LABELS
    type: pure-token
  - arguments:
    - display_text: VALUES
      name: VALUES
      token: VALUES
      type: pure-token
    - display_text: label
      name: label
      type: string
    name: VALUES
    type: block
  name: subtype
  type: oneof
- arguments:
  - display_text: FILTER
    name: FILTER
    token: FILTER
    type: pure-token
  - display_text: filterExpr
    multiple: true
    name: filterExpr
    type: string
  name: FILTER
  optional: true
  type: block
arity: -2
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
command_flags:
- readonly
- module
complexity: O(n) where n is the number of time-series that match the filters (all
  indexed series when FILTER is omitted)
description: Get all label names, or all values of a given label, for time series
  matching a filter list, or all series
group: module
hidden: false
hints:
- dont_cache
linkTitle: TS.QUERYLABELS
module: timeseries
railroad_diagram: /images/railroad/ts.querylabels.svg
since: 8.10.0
summary: Get all label names, or all values of a given label, for time series matching
  a filter list, or all series
syntax_fmt: "TS.QUERYLABELS <LABELS | VALUES label> [FILTER filterExpr\n  [filterExpr\
  \ ...]]"
title: TS.QUERYLABELS
---
{{< note >}}
This command's behavior varies in clustered Redis environments. See the [multi-key operations]({{< relref "/develop/using-commands/multi-key-operations" >}}) page for more information.
{{< /note >}}

Get all label names, or all values of a given label, for the time series matching a filter list (or all series when no filter is given).

[Examples](#examples)

## Required arguments

<details open>
<summary><code>LABELS | VALUES label</code></summary>

selects what the command returns:

  - `LABELS` - returns the set of distinct label names used by the matching time series.
  - `VALUES label` - returns the set of distinct values of `label` used by the matching time series. The result is empty (not an error) when `label` does not exist or when no matching series carries it.

Each name or value appears at most once, regardless of how many series it belongs to. The order of the results is not defined.
</details>

## Optional arguments

<details open>
<summary><code>FILTER filterExpr [filterExpr ...]</code></summary>

restricts the command to the time series whose labels and label values match all of the filter expressions. When `FILTER` is omitted, the command considers all indexed time series.

Each filter expression has one of the following syntaxes:

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

## Examples

<details open>
<summary><b>List labels and label values for a set of sensors</b></summary>

Create a set of sensors to measure temperature and humidity in your study and kitchen.

{{< highlight bash >}}
redis> TS.CREATE telemetry:study:temperature LABELS room study type temperature
OK
redis> TS.CREATE telemetry:study:humidity LABELS room study type humidity
OK
redis> TS.CREATE telemetry:kitchen:temperature LABELS room kitchen type temperature
OK
redis> TS.CREATE telemetry:kitchen:humidity LABELS room kitchen type humidity
OK
{{< / highlight >}}

Retrieve the label names used by the time series located in the kitchen.

{{< highlight bash >}}
redis> TS.QUERYLABELS LABELS FILTER room=kitchen
1) "room"
2) "type"
{{< / highlight >}}

Retrieve the distinct values of the `type` label across all time series.

{{< highlight bash >}}
redis> TS.QUERYLABELS VALUES type
1) "humidity"
2) "temperature"
{{< / highlight >}}
</details>

## Details

### Access control

Unlike [`TS.QUERYINDEX`]({{< relref "commands/ts.queryindex/" >}}), which lists every matching key whether or not the user has read access to it, `TS.QUERYLABELS` silently omits the time series that the user is not allowed to read. Label names and values that belong only to unreadable series do not appear in the result.

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="ts-querylabels-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

One of the following:
* [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) where each element is a [Bulk string reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}): a label name (with `LABELS`) or a label value (with `VALUES`). The array is empty if no time series matches the filter.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid subtype, missing label after `VALUES`, or invalid filter expression.

-tab-sep-

One of the following:
* [Set reply]({{< relref "/develop/reference/protocol-spec#sets" >}}) where each element is a [Bulk string reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}): a label name (with `LABELS`) or a label value (with `VALUES`). The set is empty if no time series matches the filter.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid subtype, missing label after `VALUES`, or invalid filter expression.

{{< /multitabs >}}

## See also

[`TS.QUERYINDEX`]({{< relref "commands/ts.queryindex/" >}}) | [`TS.CREATE`]({{< relref "commands/ts.create/" >}}) | [`TS.MGET`]({{< relref "commands/ts.mget/" >}}) | [`TS.MRANGE`]({{< relref "commands/ts.mrange/" >}})

## Related topics

[RedisTimeSeries]({{< relref "/develop/data-types/timeseries/" >}})
