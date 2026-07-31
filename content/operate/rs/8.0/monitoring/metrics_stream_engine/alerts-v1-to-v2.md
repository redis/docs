---
Title: Transition cluster manager alerts to Prometheus alerts
alwaysopen: false
categories:
- docs
- operate
- rs
description: Transition from internal cluster manager alerts to external monitoring alerts using Prometheus.
linkTitle: Transition cluster manager alerts to Prometheus
weight: 50
url: '/operate/rs/8.0/monitoring/metrics_stream_engine/alerts-v1-to-v2/'
---

As Redis Software transitions from the [deprecated monitoring system]({{<relref "/operate/rs/8.0/monitoring/v1_monitoring">}}) to the [new metrics stream engine]({{<relref "/operate/rs/8.0/monitoring/metrics_stream_engine">}}), some internal cluster manager alerts were deprecated in favor of external monitoring solutions.

You can use the following table to transition from the deprecated alerts and set up equivalent alerts in Prometheus with [PromQL (Prometheus Query Language)](https://prometheus.io/docs/prometheus/latest/querying/basics/):

{{<embed-md "rs-alerts-transition-plan.md">}}