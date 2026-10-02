---
Title: Lettuce Redis Client Metrics
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: Korvet can optionally enable Lettuce command latency metrics to track
  Redis operation performance.
linkTitle: Redis Client
weight: 70
---

Korvet can optionally enable Lettuce command latency metrics to track Redis operation performance.

{{< note >}}
These metrics are disabled by default. Enable them by setting `korvet.redis.metrics.enabled=true` in your configuration.
{{< /note >}}

| Metric | Description | Tags |
|---|---|---|
| `lettuce.command.firstresponse` | Time to first response from Redis (timer) | `command`, `local`, `remote` |
| `lettuce.command.completion` | Time to complete Redis command (timer) | `command`, `local`, `remote` |

**Configuration**:

```yaml
korvet:
  redis:
    metrics:
      enabled: true
      histogram: false
      local-distinction: false
      max-latency: 5m
      min-latency: 1ms
```

**Configuration Properties**:

- `enabled` (boolean, default: `false`): Enable Lettuce command latency metrics
- `histogram` (boolean, default: `false`): Enable histogram buckets for aggregable percentile approximations
- `local-distinction` (boolean, default: `false`): Track metrics per connection instead of per host/port
- `max-latency` (duration, default: `5m`): Maximum expected latency for histogram buckets
- `min-latency` (duration, default: `1ms`): Minimum expected latency for histogram buckets
