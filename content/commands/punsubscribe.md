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
railroad_diagram: /images/railroad/punsubscribe.svg
since: 2.0.0
summary: Stops listening to messages published to channels that match one or more
  patterns.
syntax_fmt: PUNSUBSCRIBE [pattern [pattern ...]]
title: PUNSUBSCRIBE
---
Unsubscribes the client from the specified patterns, or from all patterns if none are specified.

If you don’t specify any patterns, the client unsubscribes from all previously subscribed patterns. The client receives one message for each pattern it unsubscribes from.

## Optional arguments

<details open><summary><code>pattern [pattern ...]</code></summary>

One or more patterns to unsubscribe from. If omitted, the client is unsubscribed from all patterns.

</details>

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="punsubscribe-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

When successful, this command doesn't return anything. Instead, for each pattern, one message with the first element being the string `punsubscribe` is pushed as a confirmation that the command succeeded.

-tab-sep-

When successful, this command doesn't return anything. Instead, for each pattern, one message with the first element being the string `punsubscribe` is pushed as a confirmation that the command succeeded.

{{< /multitabs >}}
