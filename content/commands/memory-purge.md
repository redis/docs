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
description: Asks the allocator to release memory.
group: server
hidden: false
hints:
- request_policy:all_shards
- response_policy:all_succeeded
linkTitle: MEMORY PURGE
since: 4.0.0
summary: Asks the allocator to release memory.
syntax_fmt: MEMORY PURGE
syntax_str: ''
title: MEMORY PURGE
---
The `MEMORY PURGE` command attempts to purge dirty pages so these can be
reclaimed by the allocator.

This command is currently implemented only when using **jemalloc** as an
allocator, and evaluates to a benign NOOP for all others.

## Return information

{{< multitabs id="memory-purge-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}
