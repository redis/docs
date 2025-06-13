---
Title: Observability
aliases: /integrate/redis-data-integration/ingest/observability/
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Learn how to monitor RDI
group: di
hideListLinks: false
linkTitle: Observability
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 40
---

RDI reports metrics about its operation using
[Prometheus exporter endpoints](https://prometheus.io/docs/instrumenting/exporters/).
You can connect to the endpoints with
[Prometheus](https://prometheus.io/docs/prometheus/latest/getting_started/)
to query the metrics and plot simple graphs or with
[Grafana](https://grafana.com/) to produce more complex visualizations and
dashboards.

RDI exposes two endpoints, one for [CDC collector metrics](#collector-metrics) and
another for [stream processor metrics](#stream-processor-metrics).
The sections below explain these sets of metrics in more detail.
See the
[architecture overview]({{< relref "/integrate/redis-data-integration/architecture#overview" >}})
for an introduction to these concepts.

{{< note >}}If you don't use Prometheus or Grafana, you can still see
RDI metrics with the RDI monitoring screen in Redis Insight or with the
[`redis-di status`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-status" >}})
command from the CLI.{{< /note >}}

## Collector metrics

The endpoint for the collector metrics is `https://<RDI_HOST>/metrics/collector-source`

These metrics are divided into three groups:

- **Pipeline state**: metrics about the pipeline mode and connectivity
- **Data flow counters**: counters for data breakdown per source table
- **Processing performance**: processing speed of RDI micro batches

The following table lists all collector metrics and their descriptions:

| Metric | Type | Description | Alerting Recommendations |
|:--|:--|:--|:--|
| **Schema History Metrics** | | | |
| ChangesApplied | Counter | Total number of schema changes applied during recovery and runtime | Monitor for unexpected spikes (rate > 10/hour) |
| ChangesRecovered | Counter | Number of changes that were read during the recovery phase | Alert if recovery fails (value stops increasing during recovery) |
| MilliSecondsSinceLastAppliedChange | Gauge | Number of milliseconds since the last change was applied | Alert if > 300,000ms (5 minutes) during active schema changes |
| MilliSecondsSinceLastRecoveredChange | Gauge | Number of milliseconds since the last change was recovered from the history store | Alert if > 600,000ms (10 minutes) during recovery |
| RecoveryStartTime | Gauge | Time in epoch milliseconds when recovery started (-1 if not applicable) | Monitor for prolonged recovery (> 30 minutes) |
| **Connection and State Metrics** | | | |
| Connected | Gauge | Whether the connector is currently connected to the database (1=connected, 0=disconnected) | **Critical Alert**: Alert if value = 0 (disconnected) |
| **Queue Metrics** | | | |
| CurrentQueueSizeInBytes | Gauge | Current size of the connector's internal queue in bytes | Alert if > 80% of MaxQueueSizeInBytes |
| MaxQueueSizeInBytes | Gauge | Maximum configured size of the connector's internal queue in bytes | Informational - use for capacity planning |
| QueueRemainingCapacity | Gauge | Remaining capacity of the connector's internal queue | **High Priority**: Alert if < 20% of total capacity |
| QueueTotalCapacity | Gauge | Total capacity of the connector's internal queue | Informational - use for capacity planning |
| **Streaming Performance Metrics** | | | |
| MilliSecondsBehindSource | Gauge | Number of milliseconds the connector is behind the source database (-1 if not applicable) | **High Priority**: Alert if > 60,000ms (1 minute) behind source |
| MilliSecondsSinceLastEvent | Gauge | Number of milliseconds since the connector processed the most recent event (-1 if not applicable) | **Critical Alert**: Alert if > 300,000ms (5 minutes) in active systems |
| NumberOfCommittedTransactions | Counter | Number of committed transactions processed by the connector | Monitor rate - alert if drops to 0 for > 10 minutes in active systems |
| NumberOfEventsFiltered | Counter | Number of events filtered by include/exclude list rules | Monitor rate for unexpected increases (> 50% of total events) |
| **Event Counters** | | | |
| TotalNumberOfCreateEventsSeen | Counter | Total number of CREATE (INSERT) events seen by the connector | Monitor rate for business logic validation |
| TotalNumberOfDeleteEventsSeen | Counter | Total number of DELETE events seen by the connector | Monitor rate for business logic validation |
| TotalNumberOfEventsSeen | Counter | Total number of events seen by the connector | **High Priority**: Alert if rate drops to 0 for > 10 minutes in active systems |
| TotalNumberOfUpdateEventsSeen | Counter | Total number of UPDATE events seen by the connector | Monitor rate for business logic validation |
| NumberOfErroneousEvents | Counter | Number of events that caused errors during processing | **Critical Alert**: Alert if > 0 (any errors) |
| **Snapshot Metrics** | | | |
| RemainingTableCount | Gauge | Number of tables remaining to be processed during snapshot | Monitor for stuck snapshots (no change for > 30 minutes) |
| RowsScanned | Counter | Number of rows scanned per table during snapshot (reported per table) | Monitor rate for progress tracking |
| SnapshotAborted | Gauge | Whether the snapshot was aborted (1=aborted, 0=not aborted) | **Critical Alert**: Alert if value = 1 (aborted) |
| SnapshotCompleted | Gauge | Whether the snapshot completed successfully (1=completed, 0=not completed) | Monitor for successful completion |
| SnapshotDurationInSeconds | Gauge | Total duration of the snapshot process in seconds | Alert if exceeds expected duration (> 4 hours for large datasets) |
| SnapshotPaused | Gauge | Whether the snapshot is currently paused (1=paused, 0=not paused) | Alert if paused unexpectedly (value = 1) |
| SnapshotPausedDurationInSeconds | Gauge | Total time the snapshot was paused in seconds | Alert if paused > 1800 seconds (30 minutes) |
| SnapshotRunning | Gauge | Whether a snapshot is currently running (1=running, 0=not running) | Monitor for unexpected state changes |
| TotalTableCount | Gauge | Total number of tables included in the snapshot | Informational - use for progress calculation |

{{< note >}}
Many metrics include context labels that specify the phase (`snapshot` or `streaming`), database name, and other contextual information. Metrics with a value of `-1` typically indicate that the measurement is not applicable in the current state.
{{< /note >}}
  
## Stream processor metrics

The endpoint for the stream processor metrics is `https://<RDI_HOST>/metrics/rdi`

RDI reports metrics during the two main phases of the ingest pipeline, the *snapshot*
phase and the *change data capture (CDC)* phase. (See the
[pipeline lifecycle]({{< relref "/integrate/redis-data-integration/data-pipelines/data-pipelines" >}})
docs for more information). The table below shows the full set of metrics that
RDI reports with their descriptions. 

| Metric Name | Metric Type | Metric Description | Alerting Recommendations |
|-------------|-------------|--------------------|-----------------------|
| `incoming_records_total` | Counter | Total number of incoming records processed by the system | **High Priority**: Alert if rate drops to 0 for > 10 minutes in active systems |
| `incoming_records_created` | Gauge | Timestamp when the incoming records counter was created | Informational - no alerting needed |
| `processed_records_total` | Counter | Total number of records that have been successfully processed | Monitor processing rate - alert if significantly slower than incoming rate |
| `rejected_records_total` | Counter | Total number of records that were rejected during processing | **Critical Alert**: Alert if > 0 (any rejections indicate data quality issues) |
| `filtered_records_total` | Counter | Total number of records that were filtered out during processing | Monitor rate - alert if > 50% of incoming records are filtered |
| `rdi_engine_state` | Gauge | Current state of the RDI engine with labels for `state` (e.g., STARTED, RUNNING) and `sync_mode` (e.g., SNAPSHOT, STREAMING) | **Critical Alert**: Alert if state != "RUNNING" for > 5 minutes |
| `rdi_version_info` | Gauge | Version information for RDI components with labels for `cli` and `engine` versions | Informational - use for version tracking |
| `monitor_time_elapsed_total` | Counter | Total time elapsed (in seconds) since monitoring started | Informational - use for uptime tracking |
| `monitor_time_elapsed_created` | Gauge | Timestamp when the monitor time elapsed counter was created | Informational - no alerting needed |
| `rdi_incoming_entries` | Gauge | Count of incoming events by `data_source` and `operation` type (pending, inserted, updated, deleted, filtered, rejected) | **High Priority**: Alert if "rejected" > 0 or "pending" accumulates without processing |
| `rdi_stream_event_latency_ms` | Gauge | Latency in milliseconds of the oldest event in each data stream, labeled by `data_source` | **High Priority**: Alert if > 60,000ms (1 minute) for real-time use cases |

{{< note >}}
**Additional information about stream processor metrics:**

- The `rdi_` prefix comes from the Kubernetes namespace where RDI is installed. For VM install it is always this value.
- Metrics with `_created` suffix are automatically generated by Prometheus for counters and gauges to track when they were first created.
- The `rdi_incoming_entries` metric provides detailed breakdown by operation type for each data source.
- The `rdi_stream_event_latency_ms` metric helps monitor data freshness and processing delays.
{{< /note >}}

## Recommended alerting strategy

Based on operational experience, the following metrics require immediate attention:

### Critical alerts (immediate response required)
- **`Connected = 0`**: Database connectivity lost
- **`NumberOfErroneousEvents > 0`**: Data processing errors occurring
- **`rejected_records_total > 0`**: Records being rejected (data quality issues)
- **`SnapshotAborted = 1`**: Snapshot process failed
- **`rdi_engine_state != "RUNNING"`**: RDI engine not in expected state

### High priority alerts (response within 15 minutes)
- **`MilliSecondsBehindSource > 60000`**: Replication lag exceeding 1 minute
- **`MilliSecondsSinceLastEvent > 300000`**: No events processed for 5+ minutes
- **`QueueRemainingCapacity < 20%`**: Queue capacity critically low
- **`rdi_stream_event_latency_ms > 60000`**: Event processing latency too high
- **`TotalNumberOfEventsSeen` rate = 0**: No events flowing for 10+ minutes

### Medium priority alerts (response within 1 hour)
- **Queue utilization > 80%**: Approaching capacity limits
- **Snapshot duration > expected baseline**: Performance degradation
- **High filtering rate (> 50%)**: Potential configuration issues

### Monitoring best practices
- Set up alerting rules in your monitoring system (Prometheus Alertmanager, Grafana, etc.)
- Use rate() functions for counter metrics to detect changes in processing patterns
- Establish baseline values for your specific workload before setting thresholds
- Consider business hours and maintenance windows when configuring alert schedules

## RDI logs

RDI uses [fluentd](https://www.fluentd.org/) and
[logrotate](https://linux.die.net/man/8/logrotate) to ship and rotate logs
for its Kubernetes (K8s) components.
So whenever a containerized component is removed by the RDI operator process or by K8s,
the logs are available for you to inspect.
By default, RDI stores logs in the host VM file system at `/opt/rdi/logs`.
The logs are recorded at the minimum `INFO` level and get rotated when they reach a size of 100MB.
RDI retains the last five log rotated files by default.
Logs are in a straightforward text format, which lets you analyze them with several different observability tools.
You can change the default log settings using the
[`redis-di configure-rdi`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-configure-rdi" >}})
command.

## Dump support package

If you ever need to send a comprehensive set of forensics data to Redis support then you should
run the
[`redis-di dump-support-package`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-dump-support-package" >}})
command from the CLI. See
[Troubleshooting]({{< relref "/integrate/redis-data-integration/troubleshooting#dump-support-package" >}})
for more information.
