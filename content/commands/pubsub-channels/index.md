---
acl_categories:
- '@pubsub'
- '@slow'
arguments:
- display_text: pattern
  name: pattern
  optional: true
  type: pattern
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
- pubsub
- loading
- stale
complexity: O(N) where N is the number of active channels, and assuming constant time
  pattern matching (relatively short channels and patterns)
description: Returns the active channels.
group: pubsub
hidden: false
linkTitle: PUBSUB CHANNELS
since: 2.8.0
summary: Returns the active channels.
syntax_fmt: PUBSUB CHANNELS [pattern]
syntax_str: ''
title: PUBSUB CHANNELS
---
Lists the currently *active channels*.

An active channel is a Pub/Sub channel with one or more subscribers (excluding clients subscribed to patterns).

If no `pattern` is specified, all the channels are listed, otherwise if pattern is specified only channels matching the specified glob-style pattern are listed.

Cluster note: in a Redis Cluster clients can subscribe to every node, and can also publish to every other node. The cluster will make sure that published messages are forwarded as needed. That said, [`PUBSUB`]({{< relref "/commands/pubsub" >}})'s replies in a cluster only report information from the node's Pub/Sub context, rather than the entire cluster.
