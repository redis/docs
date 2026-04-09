---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Build a rolling sensor graph demo with Redis time series data
linkTitle: Time series dashboard
title: Rolling sensor graph demo with Redis
weight: 3
---

This guide family shows how to build a small rolling sensor graph demo backed by Redis time series.

## Overview

This use case simulates three sensors that continuously send readings to Redis. A small web dashboard then queries Redis to show:

* A rolling graph of raw readings for each sensor
* Fixed-width time buckets under each graph
* Bucketed minimum, maximum, and average values
* A short retention window where old samples visibly expire

This makes it a good fit for demonstrating how Redis time series support:

* High-ingest telemetry workloads
* Time-window queries
* Aggregation over fixed buckets
* Short retention periods that bound data size

## Available implementations

* [redis-py]({{< relref "/develop/use-cases/time-series-dashboard/redis-py" >}}) - Build a local Python demo with three rolling sensor graphs and bucketed summaries
