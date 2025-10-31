---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
- '@connection'
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
complexity: O(N) Where N is the number of paused clients
description: Resumes processing commands from paused clients.
group: connection
hidden: false
linkTitle: CLIENT UNPAUSE
since: 6.2.0
summary: Resumes processing commands from paused clients.
syntax_fmt: CLIENT UNPAUSE
syntax_str: ''
title: CLIENT UNPAUSE
---
`CLIENT UNPAUSE` is used to resume command processing for all clients that were paused by [`CLIENT PAUSE`]({{< relref "/commands/client-pause" >}}).

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="client-unpause-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}
