---
aliases:
- /integrate/redisvl/overview/install
description: Install RedisVL
linkTitle: Install
title: Install
type: integration
weight: 2
---
## Installation

Install the `redisvl` package into your Python (>=3.8) environment using the `pip` command:

```shell
pip install redisvl
```

Then make sure to have a Redis instance with the Redis Query Engine features enabled on Redis Cloud or locally in docker with Redis Stack:

```shell
docker run -d --name redis -p 6379:6379 -p 8001:8001 redis/redis-stack:latest
```

After running the previous command, the Redis Insight GUI will be available at http://localhost:8001.
