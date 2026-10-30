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
command_flags:
- stale
compatibility:
  software:
    standard: unsupported
    active_active: unsupported
  cloud:
    standard: unsupported
    active_active: unsupported
complexity: O(1)
description: Returns the ID of a node.
group: cluster
hidden: false
linkTitle: CLUSTER MYID
railroad_diagram: /images/railroad/cluster-myid.svg
since: 3.0.0
summary: Returns the ID of a node.
syntax_fmt: CLUSTER MYID
title: CLUSTER MYID
---
Returns the node's id.

The `CLUSTER MYID` command returns the unique, auto-generated identifier that is associated with the connected cluster node.

## Redis Software and Redis Cloud compatibility

{{< command-compatibility >}}

## Return information

{{< multitabs id="cluster-myid-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): the node ID.

-tab-sep-

[Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): the node ID.

{{< /multitabs >}}
