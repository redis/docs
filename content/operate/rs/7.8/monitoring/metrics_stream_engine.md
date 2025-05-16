---
Title: Metrics stream engine preview for monitoring v2
alwaysopen: false
categories:
- docs
- operate
- rs
- kubernetes
description: Preview the new metrics stream engine for monitoring Redis Enterprise Software.
hideListLinks: true
linkTitle: Metrics stream engine preview for monitoring v2
weight: 60
url: '/operate/rs/7.8/monitoring/metrics_stream_engine/'
---

A preview of the new metrics stream engine is available as of Redis Enterprise Software version 7.8.2.

The new metrics stream engine:

- Exposes the v2 Prometheus scraping endpoint at `https://<IP>:8070/v2`.

- Exports all time-series metrics to external monitoring tools such as Grafana, DataDog, NewRelic, and Dynatrace using Prometheus.

- Enables real-time monitoring, including full monitoring during maintenance operations, which provides full visibility into performance during events such as shards' failovers and scaling operations.

## Integrate with external monitoring tools

To integrate Redis Enterprise metrics into your monitoring environment, see the integration guides for [Prometheus and Grafana]({{< relref "/operate/rs/7.8/monitoring/prometheus_and_grafana" >}}).

Filter [Libraries and tools]({{<relref "/integrate">}}) by "observability" for additional tools and guides.

## Prometheus metrics v2

For a list of all available v2 metrics, see [Prometheus metrics v2]({{<relref "/operate/rs/7.8/references/metrics/prometheus-metrics-v2">}}).

The v2 scraping endpoint also exposes metrics for `node_exporter` version 1.8.1. For more information, see the [Prometheus node_exporter GitHub repository](https://github.com/prometheus/node_exporter).

## Transition from Prometheus v1 to Prometheus v2

If you are already using the existing scraping endpoint for integration, follow [this guide]({{<relref "/operate/rs/7.8/references/metrics/prometheus-metrics-v1-to-v2">}}) to transition and try the new engine. It is possible to scrape both existing and new endpoints simultaneously, allowing advanced dashboard preparation and a smooth transition.
