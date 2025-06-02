---
acl_categories:
- '@pubsub'
- '@slow'
arguments:
- display_text: channel
  multiple: true
  name: channel
  optional: true
  type: string
arity: -1
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
- noscript
- loading
- stale
complexity: O(N) where N is the number of channels to unsubscribe.
description: Stops listening to messages posted to channels.
group: pubsub
hidden: false
linkTitle: UNSUBSCRIBE
since: 2.0.0
summary: Stops listening to messages posted to channels.
syntax_fmt: UNSUBSCRIBE [channel [channel ...]]
syntax_str: ''
title: UNSUBSCRIBE
---
Unsubscribes the client from the given channels, or from all of them if none is
given.

When no channels are specified, the client is unsubscribed from all the
previously subscribed channels.
In this case, a message for every unsubscribed channel will be sent to the
client.
