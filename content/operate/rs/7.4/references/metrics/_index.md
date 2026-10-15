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
url: '/operate/rs/7.4/references/metrics/'
---

In the Redis Enterprise Cluster Manager UI, you can see real-time performance metrics for clusters, nodes, databases, and shards, and configure alerts that send notifications based on alert parameters. Select the **Metrics** tab to view the metrics for each component. For more information, see [Monitoring with metrics and alerts](/content/operate/rs/7.4/clusters/monitoring/_index.md).

See the following topics for metrics definitions:
- [Database operations](/content/operate/rs/7.4/references/metrics/database-operations.md) for database metrics
- [Resource usage](/content/operate/rs/7.4/references/metrics/resource-usage.md) for resource and database usage metrics
- [Auto Tiering](/content/operate/rs/7.4/references/metrics/auto-tiering.md) for additional metrics for [Auto Tiering ](/content/operate/rs/7.4/databases/auto-tiering/_index.md) databases

## Prometheus metrics

To collect and display metrics data from your databases and other cluster components,
you can connect your [Prometheus](https://prometheus.io/) and [Grafana](https://grafana.com/) server to your Redis Enterprise Software cluster. See [Metrics in Prometheus](/content/integrate/prometheus-with-redis-enterprise/prometheus-metrics-definitions.md) for a list of available metrics.

We recommend you use Prometheus and Grafana to view metrics history and trends.

See [Prometheus integration](/content/integrate/prometheus-with-redis-enterprise/_index.md) to learn how to connect Prometheus and Grafana to your Redis Enterprise database.

## Limitations

### Shard limit

Metrics information is not shown for clusters with more than 128 shards. For large clusters, we recommend you use [Prometheus and Grafana](/content/integrate/prometheus-with-redis-enterprise/_index.md) to view metrics.

### Metrics not shown during shard migration

The following metrics are not measured during [shard migration](/content/operate/rs/7.4/databases/configure/replica-ha.md). If you view these metrics while resharding, the graph will be blank.

- [Evicted objects/sec](/content/operate/rs/7.4/references/metrics/database-operations.md#evicted-objectssec)
- [Expired objects/sec](/content/operate/rs/7.4/references/metrics/database-operations.md#expired-objectssec)
- [Read misses/sec](/content/operate/rs/7.4/references/metrics/database-operations.md#read-missessec)
- [Write misses/sec](/content/operate/rs/7.4/references/metrics/database-operations.md#write-missessec)
- [Total keys](/content/operate/rs/7.4/references/metrics/database-operations.md#total-keys)
- [Incoming traffic](/content/operate/rs/7.4/references/metrics/resource-usage.md#incoming-traffic)
- [Outgoing traffic](/content/operate/rs/7.4/references/metrics/resource-usage.md#outgoing-traffic)
- [Used memory](/content/operate/rs/7.4/references/metrics/resource-usage.md#used-memory)
