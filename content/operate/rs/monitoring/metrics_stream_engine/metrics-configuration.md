---
Title: Metrics configuration
alwaysopen: false
categories:
- docs
- integrate
- rs
description: Configure the Redis Software v2 metrics stream engine.
group: observability
linkTitle: Metrics configuration
summary: Configure cluster-wide settings for the Redis Software v2 metrics stream engine.
type: integration
weight: 48
tocEmbedHeaders: true
---

The metrics configuration is a cluster-wide resource that controls the behavior of the [v2 metrics stream engine]({{<relref "/operate/rs/monitoring/metrics_stream_engine">}}), such as which optional metrics are collected and how metrics are stored and exported.

For the full list of configuration fields, their types, and defaults, see the [metrics configuration object]({{<relref "/operate/rs/references/rest-api/objects/metrics_config">}}).

## Configure metrics settings

You can read and update the metrics configuration through the REST API or with `rladmin`.

Changes to the metrics configuration are recorded in the cluster's [event logs]({{<relref "/operate/rs/clusters/logging">}}), so you can review who changed a setting and when.

### REST API

Use the `GET` and `PUT` `/v1/metrics_config` requests to read and update the configuration. For request and response details, required permissions, and status codes, see [Metrics configuration requests]({{<relref "/operate/rs/references/rest-api/requests/metrics_config">}}).

### rladmin

Use [`rladmin info metrics`]({{<relref "/operate/rs/references/cli-utilities/rladmin/info#info-metrics">}}) to view the current configuration and [`rladmin metrics config`]({{<relref "/operate/rs/references/cli-utilities/rladmin/metrics#metrics-config">}}) to update it.
