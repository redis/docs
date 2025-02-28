---
Title: Metrics stream engine preview for monitoring v2
alwaysopen: false
categories:
- docs
- operate
- rs
- kubernetes
description: Use the metrics that measure the performance of your Redis Enterprise Software clusters, nodes, databases, and shards to track the performance of your databases.
hideListLinks: true
linkTitle: Metrics stream engine preview for monitoring v2
weight: 60
---

The latest approach to monitoring Redis Enterprise Software clusters, nodes, databases, and shards no longer includes the internal monitoring systems like the stats API and Cluster Manager metrics and alerts. Instead, you can use the v2 Prometheus scraping endpoint to integrate external monitoring tools such as Prometheus and Grafana

Redis Enterprise version 7.8.2 introduces a preview of the new metrics stream engine that exposes the v2  Prometheus scraping endpoint at `https://<IP>:8070/v2`.
This new engine exports all time-series metrics to external monitoring tools such as Grafana, DataDog, NewRelic, and Dynatrace using Prometheus.

The new engine enables real-time monitoring, including full monitoring during maintenance operations, providing full visibility into performance during events such as shards' failovers and scaling operations.

If you are already using the existing scraping endpoint for integration, follow [this guide]({{<relref "/integrate/prometheus-with-redis-enterprise/prometheus-metrics-v1-to-v2">}}) to transition and try the new engine. It is possible to scrape both existing and new endpoints simultaneously, allowing advanced dashboard preparation and a smooth transition.
