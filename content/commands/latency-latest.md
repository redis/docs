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
- loading
- stale
complexity: O(1)
description: Returns the latest latency samples for all events.
group: server
hidden: false
hints:
- nondeterministic_output
- request_policy:all_nodes
- response_policy:special
linkTitle: LATENCY LATEST
since: 2.8.13
summary: Returns the latest latency samples for all events.
syntax_fmt: LATENCY LATEST
syntax_str: ''
title: LATENCY LATEST
---
The `LATENCY LATEST` command reports the latest latency events logged.

Each reported event has the following fields:

* Event name.
* Unix timestamp of the latest latency spike for the event.
* Latest event latency in millisecond.
* All-time maximum latency for this event.

"All-time" means the maximum latency since the Redis instance was
started, or the time that events were reset [`LATENCY RESET`]({{< relref "/commands/latency-reset" >}}).

## Examples

```
127.0.0.1:6379> debug sleep 1
OK
(1.00s)
127.0.0.1:6379> debug sleep .25
OK
127.0.0.1:6379> latency latest
1) 1) "command"
   2) (integer) 1405067976
   3) (integer) 251
   4) (integer) 1001
```

For more information refer to the [Latency Monitoring Framework page][lm].

[lm]: /operate/oss_and_stack/management/optimization/latency-monitor.md

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="latency-latest-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): an array where each element is a four elements array representing the event's name, timestamp, latest and all-time latency measurements.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): an array where each element is a four elements array representing the event's name, timestamp, latest and all-time latency measurements.

{{< /multitabs >}}
