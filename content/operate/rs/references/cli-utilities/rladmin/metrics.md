---
Title: rladmin metrics
alwaysopen: false
categories:
- docs
- operate
- rs
description: Configures the metrics stream engine and manages local metrics storage.
headerRange: '[1-2]'
linkTitle: metrics
toc: 'true'
weight: $weight
---

Manages the cluster-wide [metrics configuration](/content/operate/rs/monitoring/metrics_stream_engine/metrics-configuration.md) for the v2 metrics stream engine, and reports on and controls [local metrics storage](/content/operate/rs/monitoring/metrics_stream_engine/local-metrics-storage.md) on each node.

## `metrics config`

Updates the cluster's metrics configuration. Specify one or more field/value pairs; at least one pair is required.

```sh
rladmin metrics config <field> <value> [ <field> <value> ... ]
```

To view the current configuration, use [`rladmin info metrics`](/content/operate/rs/references/cli-utilities/rladmin/info.md#info-metrics).

### Parameters

For the available fields and their types, defaults, and validation, see the [metrics configuration object](/content/operate/rs/references/rest-api/objects/metrics_config.md).

On the command line, boolean fields take `enabled` or `disabled`, list fields take a comma-separated set of values, and an empty value (`""`) clears a list field.

### Returns

Returns a confirmation message when the update succeeds.

### Example

```sh
$ rladmin metrics config expose_db_tags enabled metrics_tag_keys_exposed env,team
Metrics configuration updated successfully
```

## `metrics status`

Shows the status of local metrics storage on all nodes or on a specific node.

```sh
rladmin metrics status [ node <uid> ]
```

### Parameters

| Parameter | Type/Value | Description |
|-----------|------------|-------------|
| node | integer | Shows the status of the specified node only. If omitted, shows all nodes. |

### Returns

Returns each node's store state, disk usage against the configured maximum, configured and effective retention, the date range of stored data, and health.

### Example

```sh
$ rladmin metrics status
METRICS STORE:
NODE  STATE     DISK USAGE              RETENTION       DATA RANGE                  HEALTH
1     running   450MB / 1.0GB (44%)     8d (eff 6d)     2026-02-15 to 2026-02-23    ok
2     running   512MB / 1.0GB (50%)     8d (eff 6d)     2026-02-15 to 2026-02-23    ok
3     stopped   -                       8d              -                           -
```

```sh
$ rladmin metrics status node 1
Metrics Store Status:
  Node:             1
  State:            running
  Disk usage:       450MB / 1.0GB (44%)
  Retention:        8 days (effective: 6 days)
  Data range:       2026-02-15 to 2026-02-23
  Health:           ok
```

## `metrics granular start`

Starts granular metrics collection on all nodes or on a specific node. Collection stops automatically after the maximum duration set in [`granular_metrics_job_settings`](/content/operate/rs/references/rest-api/objects/job_scheduler/granular_metrics_job_settings.md).

```sh
rladmin metrics granular start [ node <uid> ]
```

### Parameters

| Parameter | Type/Value | Description |
|-----------|------------|-------------|
| node | integer | Starts collection on the specified node only. If omitted, starts collection on all nodes. |

### Returns

Returns the result for each node: `started`, `already running`, or `unknown`. If the result is `unknown`, run `rladmin metrics granular status node <uid>` to confirm it.

### Example

```sh
$ rladmin metrics granular start
Starting granular metrics:
  - node:1: started (expires at 2026-02-22 15:30:00)
  - node:2: already running (started at 2026-02-22 14:32:05, expires at 2026-02-22 15:32:05)
  - node:4: unknown (could not reach node — retry 'rladmin metrics granular status node 4' to confirm)
```

## `metrics granular stop`

Stops granular metrics collection on all nodes or on a specific node. The collected data stays on disk until you [delete it](#metrics-granular-cleanup) or the cleanup delay set in [`granular_metrics_job_settings`](/content/operate/rs/references/rest-api/objects/job_scheduler/granular_metrics_job_settings.md) passes.

```sh
rladmin metrics granular stop [ node <uid> ]
```

### Parameters

| Parameter | Type/Value | Description |
|-----------|------------|-------------|
| node | integer | Stops collection on the specified node only. If omitted, stops collection on all nodes. |

### Returns

Returns the result for each node: `stopped` or `already stopped`.

### Example

```sh
$ rladmin metrics granular stop
Stopping granular metrics:
  - node:1: stopped (ran for 45m, stopped at 2026-02-22 14:45:00)
  - node:2: already stopped
```

## `metrics granular status`

Shows the granular metrics collection status of all nodes or of a specific node.

```sh
rladmin metrics granular status [ node <uid> ]
```

### Parameters

| Parameter | Type/Value | Description |
|-----------|------------|-------------|
| node | integer | Shows the status of the specified node only. If omitted, shows all nodes. |

### Returns

Returns each node's collection state and disk usage. For a running node, it shows when collection started and when it expires. For a stopped node, it shows when collection stopped and when the data is cleaned up.

### Example

```sh
$ rladmin metrics granular status
GRANULAR METRICS:
NODE  STATE    STARTED              STOPPED              EXPIRES/CLEANUP    DISK
1     running  2026-02-22 14:30:00  -                    expires in 47m     125MB
2     stopped  -                    2026-02-22 14:30:00  cleanup in 23h     125MB
```

## `metrics granular cleanup`

Deletes granular metrics data from all nodes or from a specific node.

```sh
rladmin metrics granular cleanup [ node <uid> ]
```

If granular collection is still running on any node in scope, the command fails and deletes nothing. Stop collection with [`rladmin metrics granular stop`](#metrics-granular-stop) first.

### Parameters

| Parameter | Type/Value | Description |
|-----------|------------|-------------|
| node | integer | Deletes granular data from the specified node only. If omitted, deletes granular data from all nodes. |

### Returns

Returns the result for each node. If collection is still running on any node in scope, returns an error that lists those nodes.

### Example

The following command fails because collection is still running on node 1:

```sh
$ rladmin metrics granular cleanup
error: cannot cleanup granular metrics — still running on 1 node:
  - node:1 (started 2026-02-22 14:30:00, 47m ago)
hint: stop these nodes first ('rladmin metrics granular stop' or 'rladmin metrics granular stop node <uid>').
```
