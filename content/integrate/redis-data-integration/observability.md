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
| `ChangesApplied` | Counter | Total number of schema changes applied during recovery and runtime | Informational - monitor for trends |
| `ChangesRecovered` | Counter | Number of changes that were read during the recovery phase | Informational - monitor for trends |
| `MilliSecondsSinceLastAppliedChange` | Gauge | Number of milliseconds since the last change was applied | Informational - monitor for trends |
| `MilliSecondsSinceLastRecoveredChange` | Gauge | Number of milliseconds since the last change was recovered from the history store | Informational - monitor for trends |
| `RecoveryStartTime` | Gauge | Time in epoch milliseconds when recovery started (-1 if not applicable) | Informational - monitor for trends |
| **Connection and State Metrics** | | | |
| `Connected` | Gauge | Whether the collector is currently connected to the database (1=connected, 0=disconnected) | **Critical Alert**: Alert if value = 0 (disconnected) |
| **Queue Metrics** | | | |
| `CurrentQueueSizeInBytes` | Gauge | Current size of the collector's internal queue in bytes | Informational - monitor for trends |
| `MaxQueueSizeInBytes` | Gauge | Maximum configured size of the collector's internal queue in bytes | Informational - use for capacity planning |
| `QueueRemainingCapacity` | Gauge | Remaining capacity of the collector's internal queue | Informational - monitor for trends |
| `QueueTotalCapacity` | Gauge | Total capacity of the collector's internal queue | Informational - use for capacity planning |
| **Streaming Performance Metrics** | | | |
| `MilliSecondsBehindSource` | Gauge | Number of milliseconds the collector is behind the source database (-1 if not applicable) | Informational - monitor for trends and business SLA requirements |
| `MilliSecondsSinceLastEvent` | Gauge | Number of milliseconds since the collector processed the most recent event (-1 if not applicable) | Informational - monitor for trends in active systems |
| `NumberOfCommittedTransactions` | Counter | Number of committed transactions processed by the collector | Informational - monitor for trends |
| `NumberOfEventsFiltered` | Counter | Number of events filtered by include/exclude list rules | Informational - monitor for trends |
| **Event Counters** | | | |
| `TotalNumberOfCreateEventsSeen` | Counter | Total number of CREATE (INSERT) events seen by the collector | Informational - monitor for trends |
| `TotalNumberOfDeleteEventsSeen` | Counter | Total number of DELETE events seen by the collector | Informational - monitor for trends |
| `TotalNumberOfEventsSeen` | Counter | Total number of events seen by the collector | Informational - monitor for trends |
| `TotalNumberOfUpdateEventsSeen` | Counter | Total number of UPDATE events seen by the collector | Informational - monitor for trends |
| `NumberOfErroneousEvents` | Counter | Number of events that caused errors during processing | **Critical Alert**: Alert if > 0 (indicates processing failures) |
| **Snapshot Metrics** | | | |
| `RemainingTableCount` | Gauge | Number of tables remaining to be processed during snapshot | Informational - monitor snapshot progress |
| `RowsScanned` | Counter | Number of rows scanned per table during snapshot (reported per table) | Informational - monitor snapshot progress |
| `SnapshotAborted` | Gauge | Whether the snapshot was aborted (1=aborted, 0=not aborted) | **Critical Alert**: Alert if value = 1 (snapshot failed) |
| `SnapshotCompleted` | Gauge | Whether the snapshot completed successfully (1=completed, 0=not completed) | Informational - monitor snapshot completion |
| `SnapshotDurationInSeconds` | Gauge | Total duration of the snapshot process in seconds | Informational - monitor for performance trends |
| `SnapshotPaused` | Gauge | Whether the snapshot is currently paused (1=paused, 0=not paused) | Informational - monitor snapshot state |
| `SnapshotPausedDurationInSeconds` | Gauge | Total time the snapshot was paused in seconds | Informational - monitor snapshot state |
| `SnapshotRunning` | Gauge | Whether a snapshot is currently running (1=running, 0=not running) | Informational - monitor snapshot state |
| `TotalTableCount` | Gauge | Total number of tables included in the snapshot | Informational - use for progress calculation |

{{< note >}}
Many metrics include context labels that specify the phase (`snapshot` or `streaming`), database name, and other contextual information. Metrics with a value of `-1` typically indicate that the measurement is not applicable in the current state.
{{< /note >}}
  
## Stream processor metrics

The endpoint for the stream processor metrics is `https://<RDI_HOST>/metrics/rdi`

RDI reports metrics during the two main phases of the ingest pipeline, the *snapshot*
phase and the *change data capture (CDC)* phase. (See the
[pipeline lifecycle]({{< relref "/integrate/redis-data-integration/data-pipelines" >}})
docs for more information). The table below shows the full set of metrics that
RDI reports with their descriptions. 

