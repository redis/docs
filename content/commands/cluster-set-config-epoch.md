---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
arguments:
- display_text: config-epoch
  name: config-epoch
  type: integer
arity: 3
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- kubernetes
- clients
command_flags:
- admin
- stale
- no_async_loading
complexity: O(1)
description: Sets the configuration epoch for a new node.
group: cluster
hidden: false
linkTitle: CLUSTER SET-CONFIG-EPOCH
since: 3.0.0
summary: Sets the configuration epoch for a new node.
syntax_fmt: CLUSTER SET-CONFIG-EPOCH config-epoch
syntax_str: ''
title: CLUSTER SET-CONFIG-EPOCH
---
This command sets a specific *config epoch* in a fresh node. It only works when:

1. The nodes table of the node is empty.
2. The node current *config epoch* is zero.

These prerequisites are needed since usually, manually altering the
configuration epoch of a node is unsafe, we want to be sure that the node with
the higher configuration epoch value (that is the last that failed over) wins
over other nodes in claiming the hash slots ownership.

However there is an exception to this rule, and it is when a new
cluster is created from scratch. Redis Cluster *config epoch collision
resolution* algorithm can deal with new nodes all configured with the
same configuration at startup, but this process is slow and should be
the exception, only to make sure that whatever happens, two more
nodes eventually always move away from the state of having the same
configuration epoch.

So, using `CLUSTER SET-CONFIG-EPOCH`, when a new cluster is created, we can
assign a different progressive configuration epoch to each node before
joining the cluster together.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
