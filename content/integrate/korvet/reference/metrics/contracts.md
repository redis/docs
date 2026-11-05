---
Title: Tags and Families
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: The top-level metric families Korvet exports and the tag keys you can
  expect to see on them.
linkTitle: Tags and Families
weight: 10
---

This page lists the top-level metric families Korvet exports and the tag keys you can expect to see on them.

## Metric Families

Korvet-owned metric families:

- `korvet.application.*` — Running application identity (build info gauge).
- `korvet.broker.*` — Kafka API request/response, frame sizes, backpressure, auth, rebalance, and broker lifecycle.
- `korvet.storage.*` — Cross-tier storage verbs (`read`, `write`, `ack`), tagged with `tier=local|remote`; read meters also carry `mode=stream|group`.
- `korvet.storage.local.*` — Local Redis connection-pool internals.
- `korvet.storage.worker.*` — Leader-locked storage worker liveness and failures.
- `korvet.mapper.*` — Record/offset mapping internals.

Standard Micrometer JVM/system metrics and Lettuce Redis client metrics are also exported but are not Korvet-owned.

## Tag Keys You Will See

Korvet-owned metrics use only the following tag keys:

- `name`
- `version`
- `topic`
- `partition`
- `operation`
- `result`
- `error_type`
- `phase`
- `action`
- `tier`
- `compression`
- `api_key`
- `direction`
- `mode`

You can safely build dashboards and alerts around these labels.

`partition` appears only on the broker offset gauges (`korvet.broker.max_offset`,
`korvet.broker.log_start_offset`). Its cardinality is bounded by the
per-topic partition count and capped by `korvet.broker.metrics.offset-cardinality-cap`.

## Why Tag Keys Are Bare

Tag keys are bare (`topic`, not `korvet_topic`) because Korvet's deployment model does not co-locate other Prometheus exporters that emit the same generic keys against unrelated metric families. Bare keys keep dashboards portable and queries readable. If you operate Korvet alongside an exporter that emits a colliding key on unrelated metrics, apply a Prometheus `metric_relabel_configs` rule at scrape time.

## Tag Keys You Will Not See

The following dimensions are intentionally omitted to keep time-series cardinality bounded, even when they exist in the underlying request or message:

- `consumer`
- `consumer_group`
- `message_id`
- `offset`
- `partition_epoch`
- `request_id`
- `session_id`
- `stream`
- `transaction_id`
- `user_id`

If you need per-consumer or per-request visibility, use logs or traces rather than metric labels.
