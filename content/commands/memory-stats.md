---
acl_categories:
- '@slow'
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
complexity: O(1)
description: Returns details about memory usage.
group: server
hidden: false
hints:
- nondeterministic_output
- request_policy:all_shards
- response_policy:special
linkTitle: MEMORY STATS
railroad_diagram: /images/railroad/memory-stats.svg
since: 4.0.0
summary: Returns details about memory usage.
syntax_fmt: MEMORY STATS
title: MEMORY STATS
---
The `MEMORY STATS` command returns an [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) about the memory usage of the
server.

The information about memory usage is provided as metrics and their respective
values. The following metrics are reported:

*   `peak.allocated`: Peak memory consumed by Redis in bytes (see [`INFO`]({{< relref "/commands/info" >}})'s
     `used_memory_peak`)
*   `total.allocated`: Total number of bytes allocated by Redis using its
     allocator (see [`INFO`]({{< relref "/commands/info" >}})'s `used_memory`)
*   `startup.allocated`: Initial amount of memory consumed by Redis at startup
     in bytes (see [`INFO`]({{< relref "/commands/info" >}})'s `used_memory_startup`)
*   `replication.backlog`: Size in bytes of the replication backlog (see
     [`INFO`]({{< relref "/commands/info" >}})'s `repl_backlog_active`)
*   `clients.slaves`: The total size in bytes of all replicas overheads (output
     and query buffers, connection contexts)
*   `clients.normal`: The total size in bytes of all clients overheads (output
     and query buffers, connection contexts)
*   `cluster.links`: Memory usage by cluster links (Added in Redis 7.0, see [`INFO`]({{< relref "/commands/info" >}})'s `mem_cluster_links`).
*   `aof.buffer`: The summed size in bytes of AOF related buffers.
*   `lua.caches`: the summed size in bytes of the overheads of the Lua scripts'
     caches
*   `functions.caches`: the summed size in bytes of the overheads of the Function scripts'
     caches
*   `dbXXX`: For each of the server's databases, the overheads of the main and
     expiry dictionaries (`overhead.hashtable.main` and
    `overhead.hashtable.expires`, respectively) are reported in bytes
*   `overhead.db.hashtable.lut`: Total overhead of dictionary buckets in databases (Added in Redis 7.4)
*   `overhead.db.hashtable.rehashing`: Temporary memory overhead of database dictionaries currently being rehashed (Added in Redis 7.4) 
*   `overhead.total`: The sum of all overheads, i.e. `startup.allocated`,
     `replication.backlog`, `clients.slaves`, `clients.normal`, `aof.buffer` and
     those of the internal data structures that are used in managing the
     Redis keyspace (see [`INFO`]({{< relref "/commands/info" >}})'s `used_memory_overhead`)
*   `db.dict.rehashing.count`: Number of DB dictionaries currently being rehashed (Added in Redis 7.4)
*   `keys.count`: The total number of keys stored across all databases in the
     server
*   `keys.bytes-per-key`: The ratio between `dataset.bytes` and `keys.count` 
*   `dataset.bytes`: The size in bytes of the dataset, i.e. `overhead.total`
     subtracted from `total.allocated` (see [`INFO`]({{< relref "/commands/info" >}})'s `used_memory_dataset`)
*   `dataset.percentage`: The percentage of `dataset.bytes` out of the total
     memory usage
*   `peak.percentage`: The percentage of `total.allocated` out of
     `peak.allocated`
*   `allocator.allocated`: See [`INFO`]({{< relref "/commands/info" >}})'s `allocator_allocated`
*   `allocator.active`: See [`INFO`]({{< relref "/commands/info" >}})'s `allocator_active`
*   `allocator.resident`: See [`INFO`]({{< relref "/commands/info" >}})'s `allocator_resident`
*   `allocator.muzzy`: See [`INFO`]({{< relref "/commands/info" >}})'s `allocator_muzzy`
*   `allocator-fragmentation.ratio`: See [`INFO`]({{< relref "/commands/info" >}})'s `allocator_frag_ratio`
*   `allocator-fragmentation.bytes`: See [`INFO`]({{< relref "/commands/info" >}})'s `allocator_frag_bytes`
*   `allocator-rss.ratio`: See [`INFO`]({{< relref "/commands/info" >}})'s `allocator_rss_ratio`
*   `allocator-rss.bytes`: See [`INFO`]({{< relref "/commands/info" >}})'s `allocator_rss_bytes`
*   `rss-overhead.ratio`: See [`INFO`]({{< relref "/commands/info" >}})'s `rss_overhead_ratio`
*   `rss-overhead.bytes`: See [`INFO`]({{< relref "/commands/info" >}})'s `rss_overhead_bytes`
*   `fragmentation`: See [`INFO`]({{< relref "/commands/info" >}})'s `mem_fragmentation_ratio`
*   `fragmentation.bytes`: See [`INFO`]({{< relref "/commands/info" >}})'s `mem_fragmentation_bytes`

**A note about the word slave used in this man page**: Starting with Redis 5, if not for backward compatibility, the Redis project no longer uses the word slave. Unfortunately in this command the word slave is part of the protocol, so we'll be able to remove such occurrences only when this API will be naturally deprecated.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="memory-stats-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): a nested list of memory usage metrics and their values.

-tab-sep-

[Map reply](../../develop/reference/protocol-spec#maps): memory usage metrics and their values.

{{< /multitabs >}}
