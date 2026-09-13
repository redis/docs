---
Title: '"Hello World" for Apache Kafka'
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: Start a Korvet broker, create a topic, and produce and consume your
  first records with standard Kafka tooling.
linkTitle: Hello World
weight: 30
---

This walkthrough starts a Korvet broker against your own Redis,
creates a topic, and produces and consumes your first records with standard
Kafka tooling.

If you just want to watch Korvet run with data already flowing,
use [the demo]({{< relref "/integrate/korvet/quick-start/demo" >}}) instead — it provisions everything for
you. This page is the bring-your-own-client baseline.

## Prerequisites

- [Install Korvet]({{< relref "/integrate/korvet/quick-start/install" >}}) — on macOS and
  Linux, `brew install redis/tap/korvet`.
- A module-enabled Redis 8+. The quickest option:

  ```bash
  docker run -d --name korvet-redis -p 6379:6379 redis:8
  ```

- A Kafka client. The examples below use the `kafka-console-*` tools that ship
  with Apache Kafka.

## Step 1 — Start the broker

```bash
korvet server
```

The broker starts on `localhost:9092` and connects to Redis at
`redis://localhost:6379` by default. To run it in a container instead:

```bash
docker run -p 9092:9092 redisfield/korvet:latest server
```

## Step 2 — Create a topic

Use the bundled CLI:

```bash
korvet topics --create --bootstrap-server localhost:9092 --topic helloworld --partitions 3
```

Confirm it was created:

```bash
korvet topics --list --bootstrap-server localhost:9092
```

## Step 3 — Produce records

Korvet speaks the Kafka protocol, so any Kafka producer works:

```bash
echo "hello world" | kafka-console-producer --bootstrap-server localhost:9092 --topic helloworld
```

## Step 4 — Consume records

```bash
kafka-console-consumer --bootstrap-server localhost:9092 --topic helloworld --from-beginning
```

You should see `hello world` printed back. Press `Ctrl-C` to stop the consumer.

## What you accomplished

You started a Korvet broker backed by Redis, created a topic,
and produced and consumed records through it — using nothing but the standard
Kafka API. Any Kafka client, framework, or connector that targets
`localhost:9092` works the same way.

## Next steps

- [Using the Kafka API]({{< relref "/integrate/korvet/kafka-api" >}}) — produce, consume, and manage topics.
- [Schema Registry]({{< relref "/integrate/korvet/kafka-api/schema-registry" >}})
- [Tiered Storage]({{< relref "/integrate/korvet/storage" >}})
- [Deploying to production]({{< relref "/integrate/korvet/operations/deployment" >}})
