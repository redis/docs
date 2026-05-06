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

RDI exposes the following endpoints:
- **Collector metrics**: CDC collector performance and connectivity
- **Stream processor metrics**: Data processing performance and throughput. The exposed metrics depend on the [stream processor implementation]({{< relref "/integrate/redis-data-integration/architecture#stream-processor-implementations" >}}) used by the pipeline:
  - The classic processor exposes the metrics described in [Stream processor metrics](#stream-processor-metrics) through the `rdi-metrics-exporter` service.
  - The Flink processor exposes the metrics described in [Flink processor metrics](#flink-processor-metrics) directly from its JobManager and TaskManager pods. The `rdi-metrics-exporter` is not deployed for Flink-based pipelines.
- **Operator metrics**: Kubernetes operator health and Pipeline resource states

The sections below explain these sets of metrics in more detail.
See the
[architecture overview]({{< relref "/integrate/redis-data-integration/architecture#overview" >}})
for an introduction to these concepts.

{{< note >}}If you don't use Prometheus or Grafana, you can still see
RDI metrics with the RDI monitoring screen in Redis Insight or with the
[`redis-di status`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-status" >}})
command from the CLI.{{< /note >}}

## Accessing the metrics

The way you access the metrics endpoints depends on whether you are using a VM installation or a Helm installation for RDI. The sections below describe the correct approach for each installation type.

### VM Installation

For VM installations, the metrics are available by default on the following endpoints:
- Collector metrics: `https://<RDI_HOST>/collector-source/metrics`
- Stream processor metrics: `https://<RDI_HOST>/metrics`
- Operator metrics: `https://<RDI_HOST>/operator/metrics`

Please note that for RDI versions prior to 1.16.0 the collector metrics are not accessible.

### Helm installation

For Helm installations, the metrics are available via autodiscovery in the K8s cluster. Follow the steps below to use them:
1. Make sure you have the Prometheus Operator installed in your K8s cluster (see the
   [Prometheus Operator installation guide](https://prometheus-operator.dev/docs/getting-started/installation/) for more information about this).

2. Update your values.yaml file to enable metrics for the operator, collector and stream processor components.

    - For the collector, update the `collector` section, under the `dataPlane` section:
        ```yaml
        dataPlane:
          collector:
            # Enable service monitor
            serviceMonitor:
              enabled: true

              # Make sure to label the ServiceMonitor so that Prometheus can discover it
              labels:
                release: prometheus
        ```

    - For the stream processor, update the `rdiMetricsExporter` section:
        ```yaml
        rdiMetricsExporter:
          # Enable service monitor
          serviceMonitor:
            enabled: true

            # Make sure to label the ServiceMonitor so that Prometheus can discover it
            labels:
              release: prometheus
        ```

    - For the operator, update the `operator` section:
        ```yaml
        operator:
          prometheus:
            enabled: true
            labels:
              release: prometheus
          metrics:
            enabled: true
        ```

    - For the Flink processor, enable the JobManager and TaskManager `ServiceMonitor` resources under `operator.dataPlane.flinkProcessor`:
        ```yaml
        operator:
          dataPlane:
            flinkProcessor:
              jobManager:
                serviceMonitor:
                  enabled: true
                  labels:
                    release: prometheus
              taskManager:
                serviceMonitor:
                  enabled: true
                  labels:
                    release: prometheus
        ```

{{< note >}}The Prometheus service discovery loop runs at regular intervals. This means that after deploying or updating RDI with the above configuration, it may take a few minutes for Prometheus to discover the new ServiceMonitors and start scraping metrics from the RDI components.
{{< /note >}}

## Collector metrics

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

The metrics in this section are reported by the *classic* stream processor and
exposed through the `rdi-metrics-exporter` service. For pipelines that use
the [Flink processor]({{< relref "/integrate/redis-data-integration/architecture#stream-processor-implementations" >}}),
see [Flink processor metrics](#flink-processor-metrics) instead.

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
| **Processor Performance Total Metrics** | | | |
| `rdi_processed_batches_total` | Counter | Total number of processed batches | Informational - use for data ingestion and load tracking |
| `rdi_processor_batch_size_total` | Counter | Total batch size across all processed batches | Informational - use for throughput analysis |
| `rdi_processor_read_time_ms_total` | Counter | Total read time in milliseconds across all batches | Informational - use for performance analysis |
| `rdi_processor_transform_time_ms_total` | Counter | Total transform time in milliseconds across all batches | Informational - use for performance analysis |
| `rdi_processor_write_time_ms_total` | Counter | Total write time in milliseconds across all batches | Informational - use for performance analysis |
| `rdi_processor_process_time_ms_total` | Counter | Total process time in milliseconds across all batches | Informational - use for performance analysis |
| `rdi_processor_ack_time_ms_total` | Counter | Total acknowledgment time in milliseconds across all batches | Informational - use for performance analysis |
| `rdi_processor_total_time_ms_total` | Counter | Sum of the total `read_time`, `process_time` and `ack_time` values in milliseconds across all batches | Informational - use for performance analysis |
| `rdi_processor_rec_per_sec_total` | Gauge | Total records per second across all batches | Informational - use for throughput analysis |
| **Processor Performance Last Batch Metrics** | | | |
| `rdi_processor_batch_size_last` | Gauge | Last batch size processed | Informational - use for real-time monitoring |
| `rdi_processor_read_time_ms_last` | Gauge | Last batch read time in milliseconds | Informational - use for real-time performance monitoring |
| `rdi_processor_transform_time_ms_last` | Gauge | Last batch transform time in milliseconds | Informational - use for real-time performance monitoring |
| `rdi_processor_write_time_ms_last` | Gauge | Last batch write time in milliseconds | Informational - use for real-time performance monitoring |
| `rdi_processor_process_time_ms_last` | Gauge | Last batch process time in milliseconds | Informational - use for real-time performance monitoring |
| `rdi_processor_ack_time_ms_last` | Gauge | Last batch acknowledgment time in milliseconds | Informational - use for real-time performance monitoring |
| `rdi_processor_total_time_ms_last` | Gauge | Last batch total time in milliseconds | Informational - use for real-time performance monitoring |
| `rdi_processor_rec_per_sec_last` | Gauge | Last batch records per second | Informational - use for real-time throughput monitoring |

{{< note >}}
**Additional information about stream processor metrics:**

- Where the metric name has the `rdi_` prefix, this will be replaced by the Kubernetes namespace name if you supplied a custom name during installation. The prefix is always `rdi_` for VM installations.
- Metrics with the `_created` suffix are automatically generated by Prometheus for counters and gauges to track when they were first created.
- The `rdi_incoming_entries` metric provides a detailed breakdown for each data source by operation type.
- The `rdi_stream_event_latency_ms` metric helps monitor data freshness and processing delays.
- The processor performance metrics are divided into two categories:
  - **Total metrics**: Accumulate values across all processed batches for historical analysis
  - **Last batch metrics**: Show real-time performance data for the most recently processed batch
{{< /note >}}

## Flink processor metrics

The Flink processor exposes Prometheus metrics directly from its JobManager
and TaskManager pods. The `rdi-metrics-exporter` is not deployed for
Flink-based pipelines, and the metrics described in
[Stream processor metrics](#stream-processor-metrics) are not available.

The full set of metrics returned by the Flink processor is large and includes
every metric emitted by the underlying Flink runtime (job, task, operator,
JVM, network, and connector metrics). See the
[Flink metrics documentation](https://nightlies.apache.org/flink/flink-docs-release-2.0/docs/ops/metrics/)
for the full reference of Flink-emitted metrics, and the
[Flink Prometheus reporter](https://nightlies.apache.org/flink/flink-docs-release-2.0/docs/deployment/metric_reporters/#prometheus)
docs for the naming scheme.

Configure Prometheus to scrape these metrics by enabling the JobManager and
TaskManager `ServiceMonitor` resources under `operator.dataPlane.flinkProcessor`,
as shown in [Helm installation](#helm-installation) above.

### Useful metrics

In addition to the standard Flink metrics, the Flink processor emits a small
set of RDI-specific metrics that cover record counters, source/target
connectivity, and stream backlog. These metrics, together with a curated
subset of native Flink metrics, are surfaced through the
[RDI API v2 metric collections endpoint]({{< relref "/integrate/redis-data-integration/reference/api-reference" >}})
and are the recommended starting point for dashboards and alerts.

**RDI-emitted metrics** (per pipeline):

| Metric | Description |
|---|---|
| `flink_jobmanager_job_operator_coordinator_stream_type_rdiRecords` | Per-stream record counters. Labels: `stream`, `type` (one of `incoming`, `inserted`, `updated`, `deleted`, `filtered`, `rejected`). |
| `flink_jobmanager_job_operator_coordinator_enumerator_stream_type_rdiRecords` | Per-stream backlog and freshness. Labels: `stream`, `type` (`pending` for stream length, `lastArrival` for the epoch-millisecond timestamp of the last entry). |
| `flink_taskmanager_job_task_operator_rdi_connected` | Source or target connection status (`1` = connected, `0` = disconnected). Filter by `operator_name` equal to `Source:_source` for the source and matching the regex `.*:target:_Writer$` for target writers; treat the source or target as connected if any subtask reports `1`. |
| `flink_taskmanager_job_task_operator_rdi_lastModified` | Epoch-millisecond timestamp of the last successful write to the target Redis database. Filter by `operator_name` matching `.*:target:_Writer$` and take the maximum across subtasks. |
| `flink_taskmanager_job_task_operator_pendingAck` | Number of records emitted by the source but awaiting checkpoint completion before being acknowledged. Sum across subtasks. |

**Native Flink metrics** used by the API:

| Metric | Description |
|---|---|
| `flink_taskmanager_job_task_operator_numRecordsInPerSecond` | Per-operator throughput. For source throughput, filter by `operator_name` equal to `Source:_source` and sum across subtasks. For sink throughput, filter by `operator_name` matching `.*:target:_Writer$` and sum across subtasks and across all target writers. |
| `flink_taskmanager_job_task_busyTimeMsPerSecond` | Time the task spends actively processing records (ms/s). Average across subtasks of the main chained task; exclude the `dlq:_Writer` task. |
| `flink_taskmanager_job_task_idleTimeMsPerSecond` | Time the task spends waiting for input (ms/s). Average across subtasks of the main chained task; exclude the `dlq:_Writer` task. |
| `flink_taskmanager_job_task_backPressuredTimeMsPerSecond` | Time the task spends back-pressured because the downstream cannot keep up (ms/s). Average across subtasks of the main chained task; exclude the `dlq:_Writer` task. |
| `flink_jobmanager_job_lastCheckpointDuration` | Duration of the most recent checkpoint (ms). |
| `flink_jobmanager_job_lastCheckpointSize` | Persisted size of the most recent checkpoint (bytes). |
| `flink_jobmanager_job_numberOfCompletedCheckpoints` | Total number of completed checkpoints. |
| `flink_jobmanager_job_numberOfFailedCheckpoints` | Total number of failed checkpoints. |
| `flink_jobmanager_job_<status>Time` | Time spent in each job state (ms), where `<status>` is one of `running`, `restarting`, `failing`, `cancelling`, `initializing`, `created`, or `deploying`. The metric for the current state is non-zero; all others are zero. Use this to derive both the current job status and the time spent in it. |
| `flink_jobmanager_job_numRestarts` | Total number of job restarts since submission. |

{{< note >}}Flink runtime metric names follow Flink's own naming scheme rather
than the `rdi_` prefix used by the classic processor. When you build
dashboards that should work for both processors, query the two metric sets
separately.{{< /note >}}

## Operator metrics

The RDI operator exposes Prometheus metrics at the `/metrics` endpoint to monitor the health and state of the operator itself and the Pipeline resources it manages.

The endpoint for operator metrics is `https://<RDI_HOST>/operator/metrics` (or the operator service endpoint in Kubernetes environments).

### Operator metric types

Most of the metrics exposed by the RDI operator are standard controller-runtime [metrics](https://book.kubebuilder.io/reference/metrics-reference).
The metrics that are relevant for RDI operations are listed in the table below:

| Metric Name | Metric Type | Metric Description | Alerting Recommendations |
|-------------|-------------|-------------------|-------------------------|
| `rdi_operator_pipeline_phase` | Gauge | Current phase of each Pipeline resource with labels for `namespace`, `name`, and `phase` (Active, Inactive, Pending, Resetting, Error) | **Critical Alert**: Alert if the phase is "Error" for periods longer than 2 minutes |
| `rdi_operator_is_leader` | Gauge | Leadership status of the operator instance (1 = leader, 0 = not leader) with label for `instance_id` | Informational - monitor to ensure that the correct RDI instance is the leader in HA or DR deployments |

### Understanding operator metrics

**Pipeline phase tracking**: The `rdi_operator_pipeline_phase` metric helps you monitor the lifecycle state of each RDI Pipeline resource. Each pipeline reports its current phase (Active, Inactive, Pending, Resetting, or Error) as a gauge value of `1`, while all other phases for that pipeline are set to `0`. This allows you to track phase transitions and identify pipelines that are stuck in error states.

**Leader election**: In high availability (HA) or disaster recovery (DR) deployments with multiple RDI instances, the `rdi_operator_is_leader` metric indicates which RDI instance is actively managing Pipeline resources. Only one RDI instance should have a value of `1` at any time, while all other instances should report `0`. This metric is useful for troubleshooting leader election issues in HA or DR deployments.

### Accessing operator metrics

In Kubernetes deployments, you can configure Prometheus to scrape operator metrics by enabling the Prometheus ServiceMonitor in your Helm values:

```yaml
operator:
  prometheus:
    enabled: true
    labels:
      release: prometheus
```
**Note:** The ServiceMonitor resources must be labelled correctly for metrics to be auto-scraped by Prometheus. The correct label is configured in Prometheus, by default it is `release: prometheus`.
You can also expose the metrics endpoint externally using an Ingress:

```yaml
operator:
  ingress:
    enabled: true
    hosts:
      - operator.example.com
    pathPrefix: ""
```

Then access metrics at `https://operator.example.com/operator/metrics`.

## Recommended alerting strategy

The alerting strategy described in the sections below focuses on system failures and data integrity issues that require immediate attention. Most other metrics are informational, so you should monitor them for trends rather than trigger alerts.

### Critical alerts (immediate response required)

These are the only alerts that require immediate action:

**Collector alerts:**
- `Connected = 0`: Database connectivity has been lost. RDI cannot function without a database connection.
- `NumberOfErroneousEvents > 0`: Errors are occurring during data processing. This indicates data corruption or processing failures.
- `SnapshotAborted = 1`: The snapshot process has failed, so the initial sync is incomplete.

**Processor alerts:**
- `rejected_records_total > 0`: Records are being rejected. This indicates data quality issues or processing failures.
- `rdi_engine_state`: Alert only if the state indicates a clear failure condition (not just "not running").

**Operator alerts:**
- `rdi_operator_pipeline_phase` with `phase="Error"` for more than 2 minutes: A Pipeline resource has entered an error state and requires investigation.
- No leader in HA or DR setups: If both RDI instances report `rdi_operator_is_leader = 0` for more than 2 minutes, the RDI pipeline is not active. 
- Multiple leaders in HA or DR setups: If both RDI instances report `rdi_operator_is_leader = 1`, RDI is in a "split brain" state.

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
