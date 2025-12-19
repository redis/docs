---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
arity: -1
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
- allow_busy
complexity: O(1)
description: An internal command for configuring the replication stream.
doc_flags:
- syscmd
group: server
hidden: false
linkTitle: REPLCONF
railroad_diagram: /images/railroad/replconf.svg
since: 3.0.0
summary: An internal command for configuring the replication stream.
syntax_fmt: REPLCONF
title: REPLCONF
---
The `REPLCONF` command is an internal command.
It is used by a Redis master to configure a connected replica.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="replconf-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}
