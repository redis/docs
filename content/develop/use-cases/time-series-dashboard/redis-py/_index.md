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

This guide shows you how to build a small rolling sensor graph demo in Python with [`redis-py`]({{< relref "/develop/clients/redis-py" >}}) and Redis time series support. The example simulates three power sensors, ingests readings into Redis, and serves a local browser dashboard that updates in real time.

## Overview

Time series are a natural fit for telemetry, monitoring, and IoT-style workloads. In this example, Redis stores a stream of timestamped readings from three simulated power sensors.

The dashboard focuses on a few ideas that are easy to see:

* Raw readings arrive every 500ms
* Each graph shows only the most recent 12 seconds
* Older samples disappear because the time series retention is short
* 3-second buckets summarize the same readings with minimum, maximum, and average values

## How it works

The example has three main parts:

1. A `SensorSimulator` generates realistic-looking power readings with drift and occasional spikes
2. A `RedisTimeSeriesStore` creates the time series keys and issues Redis time series queries
3. A small local HTTP server renders three stacked graphs and polls a JSON snapshot endpoint

Each sensor is stored in its own time series with labels such as `sensor_type`, `sensor_id`, `zone`, and `unit`. The dashboard then uses [`TS.MADD`]({{< relref "/commands/ts.madd" >}}) to ingest new readings and [`TS.RANGE`]({{< relref "/commands/ts.range" >}}) to query both raw samples and aggregated bucket summaries.

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

The demo uses a 12-second retention period so the graphs visibly slide forward as old samples expire.

## Redis commands used

The implementation uses these time series commands directly through `redis-py`'s generic command interface:

* [`TS.CREATE`]({{< relref "/commands/ts.create" >}}) - Create one time series per sensor with retention and labels
* [`TS.MADD`]({{< relref "/commands/ts.madd" >}}) - Batch-ingest readings from all three sensors every 500ms
* [`TS.GET`]({{< relref "/commands/ts.get" >}}) - Fetch the latest reading for a sensor
* [`TS.RANGE`]({{< relref "/commands/ts.range" >}}) - Read raw recent samples and aggregated 3-second buckets

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
* 3-second buckets underneath each graph
* Minimum, maximum, and average values for each bucket
* A moving 12-second window where old samples disappear as retention expires them

## What to look for

As you watch the dashboard, pay attention to how the Redis query patterns map to the UI:

* New points arrive every 500ms through `TS.MADD`
* The graphs show raw values returned by `TS.RANGE`
* The buckets under each graph use `TS.RANGE ... AGGREGATION min|max|avg 3000`
* The left edge of the graph keeps advancing because the time series retention is short

## Production considerations

This example intentionally keeps the server and UI small so the Redis behavior is easy to follow. In production, you would usually want to add:

* Authentication and authorization
* Persistent frontend assets instead of inline HTML
* Better error reporting and health checks
* Deployment-specific retention and window sizes
* Stronger key namespacing if multiple applications share the same Redis deployment

## Learn more

* [redis-py guide]({{< relref "/develop/clients/redis-py" >}}) - Install and use the Python client
* [Time series overview]({{< relref "/develop/data-types/timeseries" >}}) - Time series concepts and commands
* [TS.RANGE command]({{< relref "/commands/ts.range" >}}) - Query raw and aggregated ranges from a time series
* [TS.MADD command]({{< relref "/commands/ts.madd" >}}) - Add multiple samples in one call
