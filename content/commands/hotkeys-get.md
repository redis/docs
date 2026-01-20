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
- Lists of top K hotkeys sorted by the metrics specified in `HOTKEYS START`

## Example

```
HOTKEYS GET
 1) "tracking-active"
 2) (integer) 0
 3) "sample-ratio"
 4) (integer) 1
 5) "selected-slots"
 6) (empty array)
 7) "all-commands-all-slots-ms"
 8) (integer) 0
 9) "net-bytes-all-commands-all-slots"
10) (integer) 129
11) "collection-start-time-unix-ms"
12) (integer) 1768927872057
13) "collection-duration-ms"
14) (integer) 1
15) "total-cpu-time-user-ms"
16) (integer) 0
17) "total-cpu-time-sys-ms"
18) (integer) 0
19) "total-net-bytes"
20) (integer) 129
21) "by-cpu-time"
22) 1) "key1"
    2) (integer) 13
    3) "key2"
    4) (integer) 2
23) "by-net-bytes"
24) 1) "key1"
    2) (integer) 89
    3) "key2"
    4) (integer) 40
```

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

One of the following:

**[Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}})** when tracking data is available, containing pairs of field names and values:

- `tracking-active` (integer): 1 if tracking is active, 0 if stopped
- `sample-ratio` (integer): The sampling ratio used during tracking
- `selected-slots` (array): Array of slot numbers being tracked (empty if all slots)
- `sampled-command-selected-slots-ms` (integer): Time in milliseconds for sampled commands on selected slots (conditional)
- `all-commands-selected-slots-ms` (integer): Time in milliseconds for all commands on selected slots (conditional)
- `all-commands-all-slots-ms` (integer): Time in milliseconds for all commands on all slots
- `net-bytes-sampled-commands-selected-slots` (integer): Network bytes for sampled commands on selected slots (conditional)
- `net-bytes-all-commands-selected-slots` (integer): Network bytes for all commands on selected slots (conditional)
- `net-bytes-all-commands-all-slots` (integer): Network bytes for all commands on all slots
- `collection-start-time-unix-ms` (integer): Unix timestamp in milliseconds when tracking started
- `collection-duration-ms` (integer): Duration of tracking in milliseconds
- `used-cpu-sys-ms` (integer): System CPU time used in milliseconds
- `used-cpu-user-ms` (integer): User CPU time used in milliseconds
- `total-net-bytes` (integer): Total network bytes processed
- `by-cpu-time` (array): Array of key-time pairs sorted by CPU time (if CPU tracking enabled)
- `by-net-bytes` (array): Array of key-bytes pairs sorted by network bytes (if NET tracking enabled)

**[Null reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}})** when no tracking has been started or data has been reset.

-tab-sep-

One of the following:

**[Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}})** when tracking data is available, containing pairs of field names and values:

- `tracking-active` (integer): 1 if tracking is active, 0 if stopped
- `sample-ratio` (integer): The sampling ratio used during tracking
- `selected-slots` (array): Array of slot numbers being tracked (empty if all slots)
- `sampled-command-selected-slots-ms` (integer): Time in milliseconds for sampled commands on selected slots (conditional)
- `all-commands-selected-slots-ms` (integer): Time in milliseconds for all commands on selected slots (conditional)
- `all-commands-all-slots-ms` (integer): Time in milliseconds for all commands on all slots
- `net-bytes-sampled-commands-selected-slots` (integer): Network bytes for sampled commands on selected slots (conditional)
- `net-bytes-all-commands-selected-slots` (integer): Network bytes for all commands on selected slots (conditional)
- `net-bytes-all-commands-all-slots` (integer): Network bytes for all commands on all slots
- `collection-start-time-unix-ms` (integer): Unix timestamp in milliseconds when tracking started
- `collection-duration-ms` (integer): Duration of tracking in milliseconds
- `used-cpu-sys-ms` (integer): System CPU time used in milliseconds
- `used-cpu-user-ms` (integer): User CPU time used in milliseconds
- `total-net-bytes` (integer): Total network bytes processed
- `by-cpu-time` (array): Array of key-time pairs sorted by CPU time (if CPU tracking enabled)
- `by-net-bytes` (array): Array of key-bytes pairs sorted by network bytes (if NET tracking enabled)

**[Null reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}})** when no tracking has been started or data has been reset.

{{< /multitabs >}}
