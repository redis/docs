---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- oss
- kubernetes
- clients
description: Monitor your client's activity for optimization and debugging.
linkTitle: Observability
title: Observability
weight: 75
---

`node-redis` has built-in support for [OpenTelemetry](https://opentelemetry.io/) (OTel)
instrumentation to collect metrics. This can be very helpful for
diagnosing problems and improving the performance and connection resiliency of
your application. See the
[Observability overview]({{< relref "/develop/clients/observability" >}})
for an introduction to Redis client observability and a reference guide for the
available metrics.

This page explains how to enable and use OTel instrumentation
in `node-redis` using an example configuration for a local [Grafana](https://grafana.com/)
instance. See our
[observability demonstration repository](https://github.com/redis-developer/redis-client-observability)
on GitHub to learn how to set up a suitable Grafana dashboard.

## Installation

Install the OTel dependencies with the following commands:

```bash
npm install @opentelemetry/api
npm install @opentelemetry/sdk-metrics
```

## Import

Start by importing the required OTel and Redis modules:

{{< clients-example set="observability" step="import" lang_filter="Node.js" description="Foundational: Import required libraries for Redis observability, OpenTelemetry metrics, and Redis operations" difficulty="beginner" >}}
{{< /clients-example >}}

## Configure the meter provider

Otel uses a [Meter provider](https://opentelemetry.io/docs/concepts/signals/metrics/#meter-provider)
to create the objects that collect the metric information. The example below
configures a meter provider to export metrics to a local Grafana instance
every 10 seconds, but see the [OpenTelemetry Node.js docs](https://opentelemetry.io/docs/languages/node/)
to learn more about other export options.

{{< clients-example set="observability" step="setup_meter_provider" lang_filter="Node.js" description="Foundational: Configure a meter provider to export metrics to a local Grafana instance every 10 seconds" difficulty="beginner" >}}
{{< /clients-example >}}

## Configure the Redis client

You configure the client library for OTel only once per application. This will
enable OTel for all Redis connections you create. The example below shows the
options you can pass to the observability instance via the `MetricConfig` object
during initialization.

{{< clients-example set="observability" step="client_config" lang_filter="Node.js" description="Foundational: Configure Redis observability with a list of metric groups and optional command filtering and privacy controls" difficulty="beginner" >}}
{{< /clients-example >}}

The available options for `MetricConfig` are described in the table below:

| Property | Default | Description |
| -------- | ------- | ----------- |
| `enabled` | `false` | Set this to `true` explicitly to enable metrics. |
| `meterProvider` |  | Uses this provider instead of the global provider from `@opentelemetry/api`. |
| `includeCommands` | `[]` | List of Redis commands to track. If set, only these commands will be tracked. Note that you should use the Redis command name rather than the node-redis method name where the two differ. |
| `excludeCommands` | `[]` | List of Redis commands to exclude from tracking. If set, all commands except these will be tracked. Note that you should use the Redis command name rather than the node-redis method name where the two differ. |
| `enabledMetricGroups` | `['connection-basic', 'resiliency']` | List of metric groups to enable. By default, only `connection-basic` and `resiliency` are enabled. See [Redis metric groups]({{< relref "/develop/clients/observability#redis-metric-groups" >}}) for a list of available groups. |
| `hidePubSubChannelNames` | `false` | If true, channel names in pub/sub metrics will be hidden. |
| `hideStreamNames` | `false` | If true, stream names in streaming metrics will be hidden. |
| `bucketsOperationDuration` | `[0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10]` | List of bucket boundaries for the [`operation.duration`]({{< relref "/develop/clients/observability/#metric-db.client.operation.duration" >}}) histogram (see [Custom histogram buckets](#custom-histogram-buckets) below). |
| `bucketsConnectionCreateTime` | `[0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10]` | List of bucket boundaries for the [`connection.create_time`]({{< relref "/develop/clients/observability/#metric-db.client.connection.create_time" >}}) histogram (see [Custom histogram buckets](#custom-histogram-buckets) below). |
| `bucketsConnectionWaitTime` | `[0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10]` | List of bucket boundaries for the [`connection.wait_time`]({{< relref "/develop/clients/observability/#metric-db.client.connection.wait_time" >}}) histogram (see [Custom histogram buckets](#custom-histogram-buckets) below). |
| `bucketsStreamProcessingDuration` | `[0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10]` | List of bucket boundaries for the [`stream.lag`]({{< relref "/develop/clients/observability/#metric-redis.client.stream.lag" >}}) histogram (see [Custom histogram buckets](#custom-histogram-buckets) below). |

### Custom histogram buckets

For the histogram metrics, a reasonable default set of buckets is defined, but
you can customize the bucket boundaries to suit your needs (the buckets are the
ranges of data values counted for each bar of the histogram). Pass an increasing
list of float values to the `bucketsXxx` options when you create the `MetricConfig`
object. The first and last values in the list are the lower and upper bounds of the
histogram, respectively, and the values in between define the bucket boundaries.

## Use Redis

Once you have configured the client, all Redis connections you create will be
automatically instrumented and the collected metrics will be exported to your
configured destination.

The example below shows the simplest Redis connection and a few commands,
but see the
[observability demonstration repository](https://github.com/redis-developer/redis-client-observability)
for an example that calls a variety of commands in a more realistic way.

{{< clients-example set="observability" step="use_redis" lang_filter="Node.js" description="Foundational: Use Redis with automatic instrumentation" difficulty="beginner" >}}
{{< /clients-example >}}

## Shutdown

When your application exits, you should call the `shutdown()` method to ensure
that all pending metrics are exported.

{{< clients-example set="observability" step="shutdown" lang_filter="Node.js" description="Foundational: Shutdown Redis observability" difficulty="beginner" >}}
{{< /clients-example >}}
