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
description: The key belongs to a hash slot that another cluster node serves.
linkTitle: MOVED
title: MOVED error
weight: 20
error:
  prefix: MOVED
  message: MOVED <slot> <host>:<port>
  match:
  - MovedError
---

A Redis cluster returns this error when you send a command to a node that doesn't serve the key. The error tells you which node does. A client that supports clusters reads the error, sends the command again to the right node, and updates its map of the cluster.

A cluster splits keys into 16384 hash slots, and each primary node serves some of the slots. The error gives the key's slot number and the address of the node that serves it:

```
MOVED 12182 127.0.0.1:6463
```

In redis-py, this error is `MovedError: 12182 127.0.0.1:6463`.

## Example

```
> GET foo
(error) MOVED 12182 127.0.0.1:6463
```

## How to fix it

- **Your client doesn't support clusters.** Use a cluster client, which follows `MOVED` errors for you. For example, in redis-py, use `RedisCluster` instead of `Redis`. See [Connect to a Redis cluster](/content/develop/clients/redis-py/connect.md#connect-to-a-redis-cluster).
- **You're using `redis-cli`.** Add the `-c` option, so `redis-cli` follows the error to the right node: `redis-cli -c -h <host> -p <port>`.

See [MOVED redirection](/content/operate/oss_and_stack/reference/cluster-spec.md#moved-redirection) in the cluster specification.
