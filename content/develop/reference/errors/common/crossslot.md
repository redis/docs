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
description: A command used keys that belong to different hash slots.
linkTitle: CROSSSLOT
title: CROSSSLOT error
weight: 22
error:
  prefix: CROSSSLOT
  message: CROSSSLOT Keys in request don't hash to the same slot
  match:
  - Keys in request don't hash to the same slot
  - ClusterCrossSlotError
---

A Redis cluster returns this error when one command uses keys that belong to different hash slots. A cluster splits keys into 16384 hash slots, and different nodes can serve different slots. A command that uses several keys, such as [`MSET`](/content/commands/mset.md) or [`MGET`](/content/commands/mget.md), only works when all of its keys are in the same slot.

```
CROSSSLOT Keys in request don't hash to the same slot
```

In redis-py, this error is `ClusterCrossSlotError: Keys in request don't hash to the same slot`.

## Example

The keys `user:1` and `user:2` are in different slots, so you can't read them with one `MGET`:

```
> CLUSTER KEYSLOT user:1
(integer) 10778
> CLUSTER KEYSLOT user:2
(integer) 6777
> MGET user:1 user:2
(error) CROSSSLOT Keys in request don't hash to the same slot
```

## How to fix it

- **Use hash tags to put related keys in the same slot.** When a key name has a part in curly braces, Redis uses only that part to choose the slot. So `user:{42}:profile` and `user:{42}:cart` are always in the same slot:

    ```
    > CLUSTER KEYSLOT user:{42}:profile
    (integer) 8000
    > CLUSTER KEYSLOT user:{42}:cart
    (integer) 8000
    > MSET user:{42}:profile "..." user:{42}:cart "..."
    OK
    ```

    Put the braces around the part that the keys share, such as a user ID. Don't give too many keys the same tag. All keys with the same tag are stored on the same node. See [Hash tags](/content/operate/oss_and_stack/reference/cluster-spec.md#hash-tags).
- **Split the command.** Send one command for each key, or one for each group of keys in the same slot. Some cluster clients can do this for you. For example, redis-py's `RedisCluster` has `mget_nonatomic()` and `mset_nonatomic()`. As the names say, the keys are then no longer read or written in one step.

Transactions and Lua scripts follow the same rule: all the keys they use must be in the same slot. See [Multi-key operations](/content/develop/using-commands/multi-key-operations.md).
