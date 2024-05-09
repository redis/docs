---
Title: Observability
aliases: null
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Learn how to monitor RDI ingest
group: di
hideListLinks: false
linkTitle: Installation
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 2
---

## Pipeline metrics

RDI reports metrics about the collector and the stream processor tasks.
These metrics can be consumed via [prometheus exporters](https://prometheus.io/docs/instrumenting/exporters/) endpoints.
RDI exposes two endpoints:

- The Collector endpoint:
- The Stream Processor endpoint: 

### Collector metrics

These metrics are divided into 3 groups:

- Pipeline's state: metrics about the pipeline mode and connectivity
- Data flow counters: counters for data breakdown per source table
- Processing performance: processing speed of RDI micro batches
  
### Stream Processor metrics

These metrics are divided into 2 groups:

- Snapshot metrics: metrics about data captured and processed during the snapshot phase and the performance of processing it inside the collector.
- Streaming metrics: metrics about data captured and performance of the CDC mode.

### Viewing RDI metrics

For users that use Prometheus and Grafana, there are Grafana dashboards bundled with RDI installation to use:

- Stream processor dashboard
- Collector dashboard

Users that don't use Prometheus can get RDI metrics in 2 ways:

- Using Redis Insight RDI monitoring screen
- Using RDI CLI status command 

## RDI logs

RDI logs are located at `/opt/rdi/logs` on each RDI VM.
RDI has a log for each of its components.
RDI takes care of log rotation.
The default log level is `INFO`. You can change this level by

## Support package

In case you need to send a comprehensive forensics set to Redis support, please run the support package command:

The support package includes:
