---
categories:
- docs
- operate
- stack
- oss
description: Upgrade a standalone instance of Redis Community Edition or Redis Stack to Redis 8
linkTitle: Standalone (single node)
title: Upgrade a standalone Redis instance to Redis 8
weight: 20
---
{{< note >}}
The supported upgrade paths are:
- Redis Community Edition 7.x (with or without modules) to Redis Community Edition 8
- Redis Stack 7.2 or 7.4 to Redis Community Edition 8
{{< /note >}}

{{< note >}}
It's essential to practice upgrading Redis in a controlled environment before upgrading it in a production environment.
Docker is an excellent tool to use for this purpose.
{{< /note >}}

Follow these instructions to upgrade a single-node Redis server. This guide assumes you have installed Redis using one of the supported methods listed [here]({{< relref "/operate/oss_and_stack/install/archive" >}}).

### Save your current data

Before upgrading, create a snapshot of your current dataset using the following command:

```bash
redis-cli SAVE
```

This creates or updates an `RDB` file, for example `dump.rdb`, in your Redis data directory. If you use AOF persistence, the files will be named `appendonly.aof.*` and they will be written in the `appendonlydir` directory inside the data directory. The AOF-related directory and file names are the defaults. Use the names defined in your `redis.conf` file if different from the defaults.

Use the following command to identify where your data directory is located:

```bash
redis-cli CONFIG GET dir
```

Make a copy of these files before proceeding:

```bash
cp -r /path/to/redis-data-dir/ /path/to/backup/
```

### Upgrade Redis

Follow these steps to upgrade Redis.

1. Stop the current version of Redis CE or Redis Stack server.
1. Follow the installation steps that correspond to your [Redis distribution]({{< relref "/operate/oss_and_stack/install/install-stack" >}}) to install Redis 8.
1. Start Redis 8 if it didn't start automatically.

### Restore from saved files (if necessary)

If Redis fails to start properly or if data is missing after the upgrade, restore from your backup.

1. Stop the Redis server.
2. Copy the backup file back into the the Redis data directory:
   ```bash
   cp -r /path/to/backup/ /path/to/redis-data-dir/
   ```
3. Start Redis again and verify data is restored:
   ```bash
   redis-cli INFO persistence
   ```

### Verify the upgrade

Use the following command to confirm you're running Redis 8:

```bash
redis-cli INFO server | grep redis_version
```

You should also verify that your data is accessible and that your clients can connect successfully.
