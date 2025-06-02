---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
arguments:
- display_text: event
  multiple: true
  name: event
  optional: true
  type: string
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
- loading
- stale
complexity: O(1)
description: Resets the latency data for one or more events.
group: server
hidden: false
hints:
- request_policy:all_nodes
- response_policy:agg_sum
linkTitle: LATENCY RESET
since: 2.8.13
summary: Resets the latency data for one or more events.
syntax_fmt: LATENCY RESET [event [event ...]]
syntax_str: ''
title: LATENCY RESET
---
The `LATENCY RESET` command resets the latency spikes time series of all, or only some, events.

When the command is called without arguments, it resets all the
events, discarding the currently logged latency spike events, and resetting
the maximum event time register.

It is possible to reset only specific events by providing the `event` names
as arguments.

Valid values for `event` are:
* `active-defrag-cycle`
* `aof-fsync-always`
* `aof-stat`
* `aof-rewrite-diff-write`
* `aof-rename`
* `aof-write`
* `aof-write-active-child`
* `aof-write-alone`
* `aof-write-pending-fsync`
* `command`
* `expire-cycle`
* `eviction-cycle`
* `eviction-del`
* `fast-command`
* `fork`
* `rdb-unlink-temp-file`

For more information refer to the [Latency Monitoring Framework page][lm].

[lm]: /operate/oss_and_stack/management/optimization/latency-monitor.md
