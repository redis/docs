---
Title: Migrate from the classic processor to the Flink processor
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Learn how to migrate an existing RDI pipeline from the classic stream processor to the Apache Flink-based processor.
group: di
hideListLinks: false
linkTitle: Migrate to the Flink processor
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 35
---

RDI ships with two stream processor implementations. The default *classic*
processor is implemented in Python and runs on both VMs and Kubernetes. The
*Flink* processor is built on top of [Apache Flink](https://flink.apache.org/)
and currently runs on Kubernetes only. It can achieve much higher throughput 
during snapshots, scales horizontally by changing the number of TaskManager replicas, 
and uses Flink checkpointing for fault tolerance. See [Stream processor implementations]({{< relref "/integrate/redis-data-integration/architecture#stream-processor-implementations" >}})
for an overview.

This page describes how to migrate an existing pipeline from the classic
processor to the Flink processor.

{{< note >}}The Flink processor is currently supported on Kubernetes only. VM
installations must continue to use the classic processor.{{< /note >}}

## Before you migrate

Confirm that your pipeline is compatible with the Flink processor:

-   The Flink processor supports `hash` and `json` target data types only. If
    any of your jobs use the `set`, `sorted_set`, `stream`, or `string` data
    types, those jobs must be rewritten or kept on the classic processor.
-   `JSON.MERGE` semantics differ from the classic processor's Lua-based merge
    when null values are involved (see
    [`use_native_json_merge`]({{< relref "/integrate/redis-data-integration/reference/config-yaml-reference#processors" >}})).
    The Flink processor always uses the native `JSON.MERGE` command when the
    target database supports it.
-   Ensure your Kubernetes cluster has enough capacity for the Flink JobManager
    and TaskManager pods (see
    [Configure the Flink processor]({{< relref "/integrate/redis-data-integration/installation/install-k8s#configure-the-flink-processor" >}})
    for the default sizing).

## Step 1: Configure the Flink processor at the Helm chart level

The Flink processor is always available — no opt-in is required at the Helm
chart level. The defaults are sized for typical workloads, so you can skip
this step if you don't need to override them. To adjust the JobManager and
TaskManager defaults, add an `operator.dataPlane.flinkProcessor` block to
your `rdi-values.yaml` file and run `helm upgrade` as described in
[Configure the Flink processor]({{< relref "/integrate/redis-data-integration/installation/install-k8s#configure-the-flink-processor" >}}).
Existing pipelines continue to run on the classic processor until you switch
them in step 2.

## Step 2: Switch the pipeline to the Flink processor

In the pipeline's `config.yaml`, set
[`processors.type`]({{< relref "/integrate/redis-data-integration/data-pipelines/pipeline-config#processors" >}})
to `flink`:

```yaml
processors:
  type: flink
  ...
```

Then redeploy the pipeline. The operator stops the classic processor pods
and starts the Flink JobManager and TaskManager workloads for the pipeline.

## Step 3: Adapt deprecated and Classic-only properties

Some `processors` properties are no-ops, classic-only, or have moved to
`processors.advanced` for the Flink processor. The following table lists the
properties that need attention when migrating.

| Property | Action when migrating to Flink |
| :-- | :-- |
| `on_failed_retry_interval` | No-op. Remove. |
| `duration` | No-op. Use `read_batch_timeout_ms` instead. |
| `dedup`, `dedup_max_size`, `dedup_strategy` | Classic-only. Remove. |
| `enable_async_processing`, `batch_queue_size`, `ack_queue_size` | Classic-only. Remove. |
| `initial_sync_processes` | Classic-only. Configure parallelism through `advanced.flink.taskmanager.numberOfTaskSlots` and `advanced.resources.taskManager.replicas` instead. |
| `idle_streams_check_interval_ms`, `busy_streams_check_interval_ms` | Classic-only. Use `processors.advanced.source.discovery.interval.ms` for a single discovery interval. |
| `idle_sleep_time_ms` | Classic-only. Remove. |
| `use_native_json_merge` | Classic-only. The Flink processor always uses `JSON.MERGE` when the target supports it. |

The classic processor silently ignores `processors.advanced`, so keeping
both top-level properties and their `processors.advanced` equivalents lets
you switch back without further edits.

## Step 4: Tune the Flink processor (optional)

Fine-tune the Flink processor through the `processors.advanced` section.
For example:

```yaml
processors:
  type: flink
  advanced:
    source:
      # Time between checks for new input streams.
      discovery.interval.ms: 1000
    target:
      # Verify writes are replicated before acknowledging.
      wait.enabled: true
      wait.write.timeout.ms: 1000
    flink:
      # Number of parallel task slots per TaskManager pod.
      taskmanager.numberOfTaskSlots: 2
      # Total memory budget for each TaskManager JVM process.
      taskmanager.memory.process.size: 4096m
    resources:
      taskManager:
        # Number of TaskManager pods
        replicas: 2
```

See the
[`processors.advanced` reference]({{< relref "/integrate/redis-data-integration/reference/config-yaml-reference#processors" >}})
for the full set of available properties.

## Step 5: Update observability

The Flink processor does not use `rdi-metrics-exporter`. It exposes
Prometheus metrics directly from the Flink JobManager and TaskManager pods.
See
[Flink processor metrics]({{< relref "/integrate/redis-data-integration/observability#flink-processor-metrics" >}})
for the `ServiceMonitor` configuration and the available metrics.

## Rolling back

To revert a pipeline to the classic processor, set `processors.type` back to
`classic` (or remove the property) and redeploy the pipeline. The
`processors.advanced` section is silently ignored by the classic processor,
so you don't need to remove it before switching back.
