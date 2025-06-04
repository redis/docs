---
acl_categories:
- '@pubsub'
- '@slow'
arguments:
- display_text: shardchannel
  multiple: true
  name: shardchannel
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
complexity: O(N) where N is the number of shard channels to subscribe to.
description: Listens for messages published to shard channels.
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
      lastkey: -1
      limit: 0
    type: range
  not_key: true
linkTitle: SSUBSCRIBE
since: 7.0.0
summary: Listens for messages published to shard channels.
syntax_fmt: SSUBSCRIBE shardchannel [shardchannel ...]
syntax_str: ''
title: SSUBSCRIBE
---
Subscribes the client to the specified shard channels.

In a Redis cluster, shard channels are assigned to slots by the same algorithm used to assign keys to slots. 
Client(s) can subscribe to a node covering a slot (primary/replica) to receive the messages published. 
All the specified shard channels needs to belong to a single slot to subscribe in a given `SSUBSCRIBE` call,
A client can subscribe to channels across different slots over separate `SSUBSCRIBE` call.

For more information about sharded Pub/Sub, see [Sharded Pub/Sub]({{< relref "/develop/interact/pubsub#sharded-pubsub" >}}).

## Examples

```
> ssubscribe orders
Reading messages... (press Ctrl-C to quit)
1) "ssubscribe"
2) "orders"
3) (integer) 1
1) "smessage"
2) "orders"
3) "hello"
```
