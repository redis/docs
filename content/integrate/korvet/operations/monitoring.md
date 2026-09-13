---
Title: Monitoring
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: Monitor Korvet through Spring Boot Actuator and Micrometer.
linkTitle: Monitoring
weight: 60
---

Korvet provides comprehensive monitoring through Spring Boot Actuator and Micrometer.

## Health Checks

Korvet exposes health check endpoints:

```bash
# Overall health
curl http://localhost:8080/actuator/health

# Liveness probe (for Kubernetes)
curl http://localhost:8080/actuator/health/liveness

# Readiness probe (for Kubernetes)
curl http://localhost:8080/actuator/health/readiness
```

{{< note >}}
The `liveness` and `readiness` health groups are only exposed when probes are enabled. Spring Boot enables them automatically when it detects a Kubernetes environment, or you can enable them explicitly with `management.endpoint.health.probes.enabled=true`. On a plain local run without this setting, the `/actuator/health/liveness` and `/actuator/health/readiness` sub-paths are not available; use `/actuator/health` instead.
{{< /note >}}

## Metrics

Metrics are exposed in Prometheus format:

```bash
curl http://localhost:8080/actuator/prometheus
```

### Available Metrics

#### Korvet Custom Metrics

- **korvet.broker.produce**: Produce request latency histogram (tag: `topic`)
- **korvet.broker.fetch**: Fetch request latency histogram (tag: `topic`)
- **korvet.broker.request**: Kafka API request latency histogram (tags: `api_key`, `result`)
- **korvet.broker.frame_size**: Kafka frame size distribution (tags: `direction`, `api_key`)
- **korvet.broker.up**: Broker lifecycle gauge
- **korvet.broker.failures**: Broker failure counter (tags: `operation`, `error_type`). Authentication failures arrive here with `operation=auth`.
- **korvet.storage.read**, **korvet.storage.write**, **korvet.storage.ack**: Cross-tier storage verb latency timers (tags: `tier`, `result`; read also carries `mode=stream|group`)
- **korvet.storage.read.messages**, **korvet.storage.write.messages**: Cross-tier messages-per-call distribution summaries (tag: `tier`; read.messages also carries `mode`)
- **korvet.storage.archive**, **korvet.storage.archive.segments**, **korvet.storage.archive.bytes**, **korvet.storage.archive.failures**, **korvet.storage.archive.lag.\***: Cold-tier offload latency, throughput, failures, and sealed-segment backlog.
- **korvet.storage.local.pool.acquire** / **korvet.storage.local.pool.pending**: Local Redis connection-pool meters (acquire timer carries `result=success|timeout|error`)
- **korvet.storage.worker.up**, **korvet.storage.worker.failures**: Storage worker liveness gauge and failure counter (failures tagged `phase`, `error_type`). The worker's storage I/O flows through the shared `korvet.storage.{read,write,ack}` timers tagged `tier=remote`.

See [Metrics Reference]({{< relref "/integrate/korvet/reference/metrics" >}}) for the full module-by-module catalog.

#### JVM and System Metrics

Standard JVM and system metrics from Micrometer:

- **jvm.memory.used**: JVM memory used
- **jvm.memory.max**: JVM maximum memory
- **jvm.gc.pause**: Garbage collection pause time
- **jvm.threads.live**: Live threads
- **process.cpu.usage**: Process CPU usage
- **system.cpu.usage**: System CPU usage
- **system.load.average.1m**: System load average

## Prometheus Configuration

Add Korvet to your Prometheus scrape config:

```yaml
scrape_configs:
  - job_name: 'korvet'
    static_configs:
      - targets: ['korvet:8080']
    metrics_path: '/actuator/prometheus'
```

## Example Prometheus Queries

See [Metrics Reference]({{< relref "/integrate/korvet/reference/metrics" >}}) for the full metric and tag vocabulary used below.

**Produce latency (p99) per topic**:

```promql
histogram_quantile(0.99, sum by (topic, le) (rate(korvet_broker_produce_seconds_bucket[5m])))
```

