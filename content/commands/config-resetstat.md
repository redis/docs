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
compatibility:
  software:
    standard: unsupported
    active_active: unsupported
  cloud:
    standard: unsupported
    active_active: unsupported
complexity: O(1)
description: Resets the server's statistics.
group: server
hidden: false
hints:
- request_policy:all_nodes
- response_policy:all_succeeded
linkTitle: CONFIG RESETSTAT
railroad_diagram: /images/railroad/config-resetstat.svg
since: 2.0.0
summary: Resets the server's statistics.
syntax_fmt: CONFIG RESETSTAT
title: CONFIG RESETSTAT
---
Resets the statistics reported by Redis using the [`INFO`](/content/commands/info.md) and [`LATENCY HISTOGRAM`](/content/commands/latency-histogram.md) commands.

The following is a non-exhaustive list of values that are reset:

* Keyspace hits and misses
* Number of expired keys
* Command and error statistics
* Connections received, rejected and evicted
* Persistence statistics
* Active defragmentation statistics

## Redis Software and Redis Cloud compatibility

{{< command-compatibility >}}

## Return information

{{< multitabs id="config-resetstat-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}
