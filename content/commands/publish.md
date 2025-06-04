---
acl_categories:
- '@pubsub'
- '@fast'
arguments:
- display_text: channel
  name: channel
  type: string
- display_text: message
  name: message
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
- pubsub
- loading
- stale
- fast
complexity: O(N+M) where N is the number of clients subscribed to the receiving channel
  and M is the total number of subscribed patterns (by any client).
description: Posts a message to a channel.
group: pubsub
hidden: false
linkTitle: PUBLISH
since: 2.0.0
summary: Posts a message to a channel.
syntax_fmt: PUBLISH channel message
syntax_str: message
title: PUBLISH
---
Posts a message to the given channel.

In a Redis Cluster clients can publish to every node. The cluster makes sure
that published messages are forwarded as needed, so clients can subscribe to any
channel by connecting to any one of the nodes.
