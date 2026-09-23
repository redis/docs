---
Title: Monitoring with metrics and alerts
alwaysopen: false
categories:
- docs
- operate
- rs
- kubernetes
description: Use the metrics that measure the performance of your Redis Software clusters, nodes, databases, and shards to track the performance of your databases.
hideListLinks: true
linkTitle: Monitoring
weight: 70
aliases: [/operate/rs/clusters/monitoring/, /operate/rs/7.4/clusters/monitoring/]
---

You can use the metrics that measure the performance of your Redis Software clusters, nodes, databases, and shards
to monitor the performance of your databases.

## View metrics and configure alerts

In the Redis Software Cluster Manager UI, you can view metrics, configure alerts, and send notifications based on alert parameters. You can also access metrics and configure alerts through the REST API.

See [Metrics and alerts for monitoring v1](/content/operate/rs/monitoring/v1_monitoring.md) for more information.

## Metrics stream engine

The new metrics stream engine is generally available as of [Redis Software version 8.0](/content/operate/rs/release-notes/rs-8-0-releases/_index.md) This new engine exposes the v2 Prometheus scraping endpoint at `https://<cluster_name>:8070/v2`, exports all time-series metrics to external monitoring tools, and enables real-time monitoring.

See [Metrics stream engine for monitoring v2](/content/operate/rs/monitoring/metrics_stream_engine/_index.md) for more information.

## Integrate with external monitoring tools

To integrate Redis Software metrics into your monitoring environment, see the following integration guides:

- [Grafana](/content/integrate/prometheus-with-redis-enterprise/_index.md)

- [Datadog](/content/integrate/datadog-with-redis-enterprise/_index.md)

- [Dynatrace](/content/integrate/dynatrace-with-redis-enterprise/_index.md)

- [New Relic](/content/integrate/new-relic-with-redis-enterprise/_index.md)

For a detailed tutorial to deploy a complete monitoring stack with Prometheus and Grafana, see [Redis Software Observability with Prometheus and Grafana](https://redis.io/learn/operate/observability/redis-software-prometheus-and-grafana).

Filter [Libraries and tools](/content/integrate/_index.md) by "observability" for additional tools and guides.

## Metrics reference

Make sure you read the [definition of each metric](/content/operate/rs/references/metrics/_index.md)
so that you understand exactly what it represents.
