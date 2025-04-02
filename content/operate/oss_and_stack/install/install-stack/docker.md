---
categories:
- docs
- operate
- stack
- oss
description: How to run Redis Open Source using Docker
linkTitle: Docker
title: Run Redis Open Source on Docker
weight: 1
---

## Run Redis Open Source on Docker

To get started with Redis Open Source using Docker, you first need to select a Docker image:

* `redis/redis-stack` contains both Redis Stack server and Redis Insight. This container is best for local development because you can use the embedded Redis Insight to visualize your data.

* `redis/redis-stack-server` provides Redis Stack server only. This container is best for production deployment.

## Getting started

### redis/redis-stack-server

To start Redis Stack server using the `redis-stack-server` image, run the following command in your terminal:

{{< highlight bash >}}
docker run -d --name redis-stack-server -p 6379:6379 redis/redis-stack-server:latest
{{< / highlight >}}

### redis/redis-stack

To start a Redis Stack container using the `redis-stack` image, run the following command in your terminal:

{{< highlight bash >}}
docker run -d --name redis-stack -p 6379:6379 -p 8001:8001 redis/redis-stack:latest
{{< / highlight >}}

The `docker run` command above also exposes Redis Insight on port 8001. You can use Redis Insight by pointing your browser to `localhost:8001`.

## Connect with redis-cli

You can then connect to the server using `redis-cli`, just as you connect to any Redis instance.

If you don’t have `redis-cli` installed locally, you can run it from the Docker container:

{{< highlight bash >}}
$ docker exec -it redis-stack redis-cli
{{< / highlight >}}

## Configuration

### Persistence in Docker

To mount directories or files to your Docker container, specify `-v` to configure a local volume. This command stores all data in the local directory `local-data`:
{{< highlight bash >}}
$ docker run -v /local-data/:/data redis/redis-stack:latest
{{< / highlight >}}

### Ports

If you want to expose Redis Stack server or Redis Insight on a different port, update the left hand of portion of the `-p` argument. This command exposes Redis Stack server on port `10001` and Redis Insight on port `13333`:
{{< highlight bash >}}
$ docker run -p 10001:6379 -p 13333:8001 redis/redis-stack:latest
{{< / highlight >}}

### Config files

By default, the Redis Stack Docker containers use internal configuration files for Redis. To start Redis with local configuration file, you can use the `-v` volume options:

{{< highlight bash >}}
$ docker run -v `pwd`/local-redis-stack.conf:/redis-stack.conf -p 6379:6379 -p 8001:8001 redis/redis-stack:latest
{{< / highlight >}}

### Environment variables

To pass in arbitrary configuration changes, you can set any of these environment variables:

* `REDIS_ARGS`: extra arguments for Redis

* `REDISEARCH_ARGS`: arguments for the search and query features (RediSearch)

* `REDISJSON_ARGS`: arguments for JSON (RedisJSON)

* `REDISTIMESERIES_ARGS`: arguments for time series (RedisTimeSeries)

* `REDISBLOOM_ARGS`: arguments for  the probabilistic data structures (RedisBloom)


For example, here's how to use the `REDIS_ARGS` environment variable to pass the `requirepass` directive to Redis:

{{< highlight bash >}}
docker run -e REDIS_ARGS="--requirepass redis-stack" redis/redis-stack:latest
{{< / highlight >}}

An example of setting [Redis persistence]({{< relref "/operate/oss_and_stack/management/persistence" >}}):
{{< highlight bash >}}
docker run -e REDIS_ARGS="--save 60 1000 --appendonly yes" redis/redis-stack:latest
{{< / highlight >}}

Here's how to set a retention policy for time series:
{{< highlight bash >}}
docker run -e REDISTIMESERIES_ARGS="RETENTION_POLICY=20" redis/redis-stack:latest
{{< / highlight >}}
