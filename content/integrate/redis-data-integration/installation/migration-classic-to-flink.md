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
default starting with RDI 2.0.0.

This page describes how to migrate an existing pipeline from the classic
processor to the Flink processor. The steps are the same on VMs and Kubernetes,
except for the optional Helm-level tuning in [Step 1](#step-1-configure-the-flink-processor-at-the-helm-chart-level-kubernetes),
which applies to Kubernetes only.

## Before you migrate

This procedure migrates the pipeline processor on RDI 1.19.0. It does not
upgrade RDI.

Before you start, save your existing configuration and jobs. Wait for the
initial snapshot to finish. Interrupting it causes the snapshot to restart
from the beginning.

{{< warning >}}
Switching processors with records still in the RDI input streams can leave
records unprocessed. Stop the collector and let the classic processor empty
the streams before switching.
{{< /warning >}}

Confirm that your pipeline is compatible with the Flink processor:

-   `JSON.MERGE` semantics differ from the classic processor's Lua-based merge
    when null values are involved (see
    [`use_native_json_merge`]({{< relref "/integrate/redis-data-integration/reference/config-yaml-reference#processors-data-processing-configuration" >}})).
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
resources in [Step 6](#step-6-tune-the-flink-processor-optional).

## Step 2: Disable source collection

In your existing `config.yaml`, add `active: false` under the source and set
`processors.type` to `classic`. Use your existing source name and preserve
all other source, target, processor, and job settings. This example shows
only the fields to change:

```yaml
sources:
  <existing-source-name>:
    active: false
processors:
  type: classic
```

Deploy the complete configuration directory, including the existing jobs:

```bash
redis-di deploy --dir <pipeline-config-directory>
```

Wait for the deployment to finish and the source collector to stop. Keep
the pipeline active so the classic processor can process the remaining input records.
Do not use `redis-di stop` for this step, because it also stops the processor.

Applications can continue writing to the source database while collection
is disabled. Make sure the database change log retains the whole paused
interval. When the collector restarts, it resumes from the saved source
position and processes those changes.

## Step 3: Wait for the input streams to empty

After the collector has stopped, wait for every input stream to have a length
of `0` in three complete checks, five seconds apart. An error, missing
statistics, or an unexpectedly empty stream list does not count as `0`.
Do not include DLQ streams. Use any of the following methods.

### Check with `redis-di`

Run:

```bash
redis-di describe default
```

In the **Statistics** table, the **Pending** value for each classic processor
stream is its current length. Confirm that every input stream is listed and
that the values agree with the Redis command checks below. This **Pending**
value is different from consumer-group pending entries. `XPENDING` or group
lag of `0` alone does not prove that a stream is empty.

### Check with Redis commands

Connect an authenticated Redis client to the **RDI database** that stores
the pipeline's input streams, not the target database. Find the input stream
keys with
[`SCAN`]({{< relref "/commands/scan" >}}):

```text
SCAN 0 MATCH data:{rdi}:* COUNT 1000 TYPE stream
```

If the returned cursor is not `0`, pass it to the next command:

```text
SCAN <returned-cursor> MATCH data:{rdi}:* COUNT 1000 TYPE stream
```

Repeat with each new cursor until the returned cursor is `0`, even if an
intermediate result contains no keys.

For every input stream returned, run
[`XLEN`]({{< relref "/commands/xlen" >}}):

```text
XLEN <input-stream-key>
```

Run a complete `SCAN` and all `XLEN` commands in each of the three checks.

### Check with Redis Insight

1.  Connect Redis Insight to the RDI database and open **Browse**.
1.  Filter by the pipeline's input stream pattern. For the default pipeline,
    use `data:{rdi}:*`. Confirm that all input streams are listed.
1.  Open each stream, select **Stream Data**, and use the refresh button.
    Confirm that **Entries** is `0`.
1.  Repeat the complete inventory and entry check three times, five seconds
    apart.

You can also open the built-in **CLI** and run the `SCAN` and `XLEN` commands
shown above. The Browser and CLI results must contain the same streams and
lengths.

If records remain, keep the classic processor running and resolve its
processing errors before continuing. Do not delete stream entries, reset the
pipeline, or move consumer-group positions to make the count reach `0`.

## Step 4: Switch processors and resume collection

After the drain check passes, remove the source's `active: false` setting
from the existing `config.yaml` and set
[`processors.type`]({{< relref "/integrate/redis-data-integration/data-pipelines/pipeline-config#processors" >}})
to `flink`:

```yaml
processors:
  type: flink
```

RDI 1.19.0 requires this setting because its default processor is `classic`.

Keep the remaining configuration and jobs, then redeploy the complete
configuration directory:

```bash
redis-di deploy --dir <pipeline-config-directory>
```

Wait for the classic processor to terminate and the Flink JobManager and
TaskManager workloads to become healthy. Confirm that collection resumes
from the saved source position and changes committed during the pause reach
the target. Verify new inserts, updates, and deletes. The processor migration
is complete after these checks pass.

## Step 5: Adapt deprecated and classic-only properties

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

## Step 6: Tune the Flink processor (optional)

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
[`processors.advanced` reference]({{< relref "/integrate/redis-data-integration/reference/config-yaml-reference#processorsadvanced-advanced-configuration" >}})
for the full set of available properties.

## Step 7: Update observability

The Flink processor exposes Prometheus metrics directly
from the Flink JobManager and TaskManager pods.
See
[Flink processor metrics]({{< relref "/integrate/redis-data-integration/observability#flink-processor-metrics" >}})
for the `ServiceMonitor` configuration and the available metrics.

## Rolling back

To revert a pipeline to the classic processor, set `processors.type` back to
`classic` and redeploy the pipeline. This setting is required on RDI 2.0.0,
where the default is `flink`. The classic processor silently ignores
`processors.advanced`, so you don't need to remove it before switching back.
