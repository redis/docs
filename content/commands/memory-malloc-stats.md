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
complexity: Depends on how much memory is allocated, could be slow
description: Returns the allocator statistics.
group: server
hidden: false
hints:
- nondeterministic_output
- request_policy:all_shards
- response_policy:special
linkTitle: MEMORY MALLOC-STATS
railroad_diagram: /images/railroad/memory-malloc-stats.svg
since: 4.0.0
summary: Returns the allocator statistics.
syntax_fmt: MEMORY MALLOC-STATS
title: MEMORY MALLOC-STATS
---
The `MEMORY MALLOC-STATS` command provides an internal statistics report from
the memory allocator.

This command is currently implemented only when using **jemalloc** as an
allocator, and evaluates to a benign NOOP for all others.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="memory-malloc-stats-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): a long string of statistics.

-tab-sep-

[Verbatim string reply](../../develop/reference/protocol-spec#verbatim-strings): a long string of statistics.

{{< /multitabs >}}
