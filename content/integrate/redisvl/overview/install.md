---
description: How to install RedisVL
title: Install RedisVL
type: integration
---
There are a few ways to install RedisVL. The easiest way is to use Python's `pip` command.

## Install RedisVL with pip

Install `redisvl` into your Python (>=3.8) environment using `pip`:

```bash
$ pip install -U redisvl
```

RedisVL comes with a few dependencies that are automatically installed. However, a few dependencies
are optional and can be installed separately if needed:

```bash
$ pip install redisvl[all]  # install vectorizer dependencies
$ pip install redisvl[dev]  # install dev dependencies
```

If you use Zsh, remember to escape the brackets:

```bash
$ pip install redisvl\[all\]
```

This library supports the use of [hiredis](https://redis.com/lp/hiredis/), so you can also install RedisVL by running:

```bash
pip install redisvl[hiredis]
```

## Install RedisVL from source

To install RedisVL from source, clone the repository and install the package using `pip`:

```bash
$ git clone git@github.com:redis/redis-vl-python.git && cd redis-vl-python
$ pip install .

# or for an editable installation (for developers of RedisVL)
$ pip install -e .
```

## Install Redis

RedisVL requires a distribution of Redis that supports the [search and query](https://redis.com/modules/redis-search/) capability, of which there are three:

1. [Redis Cloud](https://redis.com/try-free), a fully managed cloud offering that you can try for free.
2. [Redis Stack]({{< relref "/operate/oss_and_stack/install/install-stack/docker" >}}), a local docker image for testing and development.
3. [Redis Enterprise](https://redis.com/redis-enterprise/), a commercial self-hosted offering.

### Redis Cloud

Redis Cloud is the easiest way to get started with RedisVL. You can sign up for a free account [here](https://redis.com/try-free). Make sure to have the **Search and Query** capability enabled when creating your database.

### Redis Stack (local development)

For local development and testing, Redis Stack and be used. We recommend running Redis
in a docker container. To do so, run the following command:

```bash
docker run -d --name redis-stack -p 6379:6379 -p 8001:8001 redis/redis-stack:latest
```

This will also start the [Redis Insight application](https://redis.com/redis-enterprise/redis-insight/) at `http://localhost:8001`.

### Redis Enterprise (self-hosted)

Redis Enterprise is a commercial offering that can be self-hosted. You can download the latest version [here](https://redis.com/redis-enterprise-software/download-center/software/).

If you are considering a self-hosted Redis Enterprise deployment on Kubernetes, there is the [Redis Enterprise Operator](https://docs.redis.com/latest/kubernetes/) for Kubernetes. This will allow you to easily deploy and manage a Redis Enterprise cluster on Kubernetes.