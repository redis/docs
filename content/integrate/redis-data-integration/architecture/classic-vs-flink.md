---
Title: Differences between the classic and Flink processors
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Compare the classic and Flink stream processor implementations.
group: di
linkTitle: Classic vs. Flink processor
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 10
---

RDI ships with two stream processor implementations. Both consume the same
source streams, share the same job-level configuration model, and write to
the same Redis target, but they differ in architecture, supported features,
configuration, observability, error handling, and performance.

This page summarizes those differences. See
[Which processor should I use?]({{< relref "/integrate/redis-data-integration/faq#which-processor-should-i-use" >}})
in the FAQ for the recommendation, and
[Migrate from the classic processor to the Flink processor]({{< relref "/integrate/redis-data-integration/installation/migration-classic-to-flink" >}})
for a step-by-step migration guide.

## At a glance

| Aspect | Classic processor | Flink processor |
|---|---|---|
| Implementation | Python | Java on top of [Apache Flink](https://flink.apache.org/) |
| Deployment targets | VM and Kubernetes | Kubernetes only |
| Scaling | Single replica | Horizontal: TaskManager replicas × task slots per TaskManager |
| Fault tolerance | Source-stream consumer-group replay | Source-stream consumer-group replay plus Flink checkpointing |
| Supported `data_type` outputs | `hash`, `json`, `set`, `sorted_set`, `stream`, `string` | `hash`, `json` |
| Metrics endpoint | `rdi-metrics-exporter` pod | Flink JobManager `/metrics` (no metrics exporter) |
| Metric naming | `rdi_*` (e.g., `rdi_incoming_entries`) | `flink_*` (e.g., `flink_jobmanager_job_operator_coordinator_stream_type_rdiRecords`) |
| End-to-end latency | Bounded by the per-batch read-process-write cycle | Records flow through pipelined operator chains without a per-batch barrier |
| Snapshot throughput | Limited by single shared reader and writer | Parallelized across all task slots |
| Expression and `redis.lookup` result caching | Not supported | Optional, opt-in per transformation |

## Architecture and deployment

The classic processor runs as a single pod managed by the operator
and can be deployed on either VMs or Kubernetes through the RDI Helm
chart.

The Flink processor runs as an Apache Flink application cluster: one
JobManager pod plus one or more TaskManager pods. Source,
transformation, and sink operators run as parallel subtasks across
all task slots in the cluster. The Flink processor scales
horizontally by changing the number of TaskManager replicas
(`advanced.resources.taskManager.replicas`); with adaptive
parallelism, the default parallelism is the product of TaskManager
replicas and task slots per TaskManager. The Flink processor
currently runs on Kubernetes only; VM support is planned for a future
release.

Both processors retain at-least-once delivery semantics; the Flink
processor adds Flink checkpointing on top of the shared
consumer-group replay mechanism.

See
[Configure the Flink processor]({{< relref "/integrate/redis-data-integration/installation/install-k8s#configure-the-flink-processor" >}})
for the Helm settings.

## Configuration

The two processors share the same `config.yaml` envelope and the same
`connections`, `sources`, `targets`, and `jobs` sections. The only
differences are inside the `processors:` block, which is selected via
`processors.type` (`classic` or `flink`, default `classic`). Properties
that apply to only one implementation are annotated with
**Classic processor only.** or **Flink processor only.** in the
[pipeline configuration reference]({{< relref "/integrate/redis-data-integration/data-pipelines/pipeline-config#processors" >}}),
and are silently ignored by the other implementation. The Flink
processor exposes additional fine-grained tuning under
`processors.advanced.*`.

## Supported output formats

The classic processor supports all `data_type` values: `hash`, `json`,
`set`, `sorted_set`, `stream`, and `string`. The Flink processor
currently supports only `hash` and `json`. Pipelines that use any other
output type must remain on the classic processor or rewrite the
affected jobs. Support for the remaining output types is planned for a
future release.

## Transformation extensions

The two processors support the same set of transformation blocks
(`filter`, `map`, `add_field`, `remove_field`, `rename_field`,
`redis.lookup`) and the same expression languages (JMESPath and SQL).
Pipelines written for one processor generally execute on the other
without changes.

The Flink processor adds three optional, performance-oriented
extensions that are not available with the classic processor:

-   **Expression result caching** through a per-expression `cache:`
    block on `filter`, `map`, `add_field`, and `redis.lookup` arguments.
-   **`redis.lookup` result caching** through a `lookup_cache:` block.
-   **`redis.lookup` batching**, which groups lookups into a single
    Redis pipeline. Batching is enabled by default with sensible
    defaults; the optional `batch:` block lets you override them.

See
[Caching expression results]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples/caching-expression-results" >}})
for examples and
[`redis.lookup`]({{< relref "/integrate/redis-data-integration/reference/data-transformation/lookup" >}})
for the full property list.

## Metrics

The two processors expose different Prometheus metric sets and use
different naming schemes, so dashboards and alerts cannot be reused
as-is between them. The classic processor exposes its metrics through
the `rdi-metrics-exporter` pod. The Flink processor emits metrics
directly from the JobManager and TaskManager pods through Flink's
native Prometheus reporter; no metrics exporter is deployed.

See
[Observability — Flink processor metrics]({{< relref "/integrate/redis-data-integration/observability#flink-processor-metrics" >}})
for the customer-facing list of metrics.

## Error handling and DLQ

Both processors implement a dead-letter queue (DLQ) at
`dlq:{stream_name}` and honor the same top-level `error_handling`
(`dlq` or `ignore`) and `dlq_max_messages` properties. The Flink
processor surfaces a few corner cases as DLQ entries that the classic
processor logs and skips (for example, missing parent
keys in nested writes and exceptions thrown by `when` expressions on
`redis.lookup`). The DLQ entry field set and value encoding also
differ: the classic processor uses Python-stringified values,
while the Flink processor uses JSON.

## Performance

The Flink processor delivers significantly higher throughput during
the initial snapshot and lower end-to-end latency in steady state.
The classic processor uses a sequential read-process-write batching
cycle, so each record waits for its batch to complete before being
written to the target. The Flink processor pipelines records through
operator chains without a per-batch barrier, and parallelizes work
across all task slots, which both lowers per-record latency and
raises throughput.

The Flink processor has a larger baseline memory footprint (JVM plus
Flink runtime overhead per TaskManager) but, for most pipelines, the
performance gains and the additional features (caching, batching,
horizontal scaling, checkpointing) outweigh that cost.
