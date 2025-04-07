---
categories:
- docs
- operate
- stack
- oss
description: How to run Redis Community Edition using Docker
linkTitle: Docker
title: Run Redis Community Edition on Docker
weight: 1
---

## Run Redis Community Edition (CE) on Docker

To start Redis Community Edition server, using the `redis:<version>` image, run the following command in your terminal:

{{< highlight bash >}}
docker run -d --name redis -p 6379:6379 redis:<version>
{{< / highlight >}}

## Connect with redis-cli

You can then connect to the server using `redis-cli`, just as you connect to any Redis instance.

If you don’t have `redis-cli` installed locally, you can run it from the Docker container:

{{< highlight bash >}}
$ docker exec -it redis redis-cli
{{< / highlight >}}

If you do have `redis-cli` installed locally, you can run it from your terminal:

{{< highlight bash >}}
$ redis-cli -h 127.0.0.1 -p 6379
{{< / highlight >}}

## Use a local configuration file

By default, the Redis Docker containers use internal configuration files for Redis. To start Redis with local configuration file, you can do one of the following:

You can create your own Dockerfile that adds a `redis.conf` from the context into `/data/`, like so.

```
FROM redis
COPY redis.conf /usr/local/etc/redis/redis.conf
CMD [ "redis-server", "/usr/local/etc/redis/redis.conf" ]
```
Alternatively, you can specify something along the same lines with docker run options.

{{< highlight bash >}}
$ docker run -v /myredis/conf:/usr/local/etc/redis --name myredis redis redis-server /usr/local/etc/redis/redis.conf
{{< / highlight >}}

where `/myredis/conf/` is a local directory containing your `redis.conf` file. Using this method means that there is no need for you to have a Dockerfile for your redis container.

The mapped directory should be writable, as depending on the configuration and mode of operation, Redis may need to create additional configuration files or rewrite existing ones.
