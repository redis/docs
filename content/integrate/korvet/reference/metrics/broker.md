---
Title: Broker Metrics
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: Metrics emitted by korvet-broker.
linkTitle: Broker
weight: 30
---

These metrics are emitted by `korvet-broker`.

## Metrics

### Backpressure Connections

Current number of broker connections with backpressure applied.

**Name**: `korvet.broker.backpressure.connections` \
**Type**: `gauge`

### Backpressure Transitions

Backpressure lifecycle transitions, tagged by `action=applied|released`.

**Name**: `korvet.broker.backpressure.transitions` \
**Type**: `counter`

**Tags**

| Key | Description |
|---|---|
| `action` | Backpressure action: `applied` or `released`. |

### Connections

Current number of active broker connections.

**Name**: `korvet.broker.connections` \
**Type**: `gauge`

### Failures

Number of broker failures, including lifecycle (start) and authentication failures (tagged `operation=auth`).

**Name**: `korvet.broker.failures` \
**Type**: `counter`

**Tags**

| Key | Description |
|---|---|
| `error_type` | Failure category, lower-cased. |
| `operation` | Logical operation name. |

### Fetch Latency

Fetch request latency.

**Name**: `korvet.broker.fetch` \
**Type**: `timer` \
**Base unit**: `seconds`

**Tags**

| Key | Description |
|---|---|
| `topic` | Kafka topic name. |

### Frame Size

Broker Kafka frame size in bytes, by direction (request/response) and API key.

**Name**: `korvet.broker.frame_size` \
**Type**: `distribution summary` \
**Base unit**: `bytes`

**Tags**

| Key | Description |
|---|---|
| `api_key` | Kafka API key (request type) on the broker, lower-cased. |
| `direction` | Frame direction: `request` or `response`. |

### Log Start Offset

Log start offset per `(topic, partition)`: earliest still-readable offset. Empty partitions report `0`.

**Name**: `korvet.broker.log_start_offset` \
**Type**: `gauge`

**Tags**

| Key | Description |
|---|---|
| `partition` | Kafka partition number, as a decimal string. |
| `topic` | Kafka topic name. |

### Lossy Records

Number of records affected by lossy offset mapping, by phase.

**Name**: `korvet.broker.lossy_records` \
**Type**: `counter`

**Tags**

| Key | Description |
|---|---|
| `phase` | Lifecycle phase, lower-cased. |
| `topic` | Kafka topic name. |

### Max Offset

High watermark per `(topic, partition)`: next offset to be assigned (i.e. latest visible offset + 1). Empty partitions report `0`.

**Name**: `korvet.broker.max_offset` \
**Type**: `gauge`

**Tags**

| Key | Description |
|---|---|
| `partition` | Kafka partition number, as a decimal string. |
| `topic` | Kafka topic name. |

### Pending

Current broker request bytes waiting on asynchronous completion.

**Name**: `korvet.broker.pending` \
**Type**: `gauge` \
**Base unit**: `bytes`

### Produce Latency

Produce request latency.

**Name**: `korvet.broker.produce` \
**Type**: `timer` \
**Base unit**: `seconds`

**Tags**

| Key | Description |
|---|---|
| `topic` | Kafka topic name. |

### Produce Records

Number of records successfully produced.

**Name**: `korvet.broker.produce.records` \
**Type**: `counter` \
**Base unit**: `records`

**Tags**

| Key | Description |
|---|---|
| `topic` | Kafka topic name. |

### Rebalances

Number of consumer group rebalance lifecycle events.

**Name**: `korvet.broker.rebalances` \
**Type**: `counter`

**Tags**

| Key | Description |
|---|---|
| `phase` | Lifecycle phase, lower-cased. |

### Request Latency

Broker Kafka API request latency, observed per request.

**Name**: `korvet.broker.request` \
**Type**: `timer` \
**Base unit**: `seconds`

**Tags**

| Key | Description |
|---|---|
| `api_key` | Kafka API key (request type) on the broker, lower-cased. |
| `result` | Outcome of the broker request, lower-cased. |

### Up

Whether the broker is currently running.

**Name**: `korvet.broker.up` \
**Type**: `gauge`
