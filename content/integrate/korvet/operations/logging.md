---
Title: Logging
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: Korvet uses Spring Boot's built-in structured logging support with Logback.
linkTitle: Logging
weight: 80
---

Korvet uses Spring Boot's built-in structured logging support with Logback.
Console logs can be emitted in Logstash-compatible JSON when enabled explicitly.

## Log Format

Enable structured console logging in `application.yml` with:

```yaml
logging:
  structured:
    format:
      console: logstash
```

A log line looks like this:

```json
{
  "@timestamp": "2024-01-15T10:30:45.123Z",
  "@version": "1",
  "message": "Kafka protocol server started successfully on 0.0.0.0:9092 (TLS: false)",
  "logger_name": "com.redis.korvet.broker.KorvetBroker",
  "thread_name": "main",
  "level": "INFO",
  "level_value": 20000
}
```

## Log Levels

Configure log levels via environment variables:

```bash
# Root level
export LOGGING_LEVEL_ROOT=INFO

# Korvet components (default)
export LOGGING_LEVEL_COM_REDIS_KORVET=INFO

# Spring framework
export LOGGING_LEVEL_ORG_SPRINGFRAMEWORK=WARN

# Redis client
export LOGGING_LEVEL_IO_LETTUCE=INFO
```

Or in `application.yml`:

```yaml
logging:
  structured:
    format:
      console: logstash
  level:
    root: INFO
    com.redis.korvet: INFO
    org.springframework: WARN
    io.lettuce: INFO
```

## Structured Logging

Korvet guarantees the following request-scoped MDC fields when the broker request context is available:

- **correlationId**: Kafka request correlation ID
- **clientId**: Kafka client ID
- **apiKey**: Kafka API key name
- **apiVersion**: Kafka API version

Spring Boot's Logstash formatter adds MDC key/value pairs directly to the JSON object.
Operation-specific values such as topic, partition, and offset continue to appear in message text unless a component explicitly adds them as structured key/value pairs.

## Plain Text In Tests And CLI

Test logback configurations remain plain-text for readability.
The operational CLI also keeps its normal stdout command output. Server runtime logs remain plain text unless structured JSON console logging is enabled explicitly.

## Log Aggregation

### Filebeat

Ship logs to Elasticsearch:

```yaml
filebeat.inputs:
- type: container
  paths:
    - '/var/lib/docker/containers/*/*.log'

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
```

### Fluentd

```
<source>
  @type tail
  path /var/log/korvet/*.log
  pos_file /var/log/korvet/korvet.log.pos
  tag korvet
  <parse>
    @type json
  </parse>
</source>

<match korvet>
  @type elasticsearch
  host elasticsearch
  port 9200
  index_name korvet
</match>
```

## Troubleshooting Logs

Korvet defaults to `INFO` logging. Raise specific components to `DEBUG` only while troubleshooting:

```bash
export LOGGING_LEVEL_COM_REDIS_KORVET_BROKER=DEBUG
export LOGGING_LEVEL_COM_REDIS_KORVET_STORAGE_TIERED=DEBUG
export LOGGING_LEVEL_COM_REDIS_KORVET_STORAGE_REDIS=DEBUG
export LOGGING_LEVEL_COM_REDIS_KORVET=DEBUG
```

## Runtime Log Level Changes With Actuator

For Spring Boot applications, the usual way to change logger levels without restarting the process is the Actuator `loggers` endpoint. The same approach works in Kubernetes as long as the application includes Actuator and exposes `/actuator/loggers` on the management port.

Korvet already includes `spring-boot-starter-actuator`, but the `loggers` endpoint must be exposed before you can use it remotely. Add `loggers` to `management.endpoints.web.exposure.include`:

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus,metrics,loggers
```

Update a specific logger at runtime with a `POST` request:

```json
{"configuredLevel":"DEBUG"}
```

Example:

```bash
curl -X POST http://<pod-or-service>:8080/actuator/loggers/com.redis.korvet.storage.tiered \
  -H 'Content-Type: application/json' \
  -d '{"configuredLevel":"DEBUG"}'
```

For Korvet troubleshooting, this is a good way to enable `DEBUG` only for targeted packages such as:

- `com.redis.korvet.broker`
- `com.redis.korvet.storage.tiered`
- `com.redis.korvet.storage.redis`

In Kubernetes, operators commonly use `kubectl port-forward` to reach the management port without exposing the endpoint publicly:

```bash
kubectl port-forward pod/<korvet-pod> 8080:8080
curl -X POST http://127.0.0.1:8080/actuator/loggers/com.redis.korvet.storage.redis \
  -H 'Content-Type: application/json' \
  -d '{"configuredLevel":"DEBUG"}'
```

This change is runtime-only and usually does not survive a pod restart unless you also update the application configuration. If the endpoint is not exposed, or is protected by network policy or security controls, Spring Boot will not let you change logger levels remotely.

## Next Steps

- [Monitoring]({{< relref "/integrate/korvet/operations/monitoring" >}})
- [Troubleshooting]({{< relref "/integrate/korvet/operations/troubleshooting" >}})
