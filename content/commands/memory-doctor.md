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

## Return information

{{< multitabs id="memory-doctor-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): a memory problems report.

-tab-sep-

[Verbatim string reply](../../develop/reference/protocol-spec#verbatim-strings): a memory problems report.

{{< /multitabs >}}
