---
Title: Running with Docker
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: How to run Korvet using Docker, including Docker Compose and JVM tuning.
linkTitle: Running with Docker
weight: 40
---

This guide shows how to run Korvet using Docker.

## Quick Start

Run Korvet with default configuration:

```bash
docker run -p 9092:9092 redisfield/korvet:latest server
```

This starts Korvet on port 9092. An external Redis instance is required; the image does not include one. See [Using External Redis](#using-external-redis) to point Korvet at your Redis.

The image also includes the Korvet operational CLI. Pass a command as the container argument:

```bash
docker run --rm redisfield/korvet:latest topics --bootstrap-server host.docker.internal:9092 --list
docker run --rm redisfield/korvet:latest migrate -u redis://host.docker.internal:6379
```

## Using External Redis

To use an external Redis instance:

```bash
docker run -p 9092:9092 \
  -e KORVET_REDIS_URI=redis://redis.example.com:6379 \
  redisfield/korvet:latest server
```

With authentication:

```bash
docker run -p 9092:9092 \
  -e KORVET_REDIS_URI=redis://redis.example.com:6379 \
  -e KORVET_REDIS_USERNAME=default \
  -e KORVET_REDIS_PASSWORD=${REDIS_PASSWORD} \
  redisfield/korvet:latest server
```

## Docker Compose

Create a `docker-compose.yml` file:

```yaml
services:
  redis:
    image: redis:8.6
    ports:
      - "6379:6379"

  korvet:
    image: redisfield/korvet:latest
    command: server
    ports:
      - "9092:9092"
    environment:
      KORVET_REDIS_URI: redis://redis:6379
    depends_on:
      - redis
```

With Redis authentication:

```yaml
services:
  redis:
    image: redis:8.6
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports:
      - "6379:6379"

  korvet:
    image: redisfield/korvet:latest
    command: server
    ports:
      - "9092:9092"
    environment:
      KORVET_REDIS_URI: redis://redis:6379
      KORVET_REDIS_PASSWORD: ${REDIS_PASSWORD}
    depends_on:
      - redis
```

Run with:

```bash
docker compose up
```

## Configuration

See [Configuration]({{< relref "/integrate/korvet/quick-start/configuration" >}}) for all available options.

## JVM Tuning

The Docker image accepts JVM options through the `JAVA_OPTS` environment variable.
Use this to increase heap size or apply additional JVM tuning flags.

For example, to run with a 2 GiB heap:

```bash
docker run -p 9092:9092 \
  -e JAVA_OPTS="-Xms2g -Xmx2g" \
  redisfield/korvet:latest server
```

### Direct Memory for High Concurrency

The broker defaults to `-XX:MaxDirectMemorySize=512m`. For production deployments with many
concurrent connections (e.g., Databricks Spark, Flink), raise it further. Set it via `JAVA_OPTS`
(not `JAVA_TOOL_OPTIONS`, which the baked default overrides), and keep the container memory limit
above `-Xmx + MaxDirectMemorySize` plus native overhead:

```bash
docker run -p 9092:9092 \
  -e JAVA_OPTS="-Xms2g -Xmx2g -XX:MaxDirectMemorySize=512m" \
  redisfield/korvet:latest server
```

Or in Docker Compose:

```yaml
services:
  korvet:
    image: redisfield/korvet:latest
    command: server
    environment:
      JAVA_OPTS: "-Xms2g -Xmx2g -XX:MaxDirectMemorySize=512m"
    mem_limit: 4g
```

## Next Steps

- [Using the Kafka API]({{< relref "/integrate/korvet/kafka-api" >}})
- [Monitoring]({{< relref "/integrate/korvet/operations/monitoring" >}})
