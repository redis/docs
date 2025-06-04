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
