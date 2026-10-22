---
Title: RDI Cloud FAQ
alwaysopen: false
categories:
- docs
- operate
- rc
description: Answers to common questions about RDI on Redis Cloud.
hideListLinks: true
weight: 6
---

## Data recovery

### What happens when I reset the pipeline? {#reset-pipeline}

A pipeline reset clears the internal RDI state for all sources, including their saved positions. When the pipeline runs, each source follows its configured initial data load settings. With the default `initial` mode, Debezium sources take new snapshots, apply the current transformations, and resume streaming. Other [snapshot modes](/content/integrate/redis-data-integration/data-pipelines/pipeline-config.md#choose-a-snapshot-mode) can skip existing rows or omit ongoing change capture. If you reset a stopped pipeline, it remains stopped until you start it.

A reset does **not** flush the target Redis database. Records already in the target remain until RDI overwrites or deletes them through normal processing. Keys that are no longer produced by the current dataset or transformations can remain in the target after a reset. For example, changing a transformation's key prefix and resetting creates keys with the new prefix without deleting keys with the old prefix.

See [Reset data pipeline](/content/operate/rc/rdi/view-edit.md#reset-data-pipeline) for the steps.

### Why can records remain after a recovery snapshot? {#missed-deletes}

A new snapshot can leave stale records in Redis. If a source row was deleted while
collection was interrupted and the required log history expired, the snapshot cannot
replay its delete event. This applies to Debezium sources with `type: cdc`, including
automatic snapshots with `when_needed` and snapshots after a manual reset.

The sequence is:

1. A source row is copied to Redis.
1. Collection stops, and the collector saves its source position.
1. The source deletes the row while Redis still has it.
1. The saved position becomes unavailable, so the delete cannot be replayed.
1. `when_needed` mode takes a new snapshot. The deleted row is absent.
1. Streaming resumes, but Redis still has the stale row because its delete was missed.

An interruption alone does not cause this gap. The saved position must become
unavailable. The snapshot does not clean up the target, and a reset does not flush it.
See the [detailed missed-delete sequence](/content/integrate/redis-data-integration/data-pipelines/pipeline-config.md#missed-deletes)
and [recovery guidance](/content/integrate/redis-data-integration/troubleshooting.md#unavailable-source-history).

### What happens when I flush the target database?

**Flush target database** permanently deletes all data from the shared target, including data from every source and data written outside RDI. Stop the pipeline before flushing. The source databases are not changed.

Flushing does not clear RDI's saved source positions. Starting a Debezium source follows its [snapshot mode](/content/integrate/redis-data-integration/data-pipelines/pipeline-config.md#choose-a-snapshot-mode). With the default `initial` mode and a valid saved position, it resumes streaming without reloading unchanged source rows.

See [Flush the target database](/content/operate/rc/rdi/view-edit.md#flush-the-target-database).

### How do I reload data after a flush? {#reload-after-flush}

Before reloading, check each source's initial data load settings. For Debezium sources,
select a [snapshot mode](/content/integrate/redis-data-integration/data-pipelines/pipeline-config.md#choose-a-snapshot-mode) that loads existing rows, such as
`initial`. Modes that skip data snapshots cannot refill the target's existing rows.

1. Wait for the flush to finish.
1. [Reset the pipeline](/content/operate/rc/rdi/view-edit.md#reset-data-pipeline) while it is stopped, and wait for the reset to finish.
1. [Start the pipeline](/content/operate/rc/rdi/view-edit.md#stop-and-restart-data-pipeline) to take new snapshots of the selected data from all sources.
1. Check each source's initial sync progress and record counts on the **Dashboard** and **Metrics** tabs. Wait for initial sync to finish before relying on the target as a complete copy of the selected data.

RDI reloads data available in the source databases using the current dataset and transformation settings. It cannot restore data that existed only in the target.

## Multiple sources

### What happens when I reset one source? {#reset-one-source}

RDI clears the selected source's internal state, including its saved position. With the default `initial` mode, a Debezium source takes a new data snapshot. Other [snapshot modes](/content/integrate/redis-data-integration/data-pipelines/pipeline-config.md#choose-a-snapshot-mode) can skip existing rows or omit ongoing change capture. The whole pipeline, including the other sources and the processor, restarts. Other sources keep their saved positions but follow their configured modes on restart; `always` mode takes another snapshot even with a preserved position.

All records already in the target remain, including records from the reset source. The new snapshot can overwrite that source's records. Resetting a source does not selectively delete its target data.

See [Reset a source](/content/operate/rc/rdi/view-edit.md#reset-source).

### Can I flush data for a single source? {#flush-one-source}

Currently, RDI cannot flush target data for a single source. Connect to the target Redis database and selectively delete the records you want to remove. Identify them from your key naming and transformation rules, and check that other sources do not write to the same keys. Do not use **Flush target database** for this purpose: it deletes data for all sources.

Stop the affected source before deleting its records and allow its pending records to finish processing. Starting the source resumes ingestion, and later changes can recreate records. To reload all its selected data, select a mode that takes a data snapshot, then [reset that source](/content/operate/rc/rdi/view-edit.md#reset-source).

### Does deleting a source delete its target data?

No. Deleting a source removes its pipeline configuration and internal RDI state. Records it already wrote to the target remain. You must remove or reassign transformation jobs that refer to the source before deleting it. See [Remove a source](/content/operate/rc/rdi/view-edit.md#remove-source).

## Multiple pipelines

### Should I add a source or a pipeline? {#source-or-pipeline}

Add a source to an existing pipeline when the source writes to the same target database and you manage it together with the other sources. Create a separate pipeline when the data goes to a different target database, when you need different processor properties, or when you want to stop, reset, or change some of the data without restarting the rest. For example, [resetting one source](#reset-one-source) restarts its whole pipeline, but it doesn't restart any other pipeline. See [Add pipelines to a workspace](/content/operate/rc/rdi/create-workspace.md#add-pipelines-to-a-workspace).

### Does an action on one pipeline affect the other pipelines? {#pipeline-isolation}

No. Deploying, stopping, starting, resetting, editing, or deleting a pipeline doesn't change the other pipelines of the workspace. The exception is **Flush target database**, which deletes all the data in the target database, including the records of every other pipeline that writes to it.

The pipelines of a workspace share its network capacity and its RDI database, so a pipeline with a heavy load can reduce the capacity left for the others. See [Scale a Cloud RDI pipeline](/content/operate/rc/rdi/scale-pipeline.md).

## Capacity and network planning

### What CIDR range should I use for Cloud RDI?

Plan the Classless Inter-Domain Routing (CIDR) range for all pipelines in the
workspace, including future sources and processor replicas. You cannot enlarge
it after creation. See [Plan workspace network capacity](/content/operate/rc/rdi/scale-pipeline.md#plan-workspace-network-capacity)
for the `/22`, `/21`, and `/20` capacity table and its configuration.

### How do I change a workspace CIDR that is too small? {#change-workspace-cidr}

You cannot change or enlarge the CIDR of an existing workspace in place.
To use a larger range, [delete the existing workspace](/content/operate/rc/rdi/create-workspace.md#delete-workspace),
[create a workspace](/content/operate/rc/rdi/create-workspace.md#create-a-data-integration-workspace)
with the larger CIDR, and redeploy your pipelines.

Before you delete anything, record your pipeline configuration, source settings,
transformation jobs, and secret references. Recreation interrupts ingestion
and removes the saved pipeline state. Redeployed sources take new initial
snapshots. Records already written to the target database remain there.

For help planning the recreation and connectivity changes, open a
[Redis support ticket](https://redis.io/support/) before deleting anything. Include
your subscription and workspace identifiers, current CIDR, and planned totals for
sources and processor replicas across all pipelines.

## Upgrades and maintenance

### What happens during an RDI Cloud upgrade?

Redis manages RDI upgrades in Redis Cloud. Maintenance follows your Redis Cloud Pro subscription's [maintenance window](/content/operate/rc/rdi/_index.md#maintenance-windows).

During an upgrade, monitoring may be temporarily unavailable, and ingestion pauses while the pipeline components restart. With the default `initial` mode and valid saved positions, Debezium sources resume streaming and process the accumulated changes. Other [snapshot modes](/content/integrate/redis-data-integration/data-pipelines/pipeline-config.md#choose-a-snapshot-mode) or unavailable source history can change this behavior.

A routine upgrade does not flush the target database or require you to reset the pipeline. Existing target records remain available, but they may temporarily lag behind the source data.

## Billing

### How is RDI usage calculated?

RDI usage is measured in RDI processing units (RPUs). The usage consists of:

| Component | RPUs |
| :-- | --: |
| Workspace with at least one deployed pipeline | 1 |
| Each running source collector | 2 |
| Each running processor replica | 2 |

Usage is measured every minute and billed using the peak usage in each hour. Adding sources or processor replicas increases usage. Initial sync and streaming use the same RPU rate. The price per RPU depends on your region and pricing plan. Contact your Redis account team for the applicable rate.

For example, one workspace with one source and one processor replica uses `1 + 2 + 2 = 5 RPUs`. With two sources and one processor replica, it uses `1 + 4 + 2 = 7 RPUs`. Adding a second processor replica increases that to `1 + 4 + 4 = 9 RPUs`.

The workspace charge applies once, however many pipelines you deploy in the workspace. Each pipeline adds the RPUs of its own collectors and processor replicas. For example, a workspace with two deployed pipelines, each with one source and one processor replica, uses `1 + (2 + 2) + (2 + 2) = 9 RPUs`.

These examples cover RDI usage. Target Redis database and applicable network charges are separate.

### How does stopping sources or the pipeline affect billing? {#stopping-and-billing}

Stopping a source removes its collector usage, but the processor and workspace remain billable. Stopping every source individually still leaves the processor running. Stopping the whole pipeline also stops the processor, but the workspace charge continues while the pipeline remains deployed.

The following examples assume one workspace, two sources, and one processor replica. Each state must apply for a full billing hour after the stop has completed:

| State | Workspace RPUs | Collector RPUs | Processor RPUs | Total RPUs |
| :-- | --: | --: | --: | --: |
| Both sources running | 1 | 4 | 2 | 7 |
| One source stopped | 1 | 2 | 2 | 5 |
| Both sources stopped individually; pipeline still running | 1 | 0 | 2 | 3 |
| Whole pipeline stopped | 1 | 0 | 0 | 1 |

A brief stop might not reduce the charge for that hour. For example, if usage reaches 7 RPUs before you stop one source, the hourly peak remains 7 RPUs. A later full hour with that source stopped is billed at 5 RPUs, assuming the other resources stay the same.

### Am I charged if no source records change?

Yes. RDI usage is based on the running collectors and processor replicas, not the number of records processed. An idle streaming pipeline still uses resources.

### When does RDI billing start and stop?

Creating a workspace or saving a setup draft does not start RDI usage billing. Billing starts when a pipeline is deployed. Stopping the pipeline reduces usage to the workspace charge. Deleting the deployed pipeline ends new RDI usage when no deployed pipelines remain in the workspace; usage already recorded for the hour can still be billed.

Delete an unused pipeline and then [delete its workspace](/content/operate/rc/rdi/create-workspace.md#delete-workspace) when you no longer need RDI. This does not delete the target Redis database or stop its separate charges.

## Processor scaling

### Does Cloud RDI automatically scale the processor?

No. Set the desired processor replica count with
`advanced.resources.taskManager.replicas`. See [Increase processor capacity](/content/operate/rc/rdi/scale-pipeline.md#increase-processor-capacity).

### How do I increase processing capacity for a pipeline?

First [identify the bottleneck](/content/operate/rc/rdi/scale-pipeline.md#identify-the-bottleneck).
Then tune the collector, [RDI database](/content/operate/rc/rdi/scale-pipeline.md#increase-rdi-database-throughput),
or processor. Check shared
workspace network capacity before adding sources or processor replicas.

### Can I see that the processor has scaled in the console?

Yes. The **Dashboard** shows running and configured processor replicas next to
the processor status. See [Confirm the applied capacity](/content/operate/rc/rdi/scale-pipeline.md#confirm-the-applied-capacity)
for how to read the count and handle a persistent mismatch.

### Can I use billing to confirm a scaling change?

No. Billing does not show scaling changes in real time. Use the Dashboard or
the [Redis Cloud application programming interface (API)](/content/operate/rc/rdi/scale-pipeline.md#confirm-the-applied-capacity)
to confirm the running count.
