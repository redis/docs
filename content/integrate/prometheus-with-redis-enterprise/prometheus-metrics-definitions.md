---
Title: Prometheus metrics v2 preview
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

{{<banner-article>}}
While the metrics stream engine is in preview, this document provides only a partial list of v2 metrics. More metrics will be added.
{{</banner-article>}}

You can [integrate Redis Enterprise Software with Prometheus and Grafana]({{<relref "/integrate/prometheus-with-redis-enterprise/">}}) to create dashboards for important metrics.

The v2 metrics in the following tables are available as of Redis Enterprise Software version 7.8.0. For help transitioning from v1 metrics to v2 PromQL, see [Prometheus v1 metrics and equivalent v2 PromQL]({{<relref "/integrate/prometheus-with-redis-enterprise/prometheus-metrics-v1-to-v2">}}).

The v2 scraping endpoint also exposes metrics for `node_exporter` version 1.8.1. For more information, see the [Prometheus node_exporter GitHub repository](https://github.com/prometheus/node_exporter).

{{<embed-md "rs-prometheus-metrics-v2.md">}}