**Fetch latency (p95) per topic**:

```promql
histogram_quantile(0.95, sum by (topic, le) (rate(korvet_broker_fetch_seconds_bucket[5m])))
```

**Broker request rate by API key and result**:

```promql
sum by (api_key, result) (rate(korvet_broker_request_seconds_count[5m]))
```

**Local Redis pool timeout rate**:

```promql
rate(korvet_storage_local_pool_acquire_seconds_count{result="timeout"}[5m])
```

**Read mix by tier**:

```promql
sum by (tier, result) (rate(korvet_storage_read_seconds_count[5m]))
```

**Broker failure rate by operation and error type**:

```promql
sum by (operation, error_type) (rate(korvet_broker_failures_total[5m]))
```

**Redis command latency (p99) by command**:

```promql
histogram_quantile(0.99, sum by (command, le) (rate(lettuce_command_completion_seconds_bucket[5m])))
```

## Monitoring Stack Setup

A complete monitoring stack with Prometheus and Grafana is available in the [korvet-dist observability sample](https://github.com/redis-field-engineering/korvet-dist/tree/main/samples/observability) directory.

### Quick Start with Docker Compose

The easiest way to set up monitoring is to include the observability stack in your `docker-compose.yml`:

```yaml
include:
  - path/to/korvet-dist/samples/observability/monitoring.yml

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
      - "8080:8080"
    environment:
      - KORVET_REDIS_HOST=redis
      - KORVET_REDIS_METRICS_ENABLED=true
    depends_on:
      - redis
```

This automatically adds:

- **Prometheus** on port 9090 - Metrics collection and storage
- **Grafana** on port 3000 - Pre-configured dashboard for Korvet metrics

### Accessing the Dashboard

1. Start your services:

    ```bash
    docker compose up -d
    ```

2. Open Grafana at http://localhost:3000
3. The Korvet dashboard loads automatically (no login required)

### Dashboard Features

The pre-built Grafana dashboard visualizes:

- **Message Rates**: Real-time produce/fetch rates using `irate()` for instant metrics
- **Latency Percentiles**: P50, P95, P99 for produce and fetch operations
- **Throughput**: Ingress and egress bytes/sec
- **Redis Metrics**: Command rates, latency percentiles (when `korvet.redis.metrics.enabled=true`)
- **JVM Metrics**: Heap memory, GC pauses, thread count
- **System Metrics**: CPU usage, load average, disk space

The dashboard defaults to a 5-minute time range with 5-second auto-refresh for real-time monitoring.

### Standalone Setup

For production deployments, see the [observability README](https://github.com/redis-field-engineering/korvet-dist/tree/main/samples/observability/README.adoc) for:

- Prometheus configuration examples
- Grafana datasource and dashboard provisioning
- Customizing the dashboard

## Alerting

Set up alerts for:

### Korvet-Specific Alerts

- **High produce latency**: p99 > 100ms
- **High fetch latency**: p99 > 50ms
- **Broker request error spike**: `result=error` share of `korvet.broker.request` > 1% of requests
- **Redis pool contention**: sustained `korvet.storage.local.pool.pending` growth or `korvet.storage.local.pool.acquire{result="timeout"}` rate
- **No produce activity**: No messages produced in 5 minutes (if expected)

### System Alerts

- **Memory pressure**: JVM heap > 80%
- **High GC activity**: Frequent or long GC pauses
- **High CPU usage**: Process CPU > 80%

## Logging

See [Logging]({{< relref "/integrate/korvet/operations/logging" >}}) for log-based monitoring.

## Next Steps

- [Logging]({{< relref "/integrate/korvet/operations/logging" >}})
- [Troubleshooting]({{< relref "/integrate/korvet/operations/troubleshooting" >}})
- [Metrics Reference]({{< relref "/integrate/korvet/reference/metrics" >}})
- [Metrics Contract]({{< relref "/integrate/korvet/reference/metrics/contracts" >}})
