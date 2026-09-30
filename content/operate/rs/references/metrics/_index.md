---
Title: Real-time metrics
alwaysopen: false
categories:
- docs
- operate
- rs
- rc
description: Documents the metrics that are tracked with Redis Software.
hideListLinks: true
linkTitle: Metrics
weight: $weight
---

## Cluster manager metrics

In the Redis Software Cluster Manager UI, you can see real-time performance metrics for clusters, nodes, databases, and shards, and configure alerts that send notifications based on alert parameters. Select the **Metrics** tab to view the metrics for each component. For more information, see [Monitoring with metrics and alerts](/content/operate/rs/monitoring/_index.md).

{{<image filename="images/rs/screenshots/metrics/db-metrics.png" alt="The database metrics page.">}}

See the following topics for metrics definitions:
- [Database operations](/content/operate/rs/references/metrics/database-operations.md) for database metrics
- [Resource usage](/content/operate/rs/references/metrics/resource-usage.md) for resource and database usage metrics
- [Auto Tiering](/content/operate/rs/references/metrics/auto-tiering.md) for additional metrics for [Auto Tiering ](/content/operate/rs/databases/flash/_index.md) databases

## Prometheus metrics

To collect and display metrics data from your databases and other cluster components,
you can connect your [Prometheus](https://prometheus.io/) and [Grafana](https://grafana.com/) server to your Redis Software cluster. We recommend you use Prometheus and Grafana to view metrics history and trends.

See [Prometheus integration](/content/operate/rs/monitoring/get-started.md) to learn how to connect Prometheus and Grafana to your Redis Software database.

The new metrics stream engine that exposes the v2 Prometheus scraping endpoint at `https://<cluster_name>:8070/v2` is generally available as of Redis Software version 8.0.
This new engine exports all time-series metrics to external monitoring tools such as Grafana, DataDog, NewRelic, and Dynatrace using Prometheus.

The new engine enables real-time monitoring, including full monitoring during maintenance operations, providing full visibility into performance during events such as shards' failovers and scaling operations.

For a list of available metrics, see the following references:

- [Prometheus metrics v1](/content/operate/rs/references/metrics/prometheus-metrics-v1.md)

- [Prometheus metrics v2](/content/operate/rs/references/metrics/prometheus-metrics-v2.md)

If you are already using the existing scraping endpoint for integration, follow [this guide](/content/operate/rs/references/metrics/prometheus-metrics-v1-to-v2.md) to transition and try the new engine. It is possible to scrape both existing and new endpoints simultaneously, allowing advanced dashboard preparation and a smooth transition.

## Limitations

### Shard limit

Metrics information is not shown for clusters with more than 128 shards. For large clusters, we recommend you use [Prometheus and Grafana](/content/operate/rs/monitoring/get-started.md) to view metrics.

### Metrics not shown during shard migration

The following metrics are not measured during [shard migration](/content/operate/rs/databases/configure/replica-ha.md) when using the [internal monitoring systems](/content/operate/rs/monitoring/v1_monitoring.md). If you view these metrics while resharding, the graph will be blank.

- [Evicted objects/sec](/content/operate/rs/references/metrics/database-operations.md#evicted-objectssec)
- [Expired objects/sec](/content/operate/rs/references/metrics/database-operations.md#expired-objectssec)
- [Read misses/sec](/content/operate/rs/references/metrics/database-operations.md#read-missessec)
- [Write misses/sec](/content/operate/rs/references/metrics/database-operations.md#write-missessec)
- [Total keys](/content/operate/rs/references/metrics/database-operations.md#total-keys)
- [Incoming traffic](/content/operate/rs/references/metrics/resource-usage.md#incoming-traffic)
- [Outgoing traffic](/content/operate/rs/references/metrics/resource-usage.md#outgoing-traffic)
- [Used memory](/content/operate/rs/references/metrics/resource-usage.md#used-memory)

This limitation does not apply to the new [metrics stream engine](/content/operate/rs/monitoring/metrics_stream_engine/_index.md).
