---
Title: Korvet
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: Korvet is a Kafka-compatible streaming service backed by Redis Streams.
group: service
hideListLinks: false
linkTitle: Korvet
summary: Korvet provides a Kafka-compatible API backed by Redis Streams, so you
  can use existing Kafka clients and tools with Redis as the storage engine.
type: integration
weight: 1
---

Korvet is a Kafka-compatible streaming service backed by Redis Streams.

Korvet is developed by Redis Field Engineering.
To report bugs, request features, or receive assistance, please [file an issue](https://github.com/redis-field-engineering/korvet-dist/issues).

## Overview

Korvet provides a Kafka-compatible API backed by Redis Streams:

- **Kafka compatibility**: Use existing Kafka clients and tools
- **Redis Streams**: High-performance, durable message storage
- **Consumer groups**: Coordinated consumption with offset tracking
- **Low latency**: Sub-millisecond read/write performance

## Key Features

- **Kafka Protocol Support**: Compatible with Kafka clients (produce, consume, consumer groups)
- **Redis Streams**: High-performance storage with built-in persistence
- **Tiered Storage**: Optionally archive sealed segments to Apache Iceberg tables on object storage for cost-efficient long-term retention
- **Consumer Groups**: Full support for coordinated consumption and offset management
- **Admin API**: Create/delete topics, configure retention, describe cluster
- **Production-ready**: Built-in metrics, health checks, and observability

## Use Cases

- **Kafka alternative**: Lightweight Kafka-compatible streaming on Redis
- **Kafka migration**: Gradual migration from Kafka to Redis-based streaming
- **Low-latency streaming**: Sub-millisecond message delivery
- **Simplified operations**: Single Redis instance instead of Kafka cluster

## License

Korvet is licensed under the [Business Source License 1.1](https://github.com/redis-field-engineering/korvet-dist/blob/main/LICENSE).

Production use is permitted only with Redis Community Edition, Redis Cloud, or Redis Software.
Non-production use (development, testing) is unrestricted.
The license converts to MIT four years after each version's publication.
