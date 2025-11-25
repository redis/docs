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
description: Returns a latency graph for an event.
group: server
hidden: false
hints:
- nondeterministic_output
- request_policy:all_nodes
- response_policy:special
linkTitle: LATENCY GRAPH
railroad_diagram: /images/railroad/latency-graph.svg
since: 2.8.13
summary: Returns a latency graph for an event.
syntax_fmt: LATENCY GRAPH event
syntax_str: ''
title: LATENCY GRAPH
---
Produces an ASCII-art style graph for the specified event.

`LATENCY GRAPH` lets you intuitively understand the latency trend of an `event` via state-of-the-art visualization. It can be used for quickly grasping the situation before resorting to means such parsing the raw data from [`LATENCY HISTORY`]({{< relref "/commands/latency-history" >}}) or external tooling.

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
127.0.0.1:6379> latency reset command
(integer) 0
127.0.0.1:6379> debug sleep .1
OK
127.0.0.1:6379> debug sleep .2
OK
127.0.0.1:6379> debug sleep .3
OK
127.0.0.1:6379> debug sleep .5
OK
127.0.0.1:6379> debug sleep .4
OK
127.0.0.1:6379> latency graph command
command - high 500 ms, low 101 ms (all time high 500 ms)
--------------------------------------------------------------------------------
   #_
  _||
 _|||
_||||

11186
542ss
sss
```

The vertical labels under each graph column represent the amount of seconds,
minutes, hours or days ago the event happened. For example "15s" means that the
first graphed event happened 15 seconds ago.

The graph is normalized in the min-max scale so that the zero (the underscore
in the lower row) is the minimum, and a # in the higher row is the maximum.

For more information refer to the [Latency Monitoring Framework page][lm].

[lm]: /operate/oss_and_stack/management/optimization/latency-monitor.md

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="latency-graph-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): Latency graph

-tab-sep-

[Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): Latency graph

{{< /multitabs >}}
