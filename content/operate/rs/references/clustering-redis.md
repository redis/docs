---
Title: Clustering Redis
alwaysopen: false
categories:
- docs
- operate
- rs
description: null
draft: true
weight: null
---
Joining multiple Redis servers into a Redis cluster is a challenging task, especially because Redis supports complex data structures and commands required by modern web applications, in high-throughput and low latency (sub-millisecond) conditions. Some of those challenges are:

- Performing union and intersection operations over List/Set/Sorted Set
   data types across multiple shards and nodes
- Maintaining consistency across multi-shard/multi-node architecture,
   while running (a) a SORT command over a List of Hash keys; or (b) a
   Redis transaction that includes multiple keys; or (c) a Lua script
   with multiple keys
- Creating a simple abstraction layer that hides the complex cluster
   architecture from the user’s application, without code modifications
   and while supporting infinite scalability
- Maintaining a reliable and consistent infrastructure in a cluster
   configuration

There are several solutions to clustering Redis, most notable of which is the [Redis Open Source cluster](http://redis.io/topics/cluster-spec).

Redis Enterprise Software and Redis Cloud were built from the ground up to provide a Redis cluster of any size while supporting all Redis commands. Your dataset is distributed across multiple shards in multiple nodes of the Redis cluster and is constantly monitored to ensure optimal performance. When needed, more shards and nodes can be added to your dataset so it can scale continuously and limitlessly.

Redis Enterprise clusters provide a single endpoint to connect to, and do not require any code changes or special configuration from the application’s perspective. For more information on setting up and using Redis Enterprise clusters, see [Database clustering]({{< relref "/operate/rs/databases/durability-ha/clustering/" >}}).
