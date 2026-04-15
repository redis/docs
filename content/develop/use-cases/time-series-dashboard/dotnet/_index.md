---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Build a Redis-backed rolling sensor graph demo in .NET with StackExchange.Redis
linkTitle: .NET dashboard
title: Rolling sensor graph demo with Redis and .NET
weight: 5
---

This guide shows you how to build a compact rolling sensor graph demo in .NET with [`StackExchange.Redis`]({{< relref "/develop/clients/dotnet" >}}) and Redis time series support. The example simulates three power sensors, ingests readings into Redis, and serves a local browser dashboard that updates in real time.

## Overview

Time series are a natural fit for telemetry, monitoring, and IoT-style workloads. In this example, Redis stores a stream of timestamped readings from three simulated power sensors.

The demo is designed to make a few ideas easy to see:

* Raw readings arrive every 500ms
* Each graph shows only the most recent 12 seconds
* Older samples disappear because the time series retention is short
* 3-second buckets summarize the same readings with minimum, maximum, and average values
* The bucket summaries are drawn under the same moving time scale as the graph

## How it works

The example has three main parts:

1. A `SensorSimulator` generates realistic-looking power readings with drift and occasional spikes
2. A `RedisTimeSeriesStore` creates the time series keys and issues Redis TimeSeries queries
3. A small local HTTP server built with ASP.NET Core minimal APIs renders three stacked combined graph-and-bucket views and polls a JSON snapshot endpoint

Each sensor is stored in its own time series with labels such as `sensor_type`, `sensor_id`, `zone`, and `unit`. The dashboard then uses [`TS.MADD`]({{< relref "/commands/ts.madd" >}}) to ingest new readings and [`TS.RANGE`]({{< relref "/commands/ts.range" >}}) to query both raw samples and aggregated bucket summaries. The aggregate queries use aligned buckets so the bucket boundaries stay stable as the visible window moves.

## The .NET files

The implementation is split across three small files:

* [`SensorSimulator.cs`](SensorSimulator.cs) - Sensor definitions and sample generation
* [`RedisTimeSeriesStore.cs`](RedisTimeSeriesStore.cs) - Redis TimeSeries command helpers
* [`Program.cs`](Program.cs) - Local HTTP server and inline dashboard UI

The Redis helper issues time series commands with `IDatabase.ExecuteAsync(...)`, which keeps the example small while still making the Redis command flow explicit.

## Data model

Series keys use this pattern:

```text
ts:sensor:power_consumption:{sensor_id}
```

For example:

```text
ts:sensor:power_consumption:power-1
ts:sensor:power_consumption:power-2
ts:sensor:power_consumption:power-3
```

Each time series has labels similar to:

```text
site = demo
sensor_type = power_consumption
sensor_id = power-1
zone = north
unit = watts
```

The demo uses a 12-second retention period so the graphs visibly slide forward as old samples expire. The setup is also idempotent, so you can stop and restart the demo without first cleaning up the time series keys.

## Redis commands used

The implementation uses these time series commands directly through StackExchange.Redis:

* [`TS.CREATE`]({{< relref "/commands/ts.create" >}}) - Create one time series per sensor with retention and labels
* [`TS.MADD`]({{< relref "/commands/ts.madd" >}}) - Batch-ingest readings from all three sensors every 500ms
* [`TS.GET`]({{< relref "/commands/ts.get" >}}) - Fetch the latest reading for a sensor
* [`TS.RANGE`]({{< relref "/commands/ts.range" >}}) - Read raw recent samples and aggregated 3-second buckets
* `ALIGN 0` with `TS.RANGE ... AGGREGATION` - Keep bucket boundaries stable as the visible window moves

## Prerequisites

Before running the demo, make sure that:

* Redis is running and accessible. By default, the demo connects to `localhost:6379`.
* Your Redis deployment includes time series support.
* The StackExchange.Redis package is available:

```bash
dotnet add package StackExchange.Redis
```

## Running the demo

Start the dashboard server:

```bash
dotnet run
```

The server accepts optional flags if your Redis instance is not on the default host and port:

```bash
dotnet run -- --redis-host 127.0.0.1 --redis-port 6379 --port 8080
```

After starting the server, visit `http://localhost:8080`.

The dashboard polls a JSON snapshot endpoint several times per second to show:

* Three stacked rolling graphs of raw sensor readings
* A bucket summary strip aligned to the same time axis as each graph
* Minimum, maximum, and average values for each visible bucket
* A moving 12-second window where old samples disappear as retention expires them

Because the graph and the bucket summary share the same moving time scale, you can see how raw samples relate to their aggregate bucket without switching views or interpreting a separate table.

## What to look for

As you watch the dashboard, pay attention to how the Redis query patterns map to the UI:

* New points arrive every 500ms through `TS.MADD`
* The graphs show raw values returned by `TS.RANGE`
* The bucket summaries use `TS.RANGE ... ALIGN 0 AGGREGATION min|max|avg 3000`
* The left edge of the graph keeps advancing because the time series retention is short
* The bucket boundaries stay fixed even while the visible window moves
* The dashboard remains safe to rerun because series creation is idempotent

## Why this shape works well

This demo intentionally uses only three sensors and a very short time horizon. That keeps the visualization small enough to understand at a glance while still demonstrating:

* Repeated high-frequency ingest
* Querying recent raw history
* Aggregating into fixed time buckets
* Short retention and visible expiration

For a first time series example, this is often easier to understand than a larger dashboard with many metrics, filters, or tables.

## Production considerations

This example intentionally keeps the server and UI small so the Redis behavior is easy to follow. In production, you would usually want to add:

* Authentication and authorization
* Separate static assets instead of inline HTML
* Better error reporting and health checks
* Deployment-specific retention, window sizes, and aggregation intervals
* Stronger key namespacing if multiple applications share the same Redis deployment

## Learn more

* [.NET client guide]({{< relref "/develop/clients/dotnet" >}}) - Install and use the .NET client
* [Time series overview]({{< relref "/develop/data-types/timeseries" >}}) - Time series concepts and commands
* [TS.RANGE command]({{< relref "/commands/ts.range" >}}) - Query raw and aggregated ranges from a time series
* [TS.MADD command]({{< relref "/commands/ts.madd" >}}) - Add multiple samples in one call
* [TS.CREATE command]({{< relref "/commands/ts.create" >}}) - Create a time series with labels and retention
