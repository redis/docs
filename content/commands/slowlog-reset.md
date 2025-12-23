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
- loading
- stale
complexity: O(N) where N is the number of entries in the slowlog
description: Clears all entries from the slow log.
group: server
hidden: false
hints:
- request_policy:all_nodes
- response_policy:all_succeeded
linkTitle: SLOWLOG RESET
railroad_diagram: /images/railroad/slowlog-reset.svg
since: 2.2.12
summary: Clears all entries from the slow log.
syntax_fmt: SLOWLOG RESET
title: SLOWLOG RESET
---
This command resets the slow log, clearing all entries in it.

Once deleted the information is lost forever.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | Not supported for [scripts]({{<relref "/develop/programmability">}}). |

## Return information

{{< multitabs id="slowlog-reset-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}
