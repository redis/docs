---
acl_categories:
- '@pubsub'
- '@slow'
arguments:
- display_text: pattern
  name: pattern
  optional: true
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
- loading
- stale
complexity: O(N) where N is the number of active shard channels, and assuming constant
  time pattern matching (relatively short shard channels).
description: Returns the active shard channels.
group: pubsub
hidden: false
linkTitle: PUBSUB SHARDCHANNELS
since: 7.0.0
summary: Returns the active shard channels.
syntax_fmt: PUBSUB SHARDCHANNELS [pattern]
syntax_str: ''
title: PUBSUB SHARDCHANNELS
---
Lists the currently *active shard channels*.

An active shard channel is a Pub/Sub shard channel with one or more subscribers.

If no `pattern` is specified, all the channels are listed, otherwise if pattern is specified only channels matching the specified glob-style pattern are listed.

The information returned about the active shard channels are at the shard level and not at the cluster level.

## Examples

```
> PUBSUB SHARDCHANNELS
1) "orders"
> PUBSUB SHARDCHANNELS o*
1) "orders"
```

## Return information

{{< multitabs id="pubsub-shardchannels-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): a list of active channels, optionally matching the specified pattern.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): a list of active channels, optionally matching the specified pattern.

{{< /multitabs >}}
