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
complexity: O(1)
description: Returns the shard ID of a node.
group: cluster
hidden: false
hints:
- nondeterministic_output
linkTitle: CLUSTER MYSHARDID
since: 7.2.0
summary: Returns the shard ID of a node.
syntax_fmt: CLUSTER MYSHARDID
syntax_str: ''
title: CLUSTER MYSHARDID
---
Returns the node's shard id.

The `CLUSTER MYSHARDID` command returns the unique, auto-generated identifier that is associated with the shard to which the connected cluster node belongs.
