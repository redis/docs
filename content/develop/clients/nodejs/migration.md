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
description: Learn the differences between ioredis and node-redis
linkTitle: Migrate from ioredis
title: Migrate from ioredis
weight: 6
---

Redis previously recommended the [`ioredis`](https://github.com/redis/ioredis)
client library for development with [`Node.js`](https://nodejs.org/en),
but this library is now deprecated in favor of
[`node-redis`]({{< relref "/develop/clients/nodejs" >}}). This guide
outlines the main similarities and differences between the two libraries that
you should be aware of if you are an `ioredis` user and you want to start a new
Node.js project or migrate an existing `ioredis` project to `node-redis`

| Feature | `ioredis` | `node-redis` |
| :-- | :-- | :-- |
| Handling asynchronous command results | Callbacks and Promises | Promises only |