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
railroad_diagram: /images/railroad/memory-doctor.svg
since: 4.0.0
summary: Outputs a memory problems report.
syntax_fmt: MEMORY DOCTOR
title: MEMORY DOCTOR
---
The `MEMORY DOCTOR` command reports about different memory-related issues that
the Redis server experiences, and advises about possible remedies.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="memory-doctor-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): a memory problems report.

-tab-sep-

[Verbatim string reply](../../develop/reference/protocol-spec#verbatim-strings): a memory problems report.

{{< /multitabs >}}
