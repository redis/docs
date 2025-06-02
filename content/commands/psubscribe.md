---
acl_categories:
- '@pubsub'
- '@slow'
arguments:
- display_text: pattern
  multiple: true
  name: pattern
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
- noscript
- loading
- stale
complexity: O(N) where N is the number of patterns to subscribe to.
description: Listens for messages published to channels that match one or more patterns.
group: pubsub
hidden: false
linkTitle: PSUBSCRIBE
since: 2.0.0
summary: Listens for messages published to channels that match one or more patterns.
syntax_fmt: PSUBSCRIBE pattern [pattern ...]
syntax_str: ''
title: PSUBSCRIBE
---
Subscribes the client to the given patterns.

Supported glob-style patterns:

* `h?llo` subscribes to `hello`, `hallo` and `hxllo`
* `h*llo` subscribes to `hllo` and `heeeello`
* `h[ae]llo` subscribes to `hello` and `hallo,` but not `hillo`

Use `\` to escape special characters if you want to match them verbatim.

Once the client enters the subscribed state it is not supposed to issue any other commands, except for additional [`SUBSCRIBE`]({{< relref "/commands/subscribe" >}}), [`SSUBSCRIBE`]({{< relref "/commands/ssubscribe" >}}), `PSUBSCRIBE`, [`UNSUBSCRIBE`]({{< relref "/commands/unsubscribe" >}}), [`SUNSUBSCRIBE`]({{< relref "/commands/sunsubscribe" >}}), [`PUNSUBSCRIBE`]({{< relref "/commands/punsubscribe" >}}), [`PING`]({{< relref "/commands/ping" >}}), [`RESET`]({{< relref "/commands/reset" >}}) and [`QUIT`]({{< relref "/commands/quit" >}}) commands.
However, if RESP3 is used (see [`HELLO`]({{< relref "/commands/hello" >}})) it is possible for a client to issue any commands while in subscribed state.

For more information, see [Pub/sub]({{< relref "/develop/interact/pubsub" >}}).

## Behavior change history

*   `>= 6.2.0`: [`RESET`]({{< relref "/commands/reset" >}}) can be called to exit subscribed state.
