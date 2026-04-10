---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Build a Redis-backed rolling sensor graph demo in Python with redis-py
linkTitle: redis-py dashboard
title: Rolling sensor graph demo with Redis and redis-py
weight: 1
---

This guide shows you how to build a compact rolling sensor graph demo in Python with [`redis-py`]({{< relref "/develop/clients/redis-py" >}}) and Redis time series support. The example simulates three power sensors, ingests readings into Redis, and serves a local browser dashboard that updates in real time.

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
<<<<<<< HEAD
2. A `RedisTimeSeriesStore` creates the time series keys and issues Redis TimeSeries queries
3. A small local HTTP server renders three stacked combined graph-and-bucket views and polls a JSON snapshot endpoint
=======
2. A `RedisTimeSeriesStore` creates the time series keys and issues Redis time series queries
3. A small local HTTP server renders three stacked graphs and polls a JSON snapshot endpoint
>>>>>>> eb9ab9c049be896ff47efd2192dcc0ad43b3e15e

Each sensor is stored in its own time series with labels such as `sensor_type`, `sensor_id`, `zone`, and `unit`. The dashboard then uses [`TS.MADD`]({{< relref "/commands/ts.madd" >}}) to ingest new readings and [`TS.RANGE`]({{< relref "/commands/ts.range" >}}) to query both raw samples and aggregated bucket summaries. The aggregate queries use aligned buckets so the bucket boundaries stay stable as the visible window moves.

## Data model

Time series keys use this pattern:

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

The implementation uses these time series commands directly through `redis-py`'s generic command interface:

* [`TS.CREATE`]({{< relref "/commands/ts.create" >}}) - Create one time series per sensor with retention and labels
* [`TS.MADD`]({{< relref "/commands/ts.madd" >}}) - Batch-ingest readings from all three sensors every 500ms
* [`TS.GET`]({{< relref "/commands/ts.get" >}}) - Fetch the latest reading for a sensor
* [`TS.RANGE`]({{< relref "/commands/ts.range" >}}) - Read raw recent samples and aggregated 3-second buckets
* `ALIGN 0` with `TS.RANGE ... AGGREGATION` - Keep bucket boundaries stable as the visible window moves

## Prerequisites

Before running the demo, make sure that:

* Redis is running and accessible. By default, the demo connects to `localhost:6379`.
* Your Redis deployment includes time series support.
* The `redis` Python package is installed:

```bash
pip install redis
```

## Running the demo

Start the dashboard server:

```bash
python dashboard.py
```

The server accepts optional flags if your Redis instance is not on the default host and port:

```bash
python dashboard.py --redis-host 127.0.0.1 --redis-port 6379 --port 8080
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
* Persistent frontend assets instead of inline HTML
* Better error reporting and health checks
* Deployment-specific retention, window sizes, and aggregation intervals
* Stronger key namespacing if multiple applications share the same Redis deployment

## Learn more

* [redis-py guide]({{< relref "/develop/clients/redis-py" >}}) - Install and use the Python client
* [Time series overview]({{< relref "/develop/data-types/timeseries" >}}) - Time series concepts and commands
* [TS.RANGE command]({{< relref "/commands/ts.range" >}}) - Query raw and aggregated ranges from a time series
* [TS.MADD command]({{< relref "/commands/ts.madd" >}}) - Add multiple samples in one call
* [TS.CREATE command]({{< relref "/commands/ts.create" >}}) - Create a time series with labels and retention
