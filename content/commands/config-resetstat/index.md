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
description: Resets the server's statistics.
group: server
hidden: false
hints:
- request_policy:all_nodes
- response_policy:all_succeeded
linkTitle: CONFIG RESETSTAT
since: 2.0.0
summary: Resets the server's statistics.
syntax_fmt: CONFIG RESETSTAT
syntax_str: ''
title: CONFIG RESETSTAT
---
Resets the statistics reported by Redis using the [`INFO`]({{< relref "/commands/info" >}}) and [`LATENCY HISTOGRAM`]({{< relref "/commands/latency-histogram" >}}) commands.

The following is a non-exhaustive list of values that are reset:

* Keyspace hits and misses
* Number of expired keys
* Command and error statistics
* Connections received, rejected and evicted
* Persistence statistics
* Active defragmentation statistics