| Metric Name | Metric Type | Metric Description | Alerting Recommendations |
|-------------|-------------|--------------------|-----------------------|
| `incoming_records_total` | Counter | Total number of incoming records processed by the system | Informational - monitor for trends |
| `incoming_records_created` | Gauge | Timestamp when the incoming records counter was created | Informational - no alerting needed |
| `processed_records_total` | Counter | Total number of records that have been successfully processed | Informational - monitor for trends |
| `rejected_records_total` | Counter | Total number of records that were rejected during processing | **Critical Alert**: Alert if > 0 (indicates processing failures) |
| `filtered_records_total` | Counter | Total number of records that were filtered out during processing | Informational - monitor for trends |
| `rdi_engine_state` | Gauge | Current state of the RDI engine with labels for `state` (e.g., STARTED, RUNNING) and `sync_mode` (e.g., SNAPSHOT, STREAMING) | **Critical Alert**: Alert if state indicates failure or error condition |
| `rdi_version_info` | Gauge | Version information for RDI components with labels for `cli` and `engine` versions | Informational - use for version tracking |
| `monitor_time_elapsed_total` | Counter | Total time elapsed (in seconds) since monitoring started | Informational - use for uptime tracking |
| `monitor_time_elapsed_created` | Gauge | Timestamp when the monitor time elapsed counter was created | Informational - no alerting needed |
| `rdi_incoming_entries` | Gauge | Count of incoming events by `data_source` and `operation` type (pending, inserted, updated, deleted, filtered, rejected) | Informational - monitor for trends, alert only on "rejected" > 0 |
| `rdi_stream_event_latency_ms` | Gauge | Latency in milliseconds of the oldest event in each data stream, labeled by `data_source` | Informational - monitor based on business SLA requirements |

{{< note >}}
**Additional information about stream processor metrics:**

- Where the metric name has the `rdi_` prefix, this will be replaced by the Kubernetes namespace name if you supplied a custom name during installation. The prefix is always `rdi_` for VM installations.
- Metrics with the `_created` suffix are automatically generated by Prometheus for counters and gauges to track when they were first created.
- The `rdi_incoming_entries` metric provides a detailed breakdown for each data source by operation type.
- The `rdi_stream_event_latency_ms` metric helps monitor data freshness and processing delays.
{{< /note >}}

## Recommended alerting strategy

The alerting strategy described in the sections below focuses on system failures and data integrity issues that require immediate attention. Most ther metrics are informational, so you should monitor them for trends rather than trigger alerts.

### Critical alerts (immediate response required)

These are the only alerts that require immediate action:

- **`Connected = 0`**: Database connectivity has been lost. RDI cannot function without a database connection. 
- **`NumberOfErroneousEvents > 0`**: Errors are occurring during data processing. This indicates data corruption or processing failures.
- **`rejected_records_total > 0`**: Records are being rejected. This indicates data quality issues or processing failures.
- **`SnapshotAborted = 1`**: The snapshot process has failed, so the initial sync is incomplete.
- **`rdi_engine_state`**: This is an alert only if the state indicates a clear failure condition (not just "not running").

### Important monitoring (but not alerts)

You should monitor these metrics on dashboards and review them regularly, but they don't require automated alerts:

- **Queue metrics**: Queue utilization can vary widely and hitting 0% or 100% capacity may be normal during certain operations.
- **Latency metrics**: Lag and processing times depend heavily on business requirements and normal operational patterns.
- **Event counters**: Event rates naturally vary based on application usage patterns.
- **Snapshot progress**: Snapshot duration and progress depend on data size, so you should typically monitor them manually.
- **Schema changes**: Schema change frequency is highly application-dependent.

### Key principles for RDI alerting

- **Alert on failures, not performance**: Focus alerts on system failures rather than performance degradation.
- **Business context matters**: Latency and throughput requirements vary significantly between organizations.
- **Establish baselines first**: Monitor metrics for weeks before you set any threshold-based alerts.
- **Avoid alert fatigue**: If you see too many non-critical alerts, you are less likely to take truly critical issues seriously.
- **Use dashboards for trends**: Most metrics are better suited for dashboard monitoring than alerting

### Monitoring best practices

- **Dashboard-first approach**: Use Grafana dashboards to visualize trends and patterns.
- **Baseline establishment**: Monitor your specific workload for 2-4 weeks before you consider adding more alerts.
- **Business SLA alignment**: Only create alerts for metrics that directly impact your business SLA requirements.
- **Manual review**: Don't use automated alerts to review metric trends. Instead, schedule regular business reviews to check them manually.

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
