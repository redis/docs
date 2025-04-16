---
categories:
- docs
- operate
- stack
- oss
description: Upgrade a Redis Open Source cluster to Redis 8
linkTitle: Redis cluster
title: Upgrade a Redis cluster to Redis 8
weight: 30
---

{{< note >}}
The supported upgrade paths are:
- Redis Open Source 7.x (with or without modules) to Redis 8 in Redis Open Source
- Redis Stack 7.2 or 7.4 to Redis 8 in Redis Open Source
{{< /note >}}

{{< note >}}
It's essential to practice upgrading Redis in a controlled environment before upgrading it in a production environment.
Docker is an excellent tool to use for this purpose.
{{< /note >}}

Follow these instructions to upgrade a Redis cluster. This guide assumes you have installed Redis using one of the supported methods listed [here]({{< relref "/operate/oss_and_stack/install/archive" >}}).

### Save your current data

Before upgrading, create a snapshot of your current dataset on each node (identified by its port) using the following command:

```bash
redis-cli -p <port> SAVE
```

Repeat for every node in your cluster, both masters and replicas.

This creates or updates an `RDB` file, for example `dump.rdb`, in the node's Redis data directory. If you use AOF persistence, the files will be named `appendonly.aof.*` and they will be written in the `appendonlydir` directory inside the data directory. The AOF-related directory and file names are the defaults. Use the names defined in your `redis.conf` file if different from the defaults.

Use the following command on each node to identify where your data directories are located:

```bash
redis-cli -p <port> CONFIG GET dir
```

Make a copy of the files contained in each of those directories before proceeding.

### Upgrade Redis nodes

Upgrade each node one at a time, starting with the replicas, using these steps:

1. Stop the current version of Redis CE or Redis Stack server.
1. Follow the installation steps that correspond to your [Redis distribution]({{< relref "/operate/oss_and_stack/install/install-stack" >}}) to install Redis 8.
1. Start Redis 8 if it didn't start automatically.

### Restore from saved files (if necessary)

If necessary, restore the saved files to their original locations on each node. Then restart Redis on each node.

### Verify the upgrade

```bash
redis-cli -p <port> INFO server | grep redis_version
redis-cli -p <port> cluster info
redis-cli --cluster check <IP address>:<port>
```

You should also verify that your data is accessible and that your clients can connect successfully.
