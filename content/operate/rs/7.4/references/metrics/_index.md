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

In the Redis Enterprise Cluster Manager UI, you can see real-time performance metrics for clusters, nodes, databases, and shards, and configure alerts that send notifications based on alert parameters. Select the **Metrics** tab to view the metrics for each component. For more information, see [Monitoring with metrics and alerts]({{< relref "/operate/rs/7.4/clusters/monitoring" >}}).

See the following topics for metrics definitions:
- [Database operations]({{< relref "/operate/rs/7.4/references/metrics/database-operations" >}}) for database metrics
- [Resource usage]({{< relref "/operate/rs/7.4/references/metrics/resource-usage" >}}) for resource and database usage metrics
- [Auto Tiering]({{< relref "/operate/rs/7.4/references/metrics/auto-tiering" >}}) for additional metrics for [Auto Tiering ]({{< relref "/operate/rs/7.4/databases/auto-tiering" >}}) databases

## Prometheus metrics

To collect and display metrics data from your databases and other cluster components,
you can connect your [Prometheus](https://prometheus.io/) and [Grafana](https://grafana.com/) server to your Redis Enterprise Software cluster. See [Metrics in Prometheus]({{< relref "/integrate/prometheus-with-redis-enterprise/prometheus-metrics-definitions" >}}) for a list of available metrics.

We recommend you use Prometheus and Grafana to view metrics history and trends.

See [Prometheus integration]({{< relref "/integrate/prometheus-with-redis-enterprise/" >}}) to learn how to connect Prometheus and Grafana to your Redis Enterprise database.

## Limitations

### Shard limit

Metrics information is not shown for clusters with more than 128 shards. For large clusters, we recommend you use [Prometheus and Grafana]({{< relref "/integrate/prometheus-with-redis-enterprise/" >}}) to view metrics.

### Metrics not shown during shard migration

The following metrics are not measured during [shard migration]({{< relref "/operate/rs/7.4/databases/configure/replica-ha" >}}). If you view these metrics while resharding, the graph will be blank.

- [Evicted objects/sec]({{< relref "/operate/rs/7.4/references/metrics/database-operations#evicted-objectssec" >}})
- [Expired objects/sec]({{< relref "/operate/rs/7.4/references/metrics/database-operations#expired-objectssec" >}})
- [Read misses/sec]({{< relref "/operate/rs/7.4/references/metrics/database-operations#read-missessec" >}})
- [Write misses/sec]({{< relref "/operate/rs/7.4/references/metrics/database-operations#write-missessec" >}})
- [Total keys]({{< relref "/operate/rs/7.4/references/metrics/database-operations#total-keys" >}})
- [Incoming traffic]({{< relref "/operate/rs/7.4/references/metrics/resource-usage#incoming-traffic" >}})
- [Outgoing traffic]({{< relref "/operate/rs/7.4/references/metrics/resource-usage#outgoing-traffic" >}})
- [Used memory]({{< relref "/operate/rs/7.4/references/metrics/resource-usage#used-memory" >}})
