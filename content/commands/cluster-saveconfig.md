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
description: Forces a node to save the cluster configuration to disk.
group: cluster
hidden: false
linkTitle: CLUSTER SAVECONFIG
since: 3.0.0
summary: Forces a node to save the cluster configuration to disk.
syntax_fmt: CLUSTER SAVECONFIG
syntax_str: ''
title: CLUSTER SAVECONFIG
---
Forces a node to save the `nodes.conf` configuration on disk. Before to return
the command calls `fsync(2)` in order to make sure the configuration is
flushed on the computer disk.

This command is mainly used in the event a `nodes.conf` node state file
gets lost / deleted for some reason, and we want to generate it again from
scratch. It can also be useful in case of mundane alterations of a node cluster
configuration via the [`CLUSTER`]({{< relref "/commands/cluster" >}}) command in order to ensure the new configuration
is persisted on disk, however all the commands should normally be able to
auto schedule to persist the configuration on disk when it is important
to do so for the correctness of the system in the event of a restart.
