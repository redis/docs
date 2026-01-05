---
Title: Prometheus metrics v2
alwaysopen: false
categories:
- docs
- integrate
- rs
description: V2 metrics available to Prometheus as of Redis Enterprise Software version 7.8.2.
group: observability
linkTitle: Prometheus metrics v2
summary: V2 metrics available to Prometheus as of Redis Enterprise Software version 7.8.2.
type: integration
weight: 50
tocEmbedHeaders: true
---

You can integrate Redis Enterprise Software with Prometheus and tools such as [Grafana]({{<relref "/integrate/prometheus-with-redis-enterprise">}}), [Datadog]({{<relref "/integrate/datadog-with-redis-enterprise">}}), [Dynatrace]({{<relref "/integrate/dynatrace-with-redis-enterprise">}}), or [New Relic]({{<relref "/integrate/new-relic-with-redis-enterprise">}}) to create dashboards for important metrics.

The v2 metrics in the following tables are available as of Redis Enterprise Software version 7.8.0. For help transitioning from v1 metrics to v2 PromQL, see [Prometheus v1 metrics and equivalent v2 PromQL]({{<relref "/operate/rs/references/metrics/prometheus-metrics-v1-to-v2">}}).

The v2 scraping endpoint also exposes metrics for `node_exporter` version 1.8.1. For more information, see the [Prometheus node_exporter GitHub repository](https://github.com/prometheus/node_exporter).

{{<embed-md "rs-prometheus-metrics-v2.md">}}
