---
Title: Migrate from the classic processor to the Flink processor
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Learn how to migrate an existing RDI pipeline from the classic processor to the Apache Flink-based processor.
group: di
hideListLinks: false
linkTitle: Migrate to the Flink processor
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 35
---

RDI ships with two stream processor implementations. The *classic*
processor is implemented in Python. The *Flink* processor is built on top of
[Apache Flink](https://flink.apache.org/). Both run on VM and Kubernetes
installations. The Flink processor can achieve much higher throughput
during snapshots, scales horizontally by changing the number of TaskManager replicas,
and uses Flink checkpointing for fault tolerance. See [Stream processor implementations]({{< relref "/integrate/redis-data-integration/architecture#stream-processor-implementations" >}})
for an overview.

The classic processor is the default in RDI 1.19.0. The Flink processor is the
default starting with RDI 2.0.0. Select the processor explicitly when migrating.

This page describes how to migrate an existing pipeline from the classic
processor to the Flink processor. The steps are the same on VMs and Kubernetes,
except for the optional Helm-level tuning in [Step 1](#step-1-configure-the-flink-processor-at-the-helm-chart-level-kubernetes),
which applies to Kubernetes only.

## Before you migrate

For an upgrade from RDI 1.19.0 to 2.0.0, complete the processor migration on
1.19.0 before running the 2.0.0 installer. Save your existing configuration
and jobs, and wait for the initial snapshot to finish.

{{< warning >}}
Switching processors with records still in the RDI input streams can leave
records unprocessed. Stop collection and let the classic processor empty
the streams before switching. Zero consumer-group pending records or lag
does not prove that a stream is empty.
{{< /warning >}}

Confirm that your pipeline is compatible with the Flink processor:

-   `JSON.MERGE` semantics differ from the classic processor's Lua-based merge
    when null values are involved (see
    [`use_native_json_merge`]({{< relref "/integrate/redis-data-integration/reference/config-yaml-reference#processors" >}})).
    The Flink processor always uses the native `JSON.MERGE` command when the
    target database supports it.
-   Ensure your Kubernetes cluster or VM has enough capacity for the Flink JobManager
    and TaskManager pods (see
    [Configure the Flink processor]({{< relref "/integrate/redis-data-integration/installation/install-k8s#configure-the-flink-processor" >}})
    for the default sizing).

## Step 1: Configure the Flink processor at the Helm chart level (Kubernetes)

This step applies to **Kubernetes** installations only. On VM installations,
continue with [Step 2](#step-2-disable-source-collection).

The Flink processor is always available — no opt-in is required at the Helm
chart level. The defaults are sized for typical workloads, so you can skip
this step if you don't need to override them. To adjust the JobManager and
TaskManager defaults, add an `operator.dataPlane.flinkProcessor` block to
your `rdi-values.yaml` file and run `helm upgrade` as described in
[Configure the Flink processor]({{< relref "/integrate/redis-data-integration/installation/install-k8s#configure-the-flink-processor" >}}).
Existing pipelines continue to run on the classic processor until you switch
them in [Step 4](#step-4-switch-processors-and-resume-collection).

For VM installations, skip this step. You can configure per-pipeline Flink
resources in [Step 7](#step-7-tune-the-flink-processor-optional).

## Step 2: Disable source collection

In your existing `config.yaml`, add `active: false` under the source and
keep `processors.type` set to `classic`. Use your existing source name and
preserve all other source, target, processor, and job settings. This example
shows only the fields to change:

```yaml
sources:
  <existing-source-name>:
    active: false
processors:
  type: classic
```

Deploy the complete configuration directory, including the existing jobs:

```bash
redis-di deploy default --dir <pipeline-directory>
```

Replace `default` if your pipeline has a different name. Wait for the
deployment to finish and the source collector to stop. Keep the pipeline
active so the classic processor can process the remaining input records.
Do not use `redis-di stop` for this step, because it also stops the processor.

Applications can continue writing to the source database while collection
is disabled. Ensure that its change logs retain all changes for the entire
pause, so collection can resume from the saved position.

## Step 3: Wait for the input streams to empty

Connect an authenticated Redis client to the **RDI database** that stores
the pipeline's input streams. Check the actual stream lengths, rather than
the target database or the consumer-group counters.

For the default pipeline on RDI 1.19.0, find its input stream keys with
[`SCAN`]({{< relref "/commands/scan" >}}):

```text
SCAN 0 MATCH data:{rdi}:* COUNT 1000 TYPE stream
```

Repeat `SCAN` with the returned cursor until it returns cursor `0`. A scan
can return an empty page before it finishes. For a different pipeline,
use its input stream prefix. Do not include dead letter queue (DLQ) streams.

For every input stream returned, run
[`XLEN`]({{< relref "/commands/xlen" >}}):

```text
XLEN <input-stream-key>
```

After the collector has stopped, require every input stream to have length
`0` in three complete checks, five seconds apart. Repeat the scan in each
check and include every stream found. Missing statistics, a connection
error, or an unexpected empty stream inventory is not proof of a drain.

If records remain, keep the classic processor selected and resolve its
processing errors before continuing. Do not delete stream entries, reset
the pipeline, or change consumer-group positions to obtain an empty count.
Check rejected records separately: empty input streams do not prove that
every record reached the target or that DLQ history will survive a processor
change.

## Step 4: Switch processors and resume collection

After the drain check passes, remove the source's `active: false` setting
from the existing `config.yaml` and set
[`processors.type`]({{< relref "/integrate/redis-data-integration/data-pipelines/pipeline-config#processors" >}})
to `flink`:

```yaml
processors:
  type: flink
```

Keep the remaining configuration and jobs, then redeploy the complete
configuration directory:

```bash
redis-di deploy default --dir <pipeline-directory>
```

Wait for the classic processor to terminate and the Flink JobManager and
TaskManager workloads to become healthy. Confirm that collection resumes
from the saved source position and changes committed during the pause reach
the target. Verify new inserts, updates, and deletes before upgrading RDI.

## Step 5: Upgrade to RDI 2.0.0

If you are upgrading from 1.19.0 to 2.0.0, follow
[Upgrading RDI]({{< relref "/integrate/redis-data-integration/installation/upgrade" >}})
after the processor migration succeeds. Keep `processors.type: flink`
explicitly configured. After the upgrade, verify that the pipeline is
healthy and new source changes continue to reach the target.

## Step 6: Adapt deprecated and classic-only properties

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

The classic processor silently ignores `processors.advanced`,
and the Flink processor silently ignores classic-only top-level properties, so keeping
both top-level properties and their `processors.advanced` equivalents lets
you switch back without further edits.

## Step 7: Tune the Flink processor (optional)

Fine-tune the Flink processor through the `processors.advanced` section.
For example:

```yaml
processors:
  type: flink
  advanced:
    source:
      # Time between checks for new input streams.
      discovery.interval.ms: 1000
    flink:
      # Number of parallel task slots per TaskManager pod.
      taskmanager.numberOfTaskSlots: 2
      # Total memory budget for each TaskManager JVM process.
      taskmanager.memory.process.size: 4096m
    resources:
      taskManager:
        # Number of TaskManager pods.
        replicas: 2
```

See the
[`processors.advanced` reference]({{< relref "/integrate/redis-data-integration/reference/config-yaml-reference#processors" >}})
for the full set of available properties.

## Step 8: Update observability

The Flink processor exposes Prometheus metrics directly
from the Flink JobManager and TaskManager pods.
See
[Flink processor metrics]({{< relref "/integrate/redis-data-integration/observability#flink-processor-metrics" >}})
for the `ServiceMonitor` configuration and the available metrics.

## Rolling back

To revert a pipeline to the classic processor, set `processors.type` back to
`classic` and redeploy the pipeline. Do not remove the property: RDI 2.0.0
defaults to the Flink processor. The
`processors.advanced` section is silently ignored by the classic processor,
so you don't need to remove it before switching back.
