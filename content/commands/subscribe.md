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
railroad_diagram: /images/railroad/subscribe.svg
since: 2.0.0
summary: Listens for messages published to channels.
syntax_fmt: SUBSCRIBE channel [channel ...]
title: SUBSCRIBE
---
Subscribes the client to the specified channels.

Once the client enters the subscribed state it is not supposed to issue any
other commands, except for additional `SUBSCRIBE`, [`SSUBSCRIBE`]({{< relref "/commands/ssubscribe" >}}), [`PSUBSCRIBE`]({{< relref "/commands/psubscribe" >}}), [`UNSUBSCRIBE`]({{< relref "/commands/unsubscribe" >}}), [`SUNSUBSCRIBE`]({{< relref "/commands/sunsubscribe" >}}), 
[`PUNSUBSCRIBE`]({{< relref "/commands/punsubscribe" >}}), [`PING`]({{< relref "/commands/ping" >}}), [`RESET`]({{< relref "/commands/reset" >}}) and [`QUIT`]({{< relref "/commands/quit" >}}) commands.
However, if RESP3 is used (see [`HELLO`]({{< relref "/commands/hello" >}})) it is possible for a client to issue any commands while in subscribed state.

For more information, see [Pub/sub]({{< relref "/develop/pubsub" >}}).

## Behavior change history

*   `>= 6.2.0`: [`RESET`]({{< relref "/commands/reset" >}}) can be called to exit subscribed state.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="subscribe-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

When successful, this command doesn't return anything. Instead, for each channel, one message with the first element being the string `subscribe` is pushed as a confirmation that the command succeeded.

-tab-sep-

When successful, this command doesn't return anything. Instead, for each channel, one message with the first element being the string `subscribe` is pushed as a confirmation that the command succeeded.

{{< /multitabs >}}
