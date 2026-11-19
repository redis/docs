---
Title: Mapper Metrics
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: Metrics emitted by korvet-mapper.
linkTitle: Mapper
weight: 40
---

These metrics are emitted by `korvet-mapper`.

## Metrics

### Compression Ratio

Compression ratio recorded by mapper compression operations. The distribution's `_count` also reports the compression event count per algorithm.

**Name**: `korvet.mapper.compression_ratio` \
**Type**: `distribution summary`

**Tags**

| Key | Description |
|---|---|
| `compression` | Compression algorithm (e.g. `none`, `gzip`, `snappy`, `lz4`, `zstd`). |

### Failures

Mapper failures by operation and exception class.

**Name**: `korvet.mapper.failures` \
**Type**: `counter`

**Tags**

| Key | Description |
|---|---|
| `error_type` | Exception class simple name normalised to lower case. |
| `operation` | Logical mapper operation name. |

### Operation

Mapper operation latency, observed per call. Tagged with the logical operation name and outcome ( `success`, `error`). Use the timer's `_count` for operation counts.

**Name**: `korvet.mapper.operation` \
**Type**: `timer` \
**Base unit**: `seconds`

**Tags**

| Key | Description |
|---|---|
| `operation` | Logical mapper operation name. |
| `result` | Operation outcome (e.g. `success`, `error`). |

### Payload Size

Mapper payload sizes in bytes, by operation and phase.

**Name**: `korvet.mapper.payload_size` \
**Type**: `distribution summary` \
**Base unit**: `bytes`

**Tags**

| Key | Description |
|---|---|
| `operation` | Logical mapper operation name. |
| `phase` | Mapper phase (e.g. `input`, `output`). |
