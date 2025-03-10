---
Title: Transition from Prometheus v1 to Prometheus v2
alwaysopen: false
categories:
- docs
- integrate
- rs
description: Transition from v1 metrics to v2 PromQL equivalents.
group: observability
linkTitle: Transition from Prometheus v1 to v2
summary: Transition from v1 metrics to v2 PromQL equivalents.
type: integration
weight: 49
tocEmbedHeaders: true
---

You can [integrate Redis Enterprise Software with Prometheus and Grafana]({{<relref "/integrate/prometheus-with-redis-enterprise/">}}) to create dashboards for important metrics.

As of Redis Enterprise Software version 7.8.2, [PromQL (Prometheus Query Language)](https://prometheus.io/docs/prometheus/latest/querying/basics/) metrics are available. V1 metrics are deprecated but still available. You can use the following tables to transition from v1 metrics to equivalent v2 PromQL. For a list of all available v2 PromQL metrics, see [Prometheus metrics v2]({{<relref "/integrate/prometheus-with-redis-enterprise/prometheus-metrics-definitions">}}).

{{<embed-md "rs-prometheus-metrics-transition-plan.md">}}
