---
arguments:
- name: k
  optional: true
  token: COUNT
  type: integer
- name: seconds
  optional: true
  token: DURATION
  type: integer
- name: ratio
  optional: true
  token: SAMPLE
  type: integer
- arguments:
  - name: count
    type: integer
  - multiple: true
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
- ADMIN
- NOSCRIPT
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
syntax_fmt: "HOTKEYS START [COUNT\_k] [DURATION\_seconds] [SAMPLE\_ratio]\n  [SLOTS\_\
  count slot [slot ...]]"
title: HOTKEYS START
---
Starts hotkeys tracking.

## Optional arguments

<details open><summary><code>COUNT</code></summary>

The maximum number of hotkeys to track and return. Specifies the value of K for the top-K hotkeys tracking. Must be between 10 and 64. Default behavior tracks a reasonable number of hotkeys.

</details>

<details open><summary><code>DURATION</code></summary>

The duration in seconds for how long the hotkeys tracking should run. After this time period, tracking will automatically stop. If not specified, tracking continues until manually stopped with `HOTKEYS STOP`.

</details>

<details open><summary><code>SAMPLE</code></summary>

Sampling ratio for probabilistic tracking. Each key is sampled with probability `1/ratio`. Higher values reduce performance impact but may miss some hotkeys. Lower values provide more accurate results but with higher performance cost.

</details>

<details open><summary><code>SLOTS</code></summary>

Specifies which hash slots to track in a cluster environment. Takes a count followed by that many slot numbers. Only keys that hash to the specified slots will be tracked. Useful for tracking hotkeys on specific shards in a Redis cluster.

</details>

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

One of the following:

- [Simple string]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) reply: `OK` when tracking is successfully started.
- [Error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}): when invalid parameters are provided.

Example:
```
+OK
```

-tab-sep-

One of the following:

- [Simple string]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) reply: `OK` when tracking is successfully started.
- [Error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}): when invalid parameters are provided.

Example:
```
+OK
```

{{< /multitabs >}}
