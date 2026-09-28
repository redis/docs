---
Title: Granular metrics job settings object
alwaysopen: false
categories:
- docs
- operate
- rs
description: Documents the granular_metrics_job_settings object used with Redis Software REST API calls.
linkTitle: granular_metrics_job_settings
weight: $weight
---

| Name | Type/Value | Description |
|------|------------|-------------|
| cron_expression | string (default: `* * * * *`) | [CRON expression](https://en.wikipedia.org/wiki/Cron#CRON_expression) that defines how often the [granular metrics]({{< relref "/operate/rs/monitoring/metrics_stream_engine/local-metrics-storage#standard-and-granular-tiers" >}}) lifecycle check runs. The default runs it every minute. |
| enabled | boolean (default: true) | Indicates whether this job is enabled |
| granular_cleanup_delay | integer (default: 86400) | Number of seconds after granular collection stops before its data is deleted automatically |
| granular_max_duration | integer (default: 3600) | Number of seconds granular collection runs before it stops automatically |
