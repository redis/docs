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

`redis-py` has built-in support for [OpenTelemetry](https://opentelemetry.io/) (OTel)
instrumentation to collect metrics. This can be very helpful for
diagnosing problems and improving the performance and connection resiliency of
your application. See the
[Observability overview]({{< relref "/develop/clients/observability" >}})
for an introduction to Redis client observability and a reference guide for the
available metrics.

This page explains how to enable and use OTel instrumentation
in `redis-py` using an example configuration for a local [Grafana](https://grafana.com/)
instance. See our
[observability demonstration repository](https://github.com/redis-developer/redis-client-observability)
on GitHub to learn how to set up a suitable Grafana dashboard.

## Installation

Install OTel support for `redis-py` with the following command:

```bash
pip install redis[otel]
```

## Import

Start by importing the required OTel and Redis modules:

{{< clients-example set="observability" step="import" lang_filter="Python" description="Foundational: Import required libraries for Redis observability, OpenTelemetry metrics, and Redis operations" difficulty="beginner" >}}
{{< /clients-example >}}

## Configure the meter provider

Otel uses a [Meter provider](https://opentelemetry.io/docs/concepts/signals/metrics/#meter-provider)
to create the objects that collect the metric information. The example below
configures a meter provider to export metrics to a local Grafana instance
every 10 seconds, but see the [OpenTelemetry Python docs](https://opentelemetry.io/docs/languages/python/)
to learn more about other export options.

{{< clients-example set="observability" step="setup_meter_provider" lang_filter="Python" description="Foundational: Configure a meter provider to export metrics to a local Grafana instance every 10 seconds" difficulty="beginner" >}}
{{< /clients-example >}}

## Configure the Redis client

You configure the client library for OTel only once per application. This will
enable OTel for all Redis connections you create. The example below shows the
options you can pass to the observability instance via the `OTelConfig` object
during initialization.

{{< clients-example set="observability" step="client_config" lang_filter="Python" description="Foundational: Configure Redis observability with a list of metric groups and optional command filtering and privacy controls" difficulty="beginner" >}}
{{< /clients-example >}}

The available options for `OTelConfig` are described in the table below:

| Option | Type | Description |
| --- | --- | --- |
| `metric_groups` | `List[MetricGroup]` | List of metric groups to enable. By default, only `CONNECTION_BASIC` and `RESILIENCY` are enabled. See [Redis metric groups]({{< relref "/develop/clients/observability#redis-metric-groups" >}}) for a list of available groups. |
| `include_commands` | `List[str]` | List of Redis commands to track. If set, only these commands will be tracked. Note that you should use the Redis command name rather than the Python method name where the two differ. |
| `exclude_commands` | `List[str]` | List of Redis commands to exclude from tracking. If set, all commands except these will be tracked. Note that you should use the Redis command name rather than the Python method name where the two differ. |
| `hide_pubsub_channel_names` | `bool` | If true, channel names in pub/sub metrics will be hidden. |
| `hide_stream_names` | `bool` | If true, stream names in streaming metrics will be hidden. |
| `buckets_operation_duration` | `List[float]` | List of bucket boundaries for the [`operation.duration`]({{< relref "/develop/clients/observability/#metric-db.client.operation.duration" >}}) histogram (see [Custom histogram buckets](#custom-histogram-buckets) below). |
| `buckets_stream_processing_duration` | `List[float]` | List of bucket boundaries for the [`stream.lag`]({{< relref "/develop/clients/observability/#metric-redis.client.stream.lag" >}}) histogram (see [Custom histogram buckets](#custom-histogram-buckets) below). |
| `buckets_connection_create_time` | `List[float]` | List of bucket boundaries for the [`connection.create.time`]({{< relref "/develop/clients/observability/#metric-db.client.connection.create_time" >}}) histogram (see [Custom histogram buckets](#custom-histogram-buckets) below). |
| `buckets_connection_wait_time` | `List[float]` | List of bucket boundaries for the [`connection.wait.time`]({{< relref "/develop/clients/observability/#metric-db.client.connection.wait_time" >}}) histogram (see [Custom histogram buckets](#custom-histogram-buckets) below). |

### Custom histogram buckets

For the histogram metrics, a reasonable default set of buckets is defined, but
you can customize the bucket boundaries to suit your needs (the buckets are the
ranges of data values counted for each bar of the histogram). Pass an increasing
list of float values to the `buckets_xxx` options when you create the `OTelConfig`
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

{{< clients-example set="observability" step="use_redis" lang_filter="Python" description="Foundational: Use Redis with automatic instrumentation" difficulty="beginner" >}}
{{< /clients-example >}}

## Shutdown

When your application exits, you should call the `shutdown()` method to ensure
that all pending metrics are exported.

{{< clients-example set="observability" step="shutdown" lang_filter="Python" description="Foundational: Shutdown Redis observability" difficulty="beginner" >}}
{{< /clients-example >}}
