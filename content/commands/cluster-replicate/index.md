---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
arguments:
- display_text: node-id
  name: node-id
  type: string
arity: 3
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
description: Configure a node as replica of a master node.
group: cluster
hidden: false
linkTitle: CLUSTER REPLICATE
since: 3.0.0
summary: Configure a node as replica of a master node.
syntax_fmt: CLUSTER REPLICATE node-id
syntax_str: ''
title: CLUSTER REPLICATE
---
The command reconfigures a node as a replica of the specified master.
If the node receiving the command is an *empty master*, as a side effect
of the command, the node role is changed from master to replica.

Once a node is turned into the replica of another master node, there is no need
to inform the other cluster nodes about the change: heartbeat packets exchanged
between nodes will propagate the new configuration automatically.

A replica will always accept the command, assuming that:

1. The specified node ID exists in its nodes table.
2. The specified node ID does not identify the instance we are sending the command to.
3. The specified node ID is a master.

If the node receiving the command is not already a replica, but is a master,
the command will only succeed, and the node will be converted into a replica,
only if the following additional conditions are met:

1. The node is not serving any hash slots.
2. The node is empty, no keys are stored at all in the key space.

If the command succeeds the new replica will immediately try to contact its master in order to replicate from it.
