---
Title: API Reference
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: Documents the Kafka protocol APIs and Actuator REST endpoints supported
  by Korvet.
linkTitle: API
weight: 20
---

Korvet implements the Kafka protocol. This page documents the supported APIs.

## Kafka Protocol APIs

### Produce API

Send messages to topics.

**Request**:

```
ProduceRequest {
  topic: string
  partition: int32
  messages: [
    {
      key: bytes
      value: bytes
      headers: [(string, bytes)]
      timestamp: int64
    }
  ]
}
```

**Response**:

```
ProduceResponse {
  topic: string
  partition: int32
  offset: int64
  timestamp: int64
}
```

### Fetch API

Read messages from topics.

**Request**:

```
FetchRequest {
  topics: [
    {
      topic: string
      partitions: [
        {
          partition: int32
          offset: int64
          max_bytes: int32
        }
      ]
    }
  ]
  max_wait_ms: int32
  min_bytes: int32
}
```

**Response**:

```
FetchResponse {
  topics: [
    {
      topic: string
      partitions: [
        {
          partition: int32
          high_watermark: int64
          messages: [
            {
              offset: int64
              key: bytes
              value: bytes
              headers: [(string, bytes)]
              timestamp: int64
            }
          ]
        }
      ]
    }
  ]
}
```

### Metadata API

Get topic and partition information.

**Request**:

```
MetadataRequest {
  topics: [string]  # Empty for all topics
}
```

**Response**:

```
MetadataResponse {
  brokers: [
    {
      node_id: int32
      host: string
      port: int32
    }
  ]
  topics: [
    {
      name: string
      partitions: [
        {
          partition: int32
          leader: int32
        }
      ]
    }
  ]
}
```

## REST API (Actuator)

Spring Boot Actuator endpoints for monitoring and management.

### Health Check

```bash
GET /actuator/health
```

**Response**:

```json
{
  "status": "UP",
  "components": {
    "redis": {
      "status": "UP"
    }
  }
}
```

### Metrics

```bash
GET /actuator/prometheus
```

Returns Prometheus-formatted metrics.

### Info

```bash
GET /actuator/info
```

**Response**:

```json
{
  "build": {
    "group": "com.redis",
    "artifact": "korvet-server",
    "version": "1.0.0",
    "time": "2026-01-01T00:00:00.000Z"
  }
}
```

## Next Steps

- [Kafka API guide]({{< relref "/integrate/korvet/kafka-api" >}})
- [Metrics reference]({{< relref "/integrate/korvet/reference/metrics" >}})
