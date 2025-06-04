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
- stale
- no_async_loading
complexity: O(1)
description: Deletes all slots information from a node.
group: cluster
hidden: false
linkTitle: CLUSTER FLUSHSLOTS
since: 3.0.0
summary: Deletes all slots information from a node.
syntax_fmt: CLUSTER FLUSHSLOTS
syntax_str: ''
title: CLUSTER FLUSHSLOTS
---
Deletes all slots from a node.

The `CLUSTER FLUSHSLOTS` deletes all information about slots from the connected node. It can only be called when the database is empty.

## Return information

{{< multitabs id="cluster-flushslots-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}
