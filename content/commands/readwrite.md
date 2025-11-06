---
acl_categories:
- '@fast'
- '@connection'
arity: 1
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
- loading
- stale
- fast
complexity: O(1)
description: Enables read-write queries for a connection to a Redis Cluster replica
  node.
group: cluster
hidden: false
linkTitle: READWRITE
railroad_diagram: /images/railroad/readwrite.svg
since: 3.0.0
summary: Enables read-write queries for a connection to a Reids Cluster replica node.
syntax_fmt: READWRITE
syntax_str: ''
title: READWRITE
---
Disables read queries for a connection to a Redis Cluster replica node.

Read queries against a Redis Cluster replica node are disabled by default,
but you can use the [`READONLY`]({{< relref "/commands/readonly" >}}) command to change this behavior on a per-
connection basis. The `READWRITE` command resets the readonly mode flag
of a connection back to readwrite.

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="readwrite-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}
