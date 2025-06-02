---
acl_categories:
- '@pubsub'
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
- pubsub
- loading
- stale
complexity: O(1)
description: Returns a count of unique pattern subscriptions.
group: pubsub
hidden: false
linkTitle: PUBSUB NUMPAT
since: 2.8.0
summary: Returns a count of unique pattern subscriptions.
syntax_fmt: PUBSUB NUMPAT
syntax_str: ''
title: PUBSUB NUMPAT
---
Returns the number of unique patterns that are subscribed to by clients (that are performed using the [`PSUBSCRIBE`]({{< relref "/commands/psubscribe" >}}) command).

Note that this isn't the count of clients subscribed to patterns, but the total number of unique patterns all the clients are subscribed to.

Cluster note: in a Redis Cluster clients can subscribe to every node, and can also publish to every other node. The cluster will make sure that published messages are forwarded as needed. That said, [`PUBSUB`]({{< relref "/commands/pubsub" >}})'s replies in a cluster only report information from the node's Pub/Sub context, rather than the entire cluster.
