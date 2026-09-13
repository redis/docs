---
Title: Metrics
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: Korvet exposes metrics in Prometheus format via Spring Boot Actuator.
group: service
hideListLinks: false
linkTitle: Metrics
summary: Korvet provides a Kafka-compatible API backed by Redis Streams, so you
  can use existing Kafka clients and tools with Redis as the storage engine.
type: integration
weight: 30
---

Korvet exposes metrics in Prometheus format via Spring Boot Actuator.

The metrics reference is organized by module:

- [Tags and families]({{< relref "/integrate/korvet/reference/metrics/contracts" >}})
- [Application metrics]({{< relref "/integrate/korvet/reference/metrics/application" >}})
- [Broker metrics]({{< relref "/integrate/korvet/reference/metrics/broker" >}})
- [Mapper metrics]({{< relref "/integrate/korvet/reference/metrics/mapper" >}})
- [Storage metrics]({{< relref "/integrate/korvet/reference/metrics/storage" >}}) (cross-tier verbs plus local/remote tier-specific meters)
- [Storage worker metrics]({{< relref "/integrate/korvet/reference/metrics/storage-worker" >}})
- [Lettuce Redis client metrics]({{< relref "/integrate/korvet/reference/metrics/redis-client" >}})

See [Tags and families]({{< relref "/integrate/korvet/reference/metrics/contracts" >}}) for the tag vocabulary and top-level metric families.

## Platform Metrics

Micrometer also exports standard JVM and system metrics.

| Metric | Description |
|---|---|
| `jvm.memory.used` | JVM memory used |
| `jvm.memory.max` | JVM maximum memory |
| `jvm.gc.pause` | Garbage collection pause time |
| `jvm.threads.live` | Live threads |
| `process.cpu.usage` | Process CPU usage |
| `system.cpu.usage` | System CPU usage |

## Next Steps

- [Monitoring guide]({{< relref "/integrate/korvet/operations/monitoring" >}}) — example Prometheus queries, dashboards, and alerts
- [API reference]({{< relref "/integrate/korvet/reference/api" >}})
