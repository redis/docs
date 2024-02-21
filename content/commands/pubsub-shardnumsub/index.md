---
acl_categories:
- '@pubsub'
- '@slow'
arguments:
- display_text: shardchannel
  multiple: true
  name: shardchannel
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
complexity: O(N) for the SHARDNUMSUB subcommand, where N is the number of requested
  shard channels
description: Returns the count of subscribers of shard channels.
group: pubsub
hidden: false
linkTitle: PUBSUB SHARDNUMSUB
since: 7.0.0
summary: Returns the count of subscribers of shard channels.
syntax_fmt: PUBSUB SHARDNUMSUB [shardchannel [shardchannel ...]]
syntax_str: ''
title: PUBSUB SHARDNUMSUB
---
Returns the number of subscribers for the specified shard channels.

Note that it is valid to call this command without channels, in this case it will just return an empty list.

Cluster note: in a Redis Cluster, [`PUBSUB`]({{< relref "/commands/pubsub" >}})'s replies in a cluster only report information from the node's Pub/Sub context, rather than the entire cluster.

## Examples

```
> PUBSUB SHARDNUMSUB orders
1) "orders"
2) (integer) 1
```
