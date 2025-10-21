---
Title: Real-time metrics
alwaysopen: false
categories:
- docs
- operate
- rs
- rc
description: Documents the metrics that are tracked with Redis Enterprise Software.
hideListLinks: true
linkTitle: Metrics
weight: $weight
---

## Cluster manager metrics

In the Redis Enterprise Cluster Manager UI, you can see real-time performance metrics for clusters, nodes, databases, and shards, and configure alerts that send notifications based on alert parameters. Select the **Metrics** tab to view the metrics for each component. For more information, see [Monitoring with metrics and alerts]({{< relref "/operate/rs/monitoring" >}}).

See the following topics for metrics definitions:
- [Database operations]({{< relref "/operate/rs/references/metrics/database-operations" >}}) for database metrics
- [Resource usage]({{< relref "/operate/rs/references/metrics/resource-usage" >}}) for resource and database usage metrics
- [Auto Tiering]({{< relref "/operate/rs/references/metrics/auto-tiering" >}}) for additional metrics for [Auto Tiering ]({{< relref "/operate/rs/databases/flash" >}}) databases

## Prometheus metrics

To collect and display metrics data from your databases and other cluster components,
you can connect your [Prometheus](https://prometheus.io/) and [Grafana](https://grafana.com/) server to your Redis Enterprise Software cluster. We recommend you use Prometheus and Grafana to view metrics history and trends.

See [Prometheus integration]({{< relref "/operate/rs/monitoring/prometheus_and_grafana" >}}) to learn how to connect Prometheus and Grafana to your Redis Enterprise database.

The new metrics stream engine that exposes the v2 Prometheus scraping endpoint at `https://<IP>:8070/v2` is generally available as of Redis Enterprise Software version 8.0.
This new engine exports all time-series metrics to external monitoring tools such as Grafana, DataDog, NewRelic, and Dynatrace using Prometheus.

The new engine enables real-time monitoring, including full monitoring during maintenance operations, providing full visibility into performance during events such as shards' failovers and scaling operations.

For a list of available metrics, see the following references:

- [Prometheus metrics v1]({{<relref "operate/rs/references/metrics/prometheus-metrics-v1">}})

- [Prometheus metrics v2]({{<relref "/operate/rs/references/metrics/prometheus-metrics-v2">}})

If you are already using the existing scraping endpoint for integration, follow [this guide]({{<relref "/operate/rs/references/metrics/prometheus-metrics-v1-to-v2">}}) to transition and try the new engine. It is possible to scrape both existing and new endpoints simultaneously, allowing advanced dashboard preparation and a smooth transition.

## Limitations

### Shard limit

Metrics information is not shown for clusters with more than 128 shards. For large clusters, we recommend you use [Prometheus and Grafana]({{< relref "/operate/rs/monitoring/prometheus_and_grafana" >}}) to view metrics.

### Metrics not shown during shard migration

The following metrics are not measured during [shard migration]({{< relref "/operate/rs/databases/configure/replica-ha" >}}) when using the [internal monitoring systems]({{<relref "/operate/rs/monitoring/v1_monitoring">}}). If you view these metrics while resharding, the graph will be blank.

- [Evicted objects/sec]({{< relref "/operate/rs/references/metrics/database-operations#evicted-objectssec" >}})
- [Expired objects/sec]({{< relref "/operate/rs/references/metrics/database-operations#expired-objectssec" >}})
- [Read misses/sec]({{< relref "/operate/rs/references/metrics/database-operations#read-missessec" >}})
- [Write misses/sec]({{< relref "/operate/rs/references/metrics/database-operations#write-missessec" >}})
- [Total keys]({{< relref "/operate/rs/references/metrics/database-operations#total-keys" >}})
- [Incoming traffic]({{< relref "/operate/rs/references/metrics/resource-usage#incoming-traffic" >}})
- [Outgoing traffic]({{< relref "/operate/rs/references/metrics/resource-usage#outgoing-traffic" >}})
- [Used memory]({{< relref "/operate/rs/references/metrics/resource-usage#used-memory" >}})

This limitation does not apply to the new [metrics stream engine]({{<relref "/operate/rs/monitoring/metrics_stream_engine">}}).
