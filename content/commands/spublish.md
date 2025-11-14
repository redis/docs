---
acl_categories:
- '@pubsub'
- '@fast'
arguments:
- display_text: shardchannel
  name: shardchannel
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
- kubernetes
- clients
command_flags:
- pubsub
- loading
- stale
- fast
complexity: O(N) where N is the number of clients subscribed to the receiving shard
  channel.
description: Post a message to a shard channel
group: pubsub
hidden: false
key_specs:
- begin_search:
    spec:
      index: 1
    type: index
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
  not_key: true
linkTitle: SPUBLISH
since: 7.0.0
summary: Post a message to a shard channel
syntax_fmt: SPUBLISH shardchannel message
syntax_str: message
title: SPUBLISH
---
Posts a message to the given shard channel.

In Redis Cluster, shard channels are assigned to slots by the same algorithm used to assign keys to slots.
A shard message must be sent to a node that owns the slot the shard channel is hashed to. 
The cluster makes sure that published shard messages are forwarded to all the nodes in the shard, so clients can subscribe to a shard channel by connecting to any one of the nodes in the shard.

For more information about sharded pubsub, see [Sharded Pubsub]({{< relref "/develop/pubsub#sharded-pubsub" >}}).

## Examples

For example the following command publishes to the `orders` channel with a subscriber already waiting for message(s).
    
```
> spublish orders hello
(integer) 1
```

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="spublish-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the number of clients that the message was sent to. Note that in a Redis Cluster, only clients that are connected to the same node as the publishing client are included in the count

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): the number of clients that the message was sent to. Note that in a Redis Cluster, only clients that are connected to the same node as the publishing client are included in the count

{{< /multitabs >}}
