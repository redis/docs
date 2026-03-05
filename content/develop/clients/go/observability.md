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

`go-redis` has built-in support for [OpenTelemetry](https://opentelemetry.io/) (OTel)
instrumentation to collect traces and metrics. This can be very helpful for
diagnosing problems and improving the performance and connection resiliency of
your application. See the
[Observability overview]({{< relref "/develop/clients/observability" >}})
for an introduction to Redis client observability and a reference guide for the
available metrics.

This page explains how to enable and use OTel instrumentation
in `go-redis` using an example configuration for a local [Grafana](https://grafana.com/)
instance. See our
[observability demonstration repository](https://github.com/redis-developer/redis-client-observability)
on GitHub to learn how to set up a suitable Grafana dashboard.

## Installation

Install OTel support for `go-redis` with the following commands:

```bash
go get github.com/redis/go-redis/extra/redisotel-native/v9
go get go.opentelemetry.io/otel
```

## Import

Start by importing the required OTel and Redis modules:

{{< clients-example set="observability" step="import" lang_filter="Go" description="Foundational: Import required libraries for Redis observability, OpenTelemetry metrics, and Redis operations" difficulty="beginner" >}}
{{< /clients-example >}}

## Configure the meter provider

Otel uses a [Meter provider](https://opentelemetry.io/docs/concepts/signals/metrics/#meter-provider)
to create the objects that collect the metric information. The example below
configures a meter provider to export metrics to a local Grafana instance
every 10 seconds, but see the [OpenTelemetry Go docs](https://opentelemetry.io/docs/languages/go/)
to learn more about other export options.

{{< clients-example set="observability" step="setup_meter_provider" lang_filter="Go" description="Foundational: Configure a meter provider to export metrics to a local Grafana instance every 10 seconds" difficulty="beginner" >}}
{{< /clients-example >}}

## Configure the Redis client

You configure the client library for OTel only once per application. This will
enable OTel for all Redis connections you create. The example below shows the
options you can pass to the observability instance via the `redisotel.Config` object
during initialization.

{{< clients-example set="observability" step="client_config" lang_filter="Go" description="Foundational: Configure Redis observability with a list of metric groups and optional command filtering and privacy controls" difficulty="beginner" >}}
{{< /clients-example >}}

The available option methods for `redisotel.Config` are described in the table below.

| Method | Type | Description |
| --- | --- | --- |
| `WithEnabled` | `bool` | Enable or disable OTel instrumentation. Default is `false`, so you must enable it explicitly. |
| `WithMetricGroups` | `MetricGroupFlag` | Bitmap of metric groups to enable. By default, only `MetricGroupFlagConnectionBasic` and `MetricGroupFlagResiliency` are enabled. See [Redis metric groups]({{< relref "/develop/clients/observability#redis-metric-groups" >}}) for a list of available groups. |
| `WithIncludeCommands` | `[]string` | List of Redis commands to track. If set, only these commands will be tracked. Note that you should use the Redis command name rather than the Go method name (for example `LPOP` rather than `LPopCount`). |
| `WithExcludeCommands` | `[]string` | List of Redis commands to exclude from tracking. If set, all commands except these will be tracked. Note that you should use the Redis command name rather than the Go method name (for example `LPOP` rather than `LPopCount`). |
| `WithHidePubSubChannelNames` | `bool` | If true, channel names in pub/sub metrics will be hidden. |
| `WithHideStreamNames` | `bool` | If true, stream names in streaming metrics will be hidden. |
| `WithHistogramBuckets` | `[]float64` | List of bucket boundaries for the histogram metrics. See [Custom histogram buckets](#custom-histogram-buckets) below for more information. |

### Custom histogram buckets

For the histogram metrics, a reasonable default set of buckets is defined, but
you can customize the bucket boundaries to suit your needs (the buckets are the
ranges of data values counted for each bar of the histogram). Pass an increasing
list of float values to the `WithHistogramBuckets` option when you create the `redisotel.Config`
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

{{< clients-example set="observability" step="use_redis" lang_filter="Go" description="Foundational: Use Redis with automatic instrumentation" difficulty="beginner" >}}
{{< /clients-example >}}

## Shutdown

When your application exits, you should close the Redis connection and then
you should call the `Shutdown()` method on the
`ObservabilityInstance` and `MeterProvider` instances to ensure that all pending
metrics are exported. You may find it useful to put the shutdown code in a
`defer` statement to ensure that it is called even if the main function
exits early due to an error.

{{< clients-example set="observability" step="shutdown" lang_filter="Go" description="Foundational: Shutdown Redis observability" difficulty="beginner" >}}
{{< /clients-example >}}
