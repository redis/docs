---
Title: Data type handling
aliases: null
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Describes how relational data types are converted to Redis data types
group: di
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: '1'
---

## Debezium type handling

RDI automatically converts data that has a Debezium JSON schema into Redis types.
Some Debezium types require special conversion. For example:

- Date and Time types are converted to epoch time.
- Decimal numeric types are converted to strings that can be used by applications without losing precision.

The following Debezium logical types are currently handled:

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

These types are currently **not** supported and will return "Unsupported Error":

- io.debezium.time.interval

All other values will be treated as plain String.

For more information, see [a full list of source database values conversion]({{<relref "/integrate/redis-data-integration/reference/data-types-conversion">}}).