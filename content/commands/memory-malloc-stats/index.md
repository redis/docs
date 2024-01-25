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
since: 4.0.0
summary: Returns the allocator statistics.
syntax_fmt: MEMORY MALLOC-STATS
syntax_str: ''
title: MEMORY MALLOC-STATS
---
The `MEMORY MALLOC-STATS` command provides an internal statistics report from
the memory allocator.

This command is currently implemented only when using **jemalloc** as an
allocator, and evaluates to a benign NOOP for all others.
