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

A pipeline reset clears the internal RDI state for all sources, including their saved positions. When the pipeline runs, RDI takes a new snapshot of the selected data from every source, applies the current transformations, and then resumes streaming changes. If you reset a stopped pipeline, it remains stopped until you start it.

A reset does **not** flush the target Redis database. Records already in the target remain until RDI overwrites or deletes them through normal processing. Keys that are no longer produced by the current dataset or transformations can remain in the target after a reset. For example, changing a transformation's key prefix and resetting creates keys with the new prefix without deleting keys with the old prefix.

See [Reset data pipeline]({{< relref "/operate/rc/rdi/view-edit#reset-data-pipeline" >}}) for the steps.

### What happens when I flush the target database?

**Flush target database** permanently deletes all data from the shared target, including data from every source and data written outside RDI. Stop the pipeline before flushing. The source databases are not changed.

Flushing does not clear RDI's saved source positions. If you only start the pipeline afterwards, it resumes from those positions. It does not automatically reload records that have not changed in the source.

See [Flush the target database]({{< relref "/operate/rc/rdi/view-edit#flush-the-target-database" >}}).

### How do I reload data after a flush? {#reload-after-flush}

1. Wait for the flush to finish.
1. [Reset the pipeline]({{< relref "/operate/rc/rdi/view-edit#reset-data-pipeline" >}}) while it is stopped, and wait for the reset to finish.
1. [Start the pipeline]({{< relref "/operate/rc/rdi/view-edit#stop-and-restart-data-pipeline" >}}) to take new snapshots of the selected data from all sources.
1. Check each source's initial sync progress and record counts on the **Dashboard** and **Metrics** tabs. Wait for initial sync to finish before relying on the target as a complete copy of the selected data.

RDI reloads data available in the source databases using the current dataset and transformation settings. It cannot restore data that existed only in the target.

## Multiple sources

### What happens when I reset one source? {#reset-one-source}

RDI clears the selected source's internal state and takes a new snapshot of its selected data. The whole pipeline, including the other sources and the processor, restarts during this operation. Other sources keep their saved positions and resume streaming without a new snapshot.

All records already in the target remain, including records from the reset source. The new snapshot can overwrite that source's records. Resetting a source does not selectively delete its target data.

See [Reset a source]({{< relref "/operate/rc/rdi/view-edit#reset-source" >}}).

### Can I flush data for a single source? {#flush-one-source}

Currently, RDI cannot flush target data for a single source. Connect to the target Redis database and selectively delete the records you want to remove. Identify them from your key naming and transformation rules, and check that other sources do not write to the same keys. Do not use **Flush target database** for this purpose: it deletes data for all sources.

Stop the affected source before deleting its records and allow its pending records to finish processing. Starting the source resumes ingestion, and later changes can recreate records. To reload all its selected data, [reset that source]({{< relref "/operate/rc/rdi/view-edit#reset-source" >}}).

### Does deleting a source delete its target data?

No. Deleting a source removes its pipeline configuration and internal RDI state. Records it already wrote to the target remain. You must remove or reassign transformation jobs that refer to the source before deleting it. See [Remove a source]({{< relref "/operate/rc/rdi/view-edit#remove-source" >}}).

## Upgrades and maintenance

### What happens during an RDI Cloud upgrade?

Redis manages RDI upgrades in Redis Cloud. Maintenance follows your Redis Cloud Pro subscription's [maintenance window]({{< relref "/operate/rc/rdi#maintenance-windows" >}}).

During an upgrade, monitoring may be temporarily unavailable, and ingestion pauses while the pipeline components restart. A streaming pipeline then resumes from its saved state and processes the changes accumulated during the interruption.

A routine upgrade does not flush the target database or require you to reset the pipeline. Existing target records remain available, but they may temporarily lag behind the source data.

## Billing

### How is RDI usage calculated?

RDI usage is measured in RDI processing units (RPUs). The usage consists of:

| Component | RPUs |
| :-- | --: |
| Workspace with a deployed pipeline | 1 |
| Each running source collector | 2 |
| Each running processor replica | 2 |

Usage is measured every minute and billed using the peak usage in each hour. Adding sources or processor replicas increases usage. Initial sync and streaming use the same RPU rate. The price per RPU depends on your region and pricing plan. Contact your Redis account team for the applicable rate.

For example, one workspace with one source and one processor replica uses `1 + 2 + 2 = 5 RPUs`. With two sources and one processor replica, it uses `1 + 4 + 2 = 7 RPUs`. Adding a second processor replica increases that to `1 + 4 + 4 = 9 RPUs`.

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

Delete an unused pipeline and then [delete its workspace]({{< relref "/operate/rc/rdi/create-workspace#delete-workspace" >}}) when you no longer need RDI. This does not delete the target Redis database or stop its separate charges.
