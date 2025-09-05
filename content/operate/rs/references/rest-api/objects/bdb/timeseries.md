---
Title: Timeseries configuration object
alwaysopen: false
categories:
- docs
- operate
- rs
description: Configuration object timeseries.
linkTitle: timeseries
weight: $weight
---

Configuration fields for timeseries.

| Field | Type/Value | Description |
|-------|------------|-------------|
| ts-num-threads | integer (range: 1-16) (default: 1000) | Number of threads for time series operations. Requires a database restart to take effect. |
| ts-compaction-policy | string  | Default compaction rules. This default value is applied to each new time series upon its creation |
| ts-retention-policy | integer (range: 0-9223372036854775807) (default: 0) | Default retention period, in milliseconds. This default value is applied to each new time series upon its creation, but if COMPACTION_POLICY is specified, it is overridden for created compactions as specified in COMPACTION_POLICY. |
| ts-duplicate-policy | string (values: BLOCK, FIRST, LAST, MIN, MAX, SUM) (default: "BLOCK") | Default policy for handling insertion of multiple samples with identical timestamps. This default value is applied to each new time series upon its creation. |
| ts-encoding | string (values: COMPRESSED, UNCOMPRESSED) (default: "COMPRESSED") | Default chunk encoding for automatically-created compacted time series. This default value is applied to each new compacted time series automatically created due to the creation of a new time series when COMPACTION_POLICY is specified. |
| ts-chunk-size-bytes | integer (range: 48-1048576) (default: 4096) | Default initial allocation size, in bytes, for the data part of each new chunk. This default value is applied to each new time series upon its creation. |
| ts-ignore-max-time-diff | integer (range: 0-9223372036854775807) (default: 0) | Default maximum time difference that can be expired to consider a new insertion to be a duplicate. This default value is applied to each new time series upon its creation. |
| ts-ignore-max-val-diff | number (range: 0+) (default: 0) | Default maximum value difference for a new insertion to be considered a duplicate. This default value is applied to each new time series upon its creation. |
