---
Title: Data type handling
aliases: /integrate/redis-data-integration/ingest/data-pipelines/data-type-handling/
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Learn how relational data types are converted to Redis data types
group: di
linkTitle: Data type handling
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 20
---

RDI automatically converts data that has a Debezium JSON schema into Redis types.
Some Debezium types require special conversion. For example:

- Date and Time types are converted to epoch time.
- Decimal numeric types are converted to strings so your app can use them
  without losing precision.

The following Debezium logical types are supported:

- double
- float
- io.debezium.data.Bits
- io.debezium.data.Json
- io.debezium.data.VariableScaleDecimal
- io.debezium.time.Date
- io.debezium.time.NanoTime
- io.debezium.time.NanoTimestamp
- io.debezium.time.MicroTime
- io.debezium.time.MicroTimestamp
- io.debezium.time.ZonedTime
- io.debezium.time.ZonedTimestamp
- org.apache.kafka.connect.data.Date
- org.apache.kafka.connect.data.Decimal
- org.apache.kafka.connect.data.Time

These types are **not** supported and will return "Unsupported Error":

- io.debezium.time.interval

All other values are treated as plain strings.
