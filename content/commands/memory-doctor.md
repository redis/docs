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
description: Outputs a memory problems report.
group: server
hidden: false
hints:
- nondeterministic_output
- request_policy:all_shards
- response_policy:special
linkTitle: MEMORY DOCTOR
since: 4.0.0
summary: Outputs a memory problems report.
syntax_fmt: MEMORY DOCTOR
syntax_str: ''
title: MEMORY DOCTOR
---
The `MEMORY DOCTOR` command reports about different memory-related issues that
the Redis server experiences, and advises about possible remedies.
