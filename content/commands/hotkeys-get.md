---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
arity: 2
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
- admin
- noscript
complexity: O(K) where K is the number of hotkeys returned.
container: HOTKEYS
description: Returns lists of top K hotkeys depending on metrics chosen in HOTKEYS START command.
function: hotkeysCommand
group: server
hidden: false
linkTitle: HOTKEYS GET
railroad_diagram: /images/railroad/hotkeys-get.svg
reply_schema:
  oneOf:
  - additionalProperties: false
    description: Hotkeys report with collection metadata and two sorted lists
    properties:
      by-cpu-time:
        description: Array of hotkeys with CPU time percentages
        type: array
      by-net-bytes:
        description: Array of hotkeys with network throughput percentages
        type: array
      collection-duration:
        type: integer
      collection-start-time:
        type: integer
    type: object
  - description: If no tracking is started
    type: 'null'
since: 8.6.0
summary: Returns lists of top K hotkeys depending on metrics chosen in HOTKEYS START command.
syntax_fmt: HOTKEYS GET
title: HOTKEYS GET
---
Returns tracking results and metadata from the current or most recent hotkeys tracking session.

This command returns comprehensive information about the hotkeys tracking session, including:

- Tracking metadata (start time, duration, sample ratio, etc.)
- Performance statistics (CPU time, network bytes)
- Lists of top K hot keys sorted by the metrics specified in `HOTKEYS START`

The following metrics are collected for non-clustered as well as clustered Redis environments:

- `tracking-active` (integer): 1 if tracking is active, 0 if stopped
- `sample-ratio` (integer): The sampling ratio used during tracking
- `selected-slots` (array): [Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of select slots and slot ranges
- `all-commands-all-slots-us` (integer): CPU time in microseconds for all commands on all slots
- `net-bytes-all-commands-all-slots` (integer): Network bytes for all commands on all slots
- `collection-start-time-unix-ms` (integer): Unix timestamp in milliseconds when tracking started
- `collection-duration-ms` (integer): Duration of tracking in milliseconds
- `total-cpu-time-user-ms` (integer): User CPU time used in milliseconds (only when the `CPU` metric was specified with `HOTKEYS START`)
- `total-cpu-time-sys-ms` (integer): System CPU time used in milliseconds (only when the `CPU` metric was specified with `HOTKEYS START`)
- `total-net-bytes` (integer): Total network bytes processed (only when the `NET` metric was specified with `HOTKEYS START`)
- `by-cpu-time-us` (array): [Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of key-time pairs sorted by CPU time in microseconds (only when the `CPU` metric was specified with `HOTKEYS START`)
- `by-net-bytes` (array): [Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of key-bytes pairs sorted by network bytes (only when the `NET` metric was specified with `HOTKEYS START`)

The following additional results are collected only on clustered Redis environments, when `SLOTS` was used with `HOTKEYS START`:

- `sampled-commands-selected-slots-us` (integer): CPU time in milliseconds for sampled commands in selected slots (only when `SAMPLE` was used with `HOTKEYS START`)
- `all-commands-selected-slots-us` (integer): CPU time in milliseconds for all commands in selected slots
- `net-bytes-sampled-commands-selected-slots` (integer): Network bytes for sampled commands in selected slots (only when `SAMPLE` was used with `HOTKEYS START`)
- `net-bytes-all-commands-selected-slots` (integer): Network bytes for all commands on selected slots


## Example (both `NET` and `CPU` metrics specified)

```
HOTKEYS GET
1)  1) "tracking-active"
    2) (integer) 0
    3) "sample-ratio"
    4) (integer) 1
    5) "selected-slots"
    6) 1) 1) (integer) 0
          2) (integer) 16383
    7) "all-commands-all-slots-us"
    8) (integer) 103
    9) "net-bytes-all-commands-all-slots"
   10) (integer) 2042
   11) "collection-start-time-unix-ms"
   12) (integer) 1770824933147
   13) "collection-duration-ms"
   14) (integer) 0
   15) "total-cpu-time-user-ms"
   16) (integer) 23
   17) "total-cpu-time-sys-ms"
   18) (integer) 7
   19) "total-net-bytes"
   20) (integer) 2038
   21) "by-cpu-time-us"
   22)  1) "hotkey_001_counter"
        2) (integer) 29
        3) "hotkey_001"
        4) (integer) 25
        5) "hotkey_001_hash"
        6) (integer) 11
        7) "hotkey_001_list"
        8) (integer) 9
        9) "hotkey_001_set"
       10) (integer) 9
   23) "by-net-bytes"
   24)  1) "hotkey_001"
        2) (integer) 446
        3) "hotkey_002"
        4) (integer) 328
        5) "hotkey_001_hash"
        6) (integer) 198
        7) "hotkey_001_set"
        8) (integer) 167
        9) "hotkey_001_counter"
       10) (integer) 116
```

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

One of the following:

- [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) when tracking data is available, containing an array of pairs of field names and values.
- [Null reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) when no tracking has been started or data has been reset.

-tab-sep-

One of the following:

- [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) when tracking data is available, containing a [map]({{< relref "/develop/reference/protocol-spec#maps" >}}) of field names and values.
- [Null reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) when no tracking has been started or data has been reset.

{{< /multitabs >}}
