---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
arguments:
- arguments:
  - display_text: count
    name: count
    type: integer
  - display_text: cpu
    name: cpu
    optional: true
    token: CPU
    type: pure-token
  - display_text: net
    name: net
    optional: true
    token: NET
    type: pure-token
  name: metrics
  token: METRICS
  type: block
- display_text: k
  name: k
  optional: true
  token: COUNT
  type: integer
- display_text: seconds
  name: seconds
  optional: true
  token: DURATION
  type: integer
- display_text: ratio
  name: ratio
  optional: true
  token: SAMPLE
  type: integer
- arguments:
  - display_text: count
    name: count
    type: integer
  - display_text: slot
    multiple: true
    name: slot
    type: integer
  name: slots
  optional: true
  token: SLOTS
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
- admin
- noscript
complexity: O(1)
container: HOTKEYS
description: Starts hotkeys tracking.
function: hotkeysCommand
group: server
hidden: false
linkTitle: HOTKEYS START
railroad_diagram: /images/railroad/hotkeys-start.svg
reply_schema:
  const: OK
since: 8.6.0
summary: Starts hotkeys tracking.
syntax_fmt: HOTKEYS START METRICS count [CPU] [NET] [COUNT k] [DURATION seconds] [SAMPLE ratio] [SLOTS count slot [slot ...]]
title: HOTKEYS START
---
Starts hotkeys tracking with specified metrics.

This command initiates a hotkey tracking session. You must specify which metrics to track using the required `METRICS` parameter.
An error is returned if a tracking session is already in progress.

The tracking session continues until manually stopped with [`HOTKEYS STOP`]({{< relref "/commands/hotkeys-stop" >}}) or automatically stopped after the specified duration.

## Arguments

<details open><summary><code>METRICS count [CPU] [NET]</code></summary>

**Required.** Specifies which metrics to track and how many hotkeys to track.

- `count` - The number of metrics to collect (required).
- `CPU` - Track hotkeys by CPU time percentage (optional).
- `NET` - Track hotkeys by network bytes percentage (optional).

At least one of `CPU` or `NET` must be specified.

</details>

## Optional arguments

<details open><summary><code>COUNT</code></summary>

Specifies the value of K for the top-K hotkeys tracking.

</details>

<details open><summary><code>DURATION</code></summary>

The duration in seconds for how long the hotkeys tracking should run. After this time period, tracking will automatically stop. If not specified, tracking continues until manually stopped with `HOTKEYS STOP`.

</details>

<details open><summary><code>SAMPLE</code></summary>

Sampling ratio for probabilistic tracking. Each key is sampled with probability `1/ratio`. Higher values reduce performance impact but may miss some hotkeys. Lower values provide more accurate results but with higher performance cost.

</details>

<details open><summary><code>SLOTS</code></summary>

Specifies which hash slots to track in a cluster environment; ignored if not in a cluster. Takes a count followed by that many slot numbers. Only keys that hash to the specified slots will be tracked. Useful for tracking hotkeys on specific shards in a Redis cluster.

</details>

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

One of the following:

- [Simple string]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) reply: `OK` when tracking is successfully started.
- [Error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}): when invalid parameters are provided.

-tab-sep-

One of the following:

- [Simple string]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) reply: `OK` when tracking is successfully started.
- [Error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}): when invalid parameters are provided.

{{< /multitabs >}}
