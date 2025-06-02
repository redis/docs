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
deprecated_since: 5.0.0
description: Lists the replica nodes of a master node.
doc_flags:
- deprecated
group: cluster
hidden: false
hints:
- nondeterministic_output
linkTitle: CLUSTER SLAVES
replaced_by: '[`CLUSTER REPLICAS`]({{< relref "/commands/cluster-replicas" >}})'
since: 3.0.0
summary: Lists the replica nodes of a master node.
syntax_fmt: CLUSTER SLAVES node-id
syntax_str: ''
title: CLUSTER SLAVES
---
**A note about the word slave used in this man page and command name**: starting with Redis version 5, if not for backward compatibility, the Redis project no longer uses the word slave. Please use the new command [`CLUSTER REPLICAS`]({{< relref "/commands/cluster-replicas" >}}). The command `CLUSTER SLAVES` will continue to work for backward compatibility.

The command provides a list of replica nodes replicating from the specified
master node. The list is provided in the same format used by [`CLUSTER NODES`]({{< relref "/commands/cluster-nodes" >}}) (please refer to its documentation for the specification of the format).

The command will fail if the specified node is not known or if it is not
a master according to the node table of the node receiving the command.

Note that if a replica is added, moved, or removed from a given master node,
and we ask `CLUSTER SLAVES` to a node that has not yet received the
configuration update, it may show stale information. However eventually
(in a matter of seconds if there are no network partitions) all the nodes
will agree about the set of nodes associated with a given master.
