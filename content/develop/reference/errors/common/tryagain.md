---
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
description: A command accessed multiple keys while their hash slot was being migrated between cluster nodes.
linkTitle: TRYAGAIN
title: TRYAGAIN error
weight: 23
error:
  prefix: TRYAGAIN
  message: TRYAGAIN Multiple keys request during rehashing of slot
  match:
  - Multiple keys request during rehashing of slot
  - Slot is being trimmed
  - TryAgainError
---

A Redis cluster returns this error when a command with several keys runs while their hash slot is moving to another node. Some of the keys are still on the old node, and some aren't, so neither node can run the command. The error is temporary. It stops when the slot has finished moving.

```
TRYAGAIN Multiple keys request during rehashing of slot
```

In redis-py, this error is `TryAgainError: Multiple keys request during rehashing of slot`.

A similar error, `TRYAGAIN Slot is being trimmed`, means that a write reached a node while it was deleting all the keys of the slot, for example, after `SFLUSH`. It's temporary too.

## Example

During the move, the old node still has `user:{42}:profile`, but `user:{42}:cart` is already on the new node:

```
> MGET user:{42}:profile user:{42}:cart
(error) TRYAGAIN Multiple keys request during rehashing of slot
```

## How to fix it

Wait a moment and send the command again. Cluster clients usually retry for you. For example, redis-py's `RedisCluster` retries the command a few times. If the slot is still moving after that, it raises `ClusterError: TTL exhausted.`

If the error doesn't go away, the slot may be stuck in the middle of a move. To check, run `redis-cli --cluster check <host>:<port>`. It lists any slots that are still open, which means they're being moved. See [Scale with Redis Cluster](/content/operate/oss_and_stack/management/scaling.md).
