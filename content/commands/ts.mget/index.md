---
arguments:
- name: LATEST
  optional: true
  since: 1.8.0
  type: string
- arguments:
  - name: WITHLABELS
    token: WITHLABELS
    type: pure-token
  - arguments:
    - name: SELECTED_LABELS
      token: SELECTED_LABELS
      type: pure-token
    - multiple: true
      name: label1
      type: string
    name: SELECTED_LABELS_BLOCK
    type: block
  name: labels
  optional: true
  type: oneof
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
  token: FILTER
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
description: Get the sample with the highest timestamp from each time series matching
  a specific filter
group: timeseries
hidden: false
linkTitle: TS.MGET
module: TimeSeries
since: 1.0.0
stack_path: docs/data-types/timeseries
summary: Get the sample with the highest timestamp from each time series matching
  a specific filter
syntax: 'TS.MGET [LATEST] [WITHLABELS | <SELECTED_LABELS label...>] FILTER filterExpr...

  '
syntax_fmt: "TS.MGET [LATEST] [WITHLABELS | <SELECTED_LABELS label1 [label1 ...]>]\n\
  \  FILTER\_<l=v | l!=v | l= | l!= | l=(v1,v2,...) | l!=(v1,v2,...)\n  [l=v | l!=v\
  \ | l= | l!= | l=(v1,v2,...) | l!=(v1,v2,...) ...]>"
syntax_str: "[WITHLABELS | <SELECTED_LABELS label1 [label1 ...]>] FILTER\_<l=v | l!=v\
  \ | l= | l!= | l=(v1,v2,...) | l!=(v1,v2,...) [l=v | l!=v | l= | l!= | l=(v1,v2,...)\
  \ | l!=(v1,v2,...) ...]>"
title: TS.MGET
---

Get the sample with the highest timestamp from each time series matching a specific filter

[Examples](#examples)

## Required arguments

<details open>
<summary><code>FILTER filterExpr...</code></summary>

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

## Optional arguments

<details open>
<summary><code>LATEST</code> (since RedisTimeSeries v1.8)</summary> 

is used when a time series is a compaction. With `LATEST`, TS.MGET also reports the compacted value of the latest (possibly partial) bucket, given that this bucket's start time falls within `[fromTimestamp, toTimestamp]`. Without `LATEST`, TS.MGET does not report the latest (possibly partial) bucket. When a time series is not a compaction, `LATEST` is ignored.
  
The data in the latest bucket of a compaction is possibly partial. A bucket is _closed_ and compacted only upon the arrival of a new sample that _opens_ a new _latest_ bucket. There are cases, however, when the compacted value of the latest (possibly partial) bucket is also required. In such a case, use `LATEST`.
</details>

<details open>
<summary><code>WITHLABELS</code></summary> 

includes in the reply all label-value pairs representing metadata labels of the time series. 
If `WITHLABELS` or `SELECTED_LABELS` are not specified, by default, an empty list is reported as label-value pairs.

</details>

<details open>
<summary><code>SELECTED_LABELS label...</code> (since RedisTimeSeries v1.6)</summary> 

returns a subset of the label-value pairs that represent metadata labels of the time series. 
Use when a large number of labels exists per series, but only the values of some of the labels are required. 
If `WITHLABELS` or `SELECTED_LABELS` are not specified, by default, an empty list is reported as label-value pairs.

</details>

<note><b>Note:</b> The [`MGET`]({{< relref "/commands/mget" >}}) command cannot be part of a transaction when running on a Redis cluster.</note>

## Return value

- [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}): for each time series matching the specified filters, the following is reported:
  - bulk-string-reply: The time series key name
  - [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}): label-value pairs ([Bulk string reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}), [Bulk string reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}))
    - By default, an empty array is reported
    - If `WITHLABELS` is specified, all labels associated with this time series are reported
    - If `SELECTED_LABELS label...` is specified, the selected labels are reported (null value when no such label defined)
  - [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}): a single timestamp-value pair ([Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}), [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) (double))

## Examples

<details open>
<summary><b>Select labels to retrieve</b></summary>

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

Get all the labels associated with the last sample.

{{< highlight bash >}}
127.0.0.1:6379> TS.MGET WITHLABELS FILTER type=temp
1) 1) "temp:JLM"
   2) 1) 1) "type"
         2) "temp"
      2) 1) "location"
         2) "JLM"
   3) 1) (integer) 1035
      2) 40
2) 1) "temp:TLV"
   2) 1) 1) "type"
         2) "temp"
      2) 1) "location"
         2) "TLV"
   3) 1) (integer) 1030
      2) 40
{{< / highlight >}}

To get only the `location` label for each last sample, use `SELECTED_LABELS`.

{{< highlight bash >}}
127.0.0.1:6379> TS.MGET SELECTED_LABELS location FILTER type=temp
1) 1) "temp:JLM"
   2) 1) 1) "location"
         2) "JLM"
   3) 1) (integer) 1035
      2) 40
2) 1) "temp:TLV"
   2) 1) 1) "location"
         2) "TLV"
   3) 1) (integer) 1030
      2) 40
{{< / highlight >}}
</details>

## See also

[`TS.MRANGE`]({{< relref "commands/ts.mrange/" >}}) | [`TS.RANGE`]({{< relref "commands/ts.range/" >}}) | [`TS.MREVRANGE`]({{< relref "commands/ts.mrevrange/" >}}) | [`TS.REVRANGE`]({{< relref "commands/ts.revrange/" >}})

## Related topics

[RedisTimeSeries]({{< relref "/develop/data-types/timeseries/" >}})

