---
acl_categories:
- '@timeseries'
- '@read'
- '@fast'
arguments:
- name: key
  type: key
- name: DEBUG
  optional: true
  type: string
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
description: Returns information and statistics for a time series
group: timeseries
hidden: false
linkTitle: TS.INFO
module: TimeSeries
since: 1.0.0
stack_path: docs/data-types/timeseries
summary: Returns information and statistics for a time series
syntax: "TS.INFO key \n  [DEBUG]\n"
syntax_fmt: TS.INFO key [DEBUG]
syntax_str: '[DEBUG]'
title: TS.INFO
---

Return information and statistics for a time series.

[Examples](#examples)

## Required arguments

<details open>
<summary><code>key</code></summary> 
is key name of the time series.
</details>

## Optional arguments

<details open>
<summary><code>[DEBUG]</code></summary>

is an optional flag to get a more detailed information about the chunks.
</details>

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

{{< multitabs id="ts-info-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) with information about the time series as flattened name-value pairs:

| Name<br>[Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) | Description
| ---------------------------- | -
| `totalSamples`    | [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}})<br> Total number of samples in this time series
| `memoryUsage`     | [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}})<br> Total number of bytes allocated for this time series, which is the sum of <br> - The memory used for storing the series' configuration parameters (retention period, duplication policy, etc.)<br>- The memory used for storing the series' compaction rules<br>- The memory used for storing the series' labels (key-value pairs)<br>- The memory used for storing the chunks (chunk header + compressed/uncompressed data)
| `firstTimestamp`  | [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}})<br> First timestamp present in this time series (Unix timestamp in milliseconds)
| `lastTimestamp`   | [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}})<br> Last timestamp present in this time series  (Unix timestamp in milliseconds)
| `retentionTime`   | [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}})<br> The retention period, in milliseconds, for this time series
| `chunkCount`      | [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}})<br> Number of chunks used for this time series
| `chunkSize`       | [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}})<br> The initial allocation size, in bytes, for the data part of each new chunk.<br>Actual chunks may consume more memory. Changing the chunk size (using [`TS.ALTER`]({{< relref "commands/ts.alter/" >}})) does not affect existing chunks.
| `chunkType`       | [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}})<br> The chunks type: `compressed` or `uncompressed`
| `duplicatePolicy` | [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) or [Nil reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}})<br> The [duplicate policy]({{< relref "develop/data-types/timeseries/configuration#duplicate_policy" >}}) of this time series
| `labels`          | [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) or [Nil reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}})<br> Metadata labels of this time series<br> Each element is a 2-elements [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of ([Bulk string reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}), [Bulk string reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}})) representing (label, value)
| `sourceKey`       | [Bulk string reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) or [Nil reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}})<br>Key name for source time series in case the current series is a target of a [compaction rule]({{< relref "commands/ts.createrule" >}})
| `rules`           | [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}})<br> [Compaction rules]({{< relref "commands/ts.createrule" >}}) defined in this time series<br> Each rule is an [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) with 4 elements:<br>- [Bulk string reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}): The compaction key<br>- [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): The bucket duration<br>- [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}): The aggregator<br>- [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): The alignment (since RedisTimeSeries v1.8)

When [`DEBUG`]({{< relref "/commands/debug" >}}) is specified, the response also contains:

| Name<br>[Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) | Description
| ---------------------------- | -
| `keySelfName`     | [Bulk string reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}})<br> Name of the key
| `Chunks`          | [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) with information about the chunks<br>Each element is an [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of information about a single chunk in a name([Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}))-value pairs:<br>- `startTimestamp` - [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) - First timestamp present in the chunk<br>- `endTimestamp` - [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) - Last timestamp present in the chunk<br>- `samples` - [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) - Total number of samples in the chunk<br>- `size` - [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) - the chunk's internal data size (without overheads) in bytes<br>- `bytesPerSample` - [Bulk string reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) (double) - Ratio of `size` and `samples`

-tab-sep-

[Map reply]({{< relref "/develop/reference/protocol-spec#maps" >}}) with information about the time series. The map contains the same fields as described in the RESP2 response, but organized as key-value pairs in a map structure rather than a flattened array.

When [`DEBUG`]({{< relref "/commands/debug" >}}) is specified, the response also contains the additional `keySelfName` and `Chunks` fields as described above.

{{< /multitabs >}}

## Examples

<details open>
<summary><b>Find information about a temperature/humidity time series by location and sensor type</b></summary>

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

Find information about the time series for temperature in the kitchen.

{{< highlight bash >}}
127.0.0.1:6379> TS.INFO telemetry:kitchen:temperature
 1) totalSamples
 2) (integer) 0
 3) memoryUsage
 4) (integer) 4246
 5) firstTimestamp
 6) (integer) 0
 7) lastTimestamp
 8) (integer) 0
 9) retentionTime
10) (integer) 0
11) chunkCount
12) (integer) 1
13) chunkSize
14) (integer) 4096
15) chunkType
16) compressed
17) duplicatePolicy
18) (nil)
19) labels
20) 1) 1) "room"
       2) "kitchen"
    2) 1) "type"
       2) "temperature"
21) sourceKey
22) (nil)
23) rules
24) (empty array)
{{< / highlight >}}

Query the time series using DEBUG to get more information about the chunks.

{{< highlight bash >}}
127.0.0.1:6379> TS.INFO telemetry:kitchen:temperature DEBUG
 1) totalSamples
 2) (integer) 0
 3) memoryUsage
 4) (integer) 4246
 5) firstTimestamp
 6) (integer) 0
 7) lastTimestamp
 8) (integer) 0
 9) retentionTime
10) (integer) 0
11) chunkCount
12) (integer) 1
13) chunkSize
14) (integer) 4096
15) chunkType
16) compressed
17) duplicatePolicy
18) (nil)
19) labels
20) 1) 1) "room"
       2) "kitchen"
    2) 1) "type"
       2) "temperature"
21) sourceKey
22) (nil)
23) rules
24) (empty array)
25) keySelfName
26) "telemetry:kitchen:temperature"
27) Chunks
28) 1)  1) startTimestamp
        2) (integer) 0
        3) endTimestamp
        4) (integer) 0
        5) samples
        6) (integer) 0
        7) size
        8) (integer) 4096
        9) bytesPerSample
       10) "inf"
{{< / highlight >}}

</details>

## See also

[`TS.RANGE`]({{< relref "commands/ts.range/" >}}) | [`TS.QUERYINDEX`]({{< relref "commands/ts.queryindex/" >}}) | [`TS.GET`]({{< relref "commands/ts.get/" >}})

## Related topics

[RedisTimeSeries]({{< relref "/develop/data-types/timeseries/" >}})
