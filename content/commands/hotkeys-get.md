---
arguments:
- name: mincpu
  optional: true
  token: MINCPU
  type: integer
- name: minnet
  optional: true
  token: MINNET
  type: integer
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
- ADMIN
- NOSCRIPT
complexity: O(K) where K is the number of hotkeys to return.
container: HOTKEYS
description: Returns two lists of top K hotkeys - one by cpu time and one by network
  bytes.
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
summary: Returns two lists of top K hotkeys - one by cpu time and one by network bytes.
syntax_fmt: "HOTKEYS GET [MINCPU\_mincpu] [MINNET\_minnet]"
title: HOTKEYS GET
---
Returns two lists of top K hotkeys - one by cpu time and one by network bytes.

## Optional arguments

<details open><summary><code>MINCPU</code></summary>

Minimum CPU time percentage threshold. Only hotkeys with CPU time percentage greater than or equal to this value will be included in the `by-cpu-time` results.

</details>

<details open><summary><code>MINNET</code></summary>

Minimum network bytes percentage threshold. Only hotkeys with network bytes percentage greater than or equal to this value will be included in the `by-net-bytes` results.

</details>

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

One of the following:
- [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) with the following items when tracking data is available:
    - `collection-start-time`: Unix timestamp (integer) when tracking started.
    - `collection-duration`: duration in seconds (integer) of the tracking period.
    - `by-cpu-time`: array of key-percentage pairs (bulk strings) sorted by CPU time usage.
    - `by-net-bytes`: array of key-percentage pairs (bulk strings) sorted by network bytes usage.

- [Null bulk string reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) when no tracking has been started or no data is available.

Example with tracking data:
```
*8
$21
collection-start-time
:1768232225
$19
collection-duration
:0
$11
by-cpu-time
*2
$6
keys_1
$6
100.00
$12
by-net-bytes
*2
$6
keys_1
$6
100.00
```

-tab-sep-

One of the following:
- [Map reply]({{< relref "/develop/reference/protocol-spec#maps" >}}) with the following items when tracking data is available:

    - `collection-start-time`: Unix timestamp (integer) when tracking started.
    - `collection-duration`: Duration in seconds (integer) of the tracking period.
    - `by-cpu-time`: Array of key-percentage (bulk string) pairs sorted by CPU time usage
    - `by-net-bytes`: Array of key-percentage (bulk string) pairs sorted by network bytes usage
- [Null reply]({{< relref "/develop/reference/protocol-spec#nulls" >}}) when no tracking has been started or no data is available.

Example with tracking data:
```
%4
$21
collection-start-time
:1768232225
$19
collection-duration
:0
$11
by-cpu-time
*2
$6
keys_1
$6
100.00
$12
by-net-bytes
*2
$6
keys_1
$6
100.00
```

{{< /multitabs >}}

