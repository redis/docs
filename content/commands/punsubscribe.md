---
acl_categories:
- '@pubsub'
- '@slow'
arguments:
- display_text: pattern
  multiple: true
  name: pattern
  optional: true
  type: pattern
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
complexity: O(N) where N is the number of patterns to unsubscribe.
description: Stops listening to messages published to channels that match one or more
  patterns.
group: pubsub
hidden: false
linkTitle: PUNSUBSCRIBE
since: 2.0.0
summary: Stops listening to messages published to channels that match one or more
  patterns.
syntax_fmt: PUNSUBSCRIBE [pattern [pattern ...]]
syntax_str: ''
title: PUNSUBSCRIBE
---
Unsubscribes the client from the given patterns, or from all of them if none is
given.

When no patterns are specified, the client is unsubscribed from all the
previously subscribed patterns.
In this case, a message for every unsubscribed pattern will be sent to the
client.

## Return information

{{< multitabs id="punsubscribe-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

When successful, this command doesn't return anything. Instead, for each pattern, one message with the first element being the string `punsubscribe` is pushed as a confirmation that the command succeeded.

-tab-sep-

When successful, this command doesn't return anything. Instead, for each pattern, one message with the first element being the string `punsubscribe` is pushed as a confirmation that the command succeeded.

{{< /multitabs >}}
