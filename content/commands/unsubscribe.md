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
compatibility:
  software:
    standard: supported
    active_active: supported
  cloud:
    standard: supported
    active_active: supported
complexity: O(N) where N is the number of channels to unsubscribe.
description: Stops listening to messages posted to channels.
group: pubsub
hidden: false
linkTitle: UNSUBSCRIBE
railroad_diagram: /images/railroad/unsubscribe.svg
since: 2.0.0
summary: Stops listening to messages posted to channels.
syntax_fmt: UNSUBSCRIBE [channel [channel ...]]
title: UNSUBSCRIBE
---

Unsubscribes the client from the specified channels, or from all channels if none are specified.

If you don’t specify any channels, the client unsubscribes from all previously subscribed channels. The client receives one message for each channel it unsubscribes from.

## Optional arguments

<details open><summary><code>channel [channel ...]</code></summary>

One or more channels to unsubscribe from. If omitted, the client is unsubscribed from all channels.

</details>

## Redis Software and Redis Cloud compatibility

{{< command-compatibility >}}

## Return information

{{< multitabs id="unsubscribe-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

When successful, this command doesn't return anything. Instead, for each channel, one message with the first element being the string `unsubscribe` is pushed as a confirmation that the command succeeded.

-tab-sep-

When successful, this command doesn't return anything. Instead, for each channel, one message with the first element being the string `unsubscribe` is pushed as a confirmation that the command succeeded.

{{< /multitabs >}}
