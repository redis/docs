---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
arguments:
- arguments:
  - display_text: hard
    name: hard
    token: HARD
    type: pure-token
  - display_text: soft
    name: soft
    token: SOFT
    type: pure-token
  name: reset-type
  optional: true
  type: oneof
arity: -2
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
- stale
complexity: O(N) where N is the number of known nodes. The command may execute a FLUSHALL
  as a side effect.
description: Resets a node.
group: cluster
hidden: false
linkTitle: CLUSTER RESET
since: 3.0.0
summary: Resets a node.
syntax_fmt: CLUSTER RESET [HARD | SOFT]
syntax_str: ''
title: CLUSTER RESET
---
Reset a Redis Cluster node, in a more or less drastic way depending on the
reset type, that can be **hard** or **soft**. Note that this command
**does not work for masters if they hold one or more keys**, in that case
to completely reset a master node keys must be removed first, e.g. by using [`FLUSHALL`]({{< relref "/commands/flushall" >}}) first,
and then `CLUSTER RESET`.

Effects on the node:

1. All the other nodes in the cluster are forgotten.
2. All the assigned / open slots are reset, so the slots-to-nodes mapping is totally cleared.
3. If the node is a replica it is turned into an (empty) master. Its dataset is flushed, so at the end the node will be an empty master.
4. **Hard reset only**: a new Node ID is generated.
5. **Hard reset only**: `currentEpoch` and `configEpoch` vars are set to 0.
6. The new configuration is persisted on disk in the node cluster configuration file.

This command is mainly useful to re-provision a Redis Cluster node
in order to be used in the context of a new, different cluster. The command
is also extensively used by the Redis Cluster testing framework in order to
reset the state of the cluster every time a new test unit is executed.

If no reset type is specified, the default is **soft**.
