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
complexity: O(N) where N is the number of replicas.
description: Lists the replica nodes of a master node.
group: cluster
hidden: false
hints:
- nondeterministic_output
linkTitle: CLUSTER REPLICAS
since: 5.0.0
summary: Lists the replica nodes of a master node.
syntax_fmt: CLUSTER REPLICAS node-id
syntax_str: ''
title: CLUSTER REPLICAS
---
The command provides a list of replica nodes replicating from the specified
master node. The list is provided in the same format used by [`CLUSTER NODES`]({{< relref "/commands/cluster-nodes" >}}) (please refer to its documentation for the specification of the format).

The command will fail if the specified node is not known or if it is not
a master according to the node table of the node receiving the command.

Note that if a replica is added, moved, or removed from a given master node,
and we ask `CLUSTER REPLICAS` to a node that has not yet received the
configuration update, it may show stale information. However eventually
(in a matter of seconds if there are no network partitions) all the nodes
will agree about the set of nodes associated with a given master.
