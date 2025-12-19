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
complexity: O(N) for the NUMSUB subcommand, where N is the number of requested channels
description: Returns a count of subscribers to channels.
group: pubsub
hidden: false
linkTitle: PUBSUB NUMSUB
railroad_diagram: /images/railroad/pubsub-numsub.svg
since: 2.8.0
summary: Returns a count of subscribers to channels.
syntax_fmt: PUBSUB NUMSUB [channel [channel ...]]
title: PUBSUB NUMSUB
---
Returns the number of subscribers (exclusive of clients subscribed to patterns) for the specified channels.

Note that it is valid to call this command without channels. In this case it will just return an empty list.

Cluster note: in a Redis Cluster clients can subscribe to every node, and can also publish to every other node. The cluster will make sure that published messages are forwarded as needed. That said, [`PUBSUB`]({{< relref "/commands/pubsub" >}})'s replies in a cluster only report information from the node's Pub/Sub context, rather than the entire cluster.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="pubsub-numsub-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): the number of subscribers per channel, each even element (including the 0th) is channel name, each odd element is the number of subscribers

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): the number of subscribers per channel, each even element (including the 0th) is channel name, each odd element is the number of subscribers

{{< /multitabs >}}
