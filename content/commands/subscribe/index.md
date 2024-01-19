---
acl_categories:
- '@pubsub'
- '@slow'
arguments:
- display_text: channel
  multiple: true
  name: channel
  type: string
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
- noscript
- loading
- stale
complexity: O(N) where N is the number of channels to subscribe to.
description: Listens for messages published to channels.
group: pubsub
hidden: false
linkTitle: SUBSCRIBE
since: 2.0.0
summary: Listens for messages published to channels.
syntax_fmt: SUBSCRIBE channel [channel ...]
syntax_str: ''
title: SUBSCRIBE
---
Subscribes the client to the specified channels.

Once the client enters the subscribed state it is not supposed to issue any
other commands, except for additional `SUBSCRIBE`, [`SSUBSCRIBE`](/commands/ssubscribe), [`PSUBSCRIBE`](/commands/psubscribe), [`UNSUBSCRIBE`](/commands/unsubscribe), [`SUNSUBSCRIBE`](/commands/sunsubscribe), 
[`PUNSUBSCRIBE`](/commands/punsubscribe), [`PING`](/commands/ping), [`RESET`](/commands/reset) and [`QUIT`](/commands/quit) commands.
However, if RESP3 is used (see [`HELLO`](/commands/hello)) it is possible for a client to issue any commands while in subscribed state.

For more information, see [Pub/sub](/docs/interact/pubsub/).

## Behavior change history

*   `>= 6.2.0`: [`RESET`](/commands/reset) can be called to exit subscribed state.
