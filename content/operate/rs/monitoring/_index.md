---
Title: Monitoring with metrics and alerts
alwaysopen: false
categories:
- docs
- operate
- rs
- kubernetes
description: Use the metrics that measure the performance of your Redis Enterprise Software clusters, nodes, databases, and shards to track the performance of your databases.
hideListLinks: true
linkTitle: Monitoring
weight: 70
aliases: /operate/rs/clusters/monitoring/
---

You can use the metrics that measure the performance of your Redis Enterprise Software clusters, nodes, databases, and shards
to monitor the performance of your databases.

## View metrics and configure alerts

In the Redis Enterprise Cluster Manager UI, you can view metrics, configure alerts, and send notifications based on alert parameters. You can also access metrics and configure alerts through the REST API.

See [Metrics and alerts for monitoring v1]({{<relref "/operate/rs/monitoring/v1_monitoring">}}) for more information.

## Metrics stream engine

The new metrics stream engine is generally available as of [Redis Enterprise Software version 7.22]({{<relref "/operate/rs/release-notes/rs-7-22-releases">}}). This new engine exposes the v2 Prometheus scraping endpoint at `https://<IP>:8070/v2`, exports all time-series metrics to external monitoring tools, and enables real-time monitoring.

See [Metrics stream engine for monitoring v2]({{<relref "/operate/rs/monitoring/metrics_stream_engine">}}) for more information.

## Integrate with external monitoring tools

To integrate Redis Enterprise metrics into your monitoring environment, see the integration guides for [Prometheus and Grafana]({{< relref "/operate/rs/monitoring/prometheus_and_grafana" >}}).

Filter [Libraries and tools]({{<relref "/integrate">}}) by "observability" for additional tools and guides.

## Metrics reference

Make sure you read the [definition of each metric]({{< relref "/operate/rs/references/metrics/" >}})
so that you understand exactly what it represents.
