---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
arguments:
- display_text: event
  name: event
  type: string
arity: 3
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
description: Returns timestamp-latency samples for an event.
group: server
hidden: false
hints:
- nondeterministic_output
- request_policy:all_nodes
- response_policy:special
linkTitle: LATENCY HISTORY
since: 2.8.13
summary: Returns timestamp-latency samples for an event.
syntax_fmt: LATENCY HISTORY event
syntax_str: ''
title: LATENCY HISTORY
---
The `LATENCY HISTORY` command returns the raw data of the `event`'s latency spikes time series.

This is useful to an application that wants to fetch raw data in order to perform monitoring, display graphs, and so forth.

The command will return up to 160 timestamp-latency pairs for the `event`.

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

## Examples

```
127.0.0.1:6379> latency history command
1) 1) (integer) 1405067822
   2) (integer) 251
2) 1) (integer) 1405067941
   2) (integer) 1001
```

For more information refer to the [Latency Monitoring Framework page][lm].

[lm]: /operate/oss_and_stack/management/optimization/latency-monitor.md
