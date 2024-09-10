---
Title: Install RedisGears for Redis Data Integration
aliases: null
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Install and set up RedisGears for a Write-behind deployment
group: di
linkTitle: Install RedisGears
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 70
---

Write-behind requires that [RedisGears](https://redis.com/modules/redis-gears) module with the [Python plugin](https://docs.redis.com/latest/modules/redisgears/python/) is installed on the Redis Enterprise cluster.

The Python plugin can be installed explicitly or alongside with the [JVM plugin](https://docs.redis.com/latest/modules/redisgears/jvm/) if the latter is needed on the cluster for other purposes.

Use the [`redis-di create`]({{< relref "/integrate/write-behind/reference/cli/redis-di-create.md" >}}) command in Write-behind CLI to install RedisGears.

## Download RedisGears

Download RedisGears based on the Linux distribution of where Redis Enterprise is installed.

### Ubuntu 20.04

```bash
curl -s --tlsv1.3 https://redismodules.s3.amazonaws.com/redisgears/redisgears.Linux-ubuntu20.04-x86_64.{{<param rdi_redis_gears_version>}}-withdeps.zip -o /tmp/redis-gears.zip
```

### Ubuntu 18.04

```bash
curl -s --tlsv1.3 https://redismodules.s3.amazonaws.com/redisgears/redisgears.Linux-ubuntu18.04-x86_64.{{<param rdi_redis_gears_version>}}-withdeps.zip -o /tmp/redis-gears.zip
```

### RHEL8

```bash
curl -s https://redismodules.s3.amazonaws.com/redisgears/redisgears.Linux-rhel8-x86_64.{{<param rdi_redis_gears_version>}}-withdeps.zip -o /tmp/redis-gears.zip
```

### RHEL7

```bash
curl -s https://redismodules.s3.amazonaws.com/redisgears/redisgears.Linux-rhel7-x86_64.{{<param rdi_redis_gears_version>}}-withdeps.zip -o /tmp/redis-gears.zip
```
