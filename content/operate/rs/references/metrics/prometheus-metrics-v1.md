---
Title: Prometheus metrics v1
alwaysopen: false
categories:
- docs
- integrate
- rs
description: V1 metrics available to Prometheus.
group: observability
linkTitle: Prometheus metrics v1
summary: You can use Prometheus and Grafana to collect and visualize your Redis Enterprise Software metrics.
type: integration
weight: 48
tocEmbedHeaders: true
---

You can integrate Redis Enterprise Software with Prometheus and tools such as [Grafana]({{<relref "/integrate/prometheus-with-redis-enterprise">}}), [Datadog]({{<relref "/integrate/datadog-with-redis-enterprise">}}), [Dynatrace]({{<relref "/integrate/dynatrace-with-redis-enterprise">}}), or [New Relic]({{<relref "/integrate/new-relic-with-redis-enterprise">}}) to create dashboards for important metrics.

As of Redis Enterprise Software version 7.8.2, v1 metrics are deprecated but still available. For help transitioning from v1 metrics to v2 PromQL, see [Prometheus v1 metrics and equivalent v2 PromQL]({{<relref "/operate/rs/references/metrics/prometheus-metrics-v1-to-v2">}}).

{{<embed-md "rs-prometheus-metrics-v1.md">}}
