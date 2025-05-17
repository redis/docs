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
  
## Stream processor metrics

The endpoint for the stream processor metrics is `https://<RDI_HOST>/metrics/rdi`

RDI reports metrics during the two main phases of the ingest pipeline, the *snapshot*
phase and the *change data capture (CDC)* phase. (See the
[pipeline lifecycle]({{< relref "/integrate/redis-data-integration/data-pipelines/data-pipelines" >}})
docs for more information). The table below shows the full set of metrics that
RDI reports. 

| Metric | Phase |
|:-- |:-- |
| CapturedTables | Both |
| Connected | CDC |
| LastEvent | Both |
| LastTransactionId | CDC |
| MilliSecondsBehindSource | CDC |
| MilliSecondsSinceLastEvent | Both |
| NumberOfCommittedTransactions | CDC |
| NumberOfEventsFiltered | Both |
| QueueRemainingCapacity | Both |
| QueueTotalCapacity | Both |
| RemainingTableCount | Snapshot |
| RowsScanned | Snapshot |
| SnapshotAborted | Snapshot |
| SnapshotCompleted | Snapshot |
| SnapshotDurationInSeconds | Snapshot |
| SnapshotPaused | Snapshot |
| SnapshotPausedDurationInSeconds | Snapshot |
| SnapshotRunning | Snapshot |
| SourceEventPosition | CDC |
| TotalNumberOfCreateEventsSeen | CDC |
| TotalNumberOfDeleteEventsSeen | CDC |
| TotalNumberOfEventsSeen | Both |
| TotalNumberOfUpdateEventsSeen | CDC |
| TotalTableCount | Snapshot |

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
