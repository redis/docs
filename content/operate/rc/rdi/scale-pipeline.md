---
Title: Scale a Cloud RDI pipeline
aliases:
    - /operate/rc/rdi/scale-processor/
    - /operate/rc/rdi/scale-processor
    - /operate/rc/databases/rdi/scale-processor/
    - /operate/rc/databases/rdi/scale-processor
alwaysopen: false
categories:
- docs
- operate
- rc
description: Increase collector, RDI database, and processor capacity for a Cloud RDI pipeline.
hideListLinks: true
weight: 5
---

Every Redis Data Integration (RDI) pipeline in Redis Cloud uses the Flink
processor. The collector, RDI database, processor, or target database can
limit pipeline capacity. Identify the bottleneck before you change a setting.

Cloud RDI does not automatically add or remove processor replicas
(TaskManagers) based on load, pending records, throughput, or backpressure.
Set the number of processor replicas when you need more processing capacity.

## Plan workspace network capacity

Choose the workspace Classless Inter-Domain Routing (CIDR) range for all
pipelines you plan to run. All sources and processor replicas share the
workspace's network capacity. Each source uses a collector. Each TaskManager
is a processor replica. Adding either uses more workspace addresses.

The console suggests a `/22` range. If you expect more than 5 sources or more
than 5 processor replicas in total across the workspace, choose a `/21` or
larger range when you create it. For further growth, consider a `/20` or larger
range. A `/21` has twice the address space of a `/22`; a `/20` has twice that
of a `/21`. Doubling the address space does not guarantee twice as many
sources or processor replicas.

This is conservative planning guidance, not a guaranteed capacity limit.
Leave room for planned growth, replacement resources, and maintenance.
The range must also meet the requirements of your connectivity method and
must not overlap with connected networks.

### Processor capacity by CIDR

Use this table as a reference for processor address capacity. The reference
configuration uses RDI 2.0.0 on Amazon Web Services (AWS), with three
availability zones. It has one pipeline, no sources, and two control-plane
nodes. Each processor requests one central processing unit (CPU) and 5 GiB
of memory. Temporary workspace scaling overrides allow the configured counts
in the table. The allocation window is 10 minutes per scaling request.

Configured replicas are the requested count. Ready replicas are running
processors that pass readiness checks. Both columns count processors only.
They exclude source collectors and control-plane nodes. These resources
also use workspace addresses.

| Workspace CIDR | Configured replicas | Ready replicas | Capacity constraint |
| --- | ---: | ---: | --- |
| `/22` | 15 | 14 | Address blocks exhausted in the assigned subnet. Another zone retained a block. |
| `/21` | 50 | 32 | Address blocks exhausted in all worker subnets. Allocation requests were also throttled. |
| `/20` | 50 | 50 | Capacity for at least 50 replicas in this configuration. The upper limit is not established. |

The `/22` and `/21` figures use gradual scaling. The `/20` figure uses a
direct request for 50 replicas.

The counts of 14 and 32 are not fixed workspace limits. Address distribution
across zones and allocation throttling also affect scaling. The table does
not define supported replica limits, throughput, or combined source and
processor capacity. Reserve addresses for collectors, other pipelines,
growth, and maintenance.

You cannot enlarge an existing workspace CIDR. A larger range requires
[workspace recreation](/content/operate/rc/rdi/faq.md#change-workspace-cidr). See
[Create a workspace](/content/operate/rc/rdi/create-workspace.md) for CIDR
selection and connectivity requirements.

## Identify the bottleneck

Use the **Dashboard** to compare **Throughput**, **Pending**, **Processor load**,
and **RDI database load** before you change capacity:

- If ingestion from a source is slow and the processor has spare capacity,
  check the source's diagnostics in **Metrics** before tuning collector
  properties.
- If the processor stays at capacity while pending records grow, consider
  increasing processor replicas.
- If the processor is backpressured, check target database performance and
  connectivity before adding processor replicas.
- If the RDI database stays full or reports out-of-memory (OOM) errors, check
  ingestion and processing rates, database memory, and throughput. OOM alone
  does not identify which capacity setting to change.

Change one setting at a time and compare the same representative workload.
Confirm that the change improves throughput or reduces pending records before
making another increase.

## Increase collector ingestion capacity

Tune collector properties when the collector cannot ingest data from the
source quickly enough. These properties are specific to each source. In the
Cloud console, select the source in **Configuration**, then select **Edit
collector properties**.

The console exposes these commonly tuned Debezium properties when they apply to
the selected source:

| Collector section | Property | Effect |
| --- | --- | --- |
| Source | `snapshot.max.threads` | Increases the threads used for the initial snapshot. |
| Source | `snapshot.fetch.size` | Increases the rows fetched in each snapshot batch. |
| Source | `max.batch.size` | Increases the records processed in each batch. |
| Source | `max.queue.size` | Increases the records buffered in collector memory. |
| Source | `poll.interval.ms` | Sets the wait before the collector polls for change data capture (CDC) changes. |
| Source | `record.processing.threads` | Increases the threads that process captured records. |
| Sink | `redis.batch.size` | Increases the records written to the RDI database in each batch. |
| Sink | `redis.flush.interval.ms` | Reduces the maximum wait before the collector flushes a batch. |

Use only properties shown for the selected source. The available properties can
vary by source database.

Cloud RDI collectors have 2 CPUs and 8 GB of
random access memory (RAM). You cannot select a different collector size.
Test each change with a representative workload before you use it in production.

Larger batches and queues use more collector memory. More snapshot and
record-processing threads share the same 2 CPUs. A shorter poll interval can
reduce CDC latency but can increase load on the source database. Change one
property at a time and use the Dashboard to compare throughput, pending
records, and processor load.

## Increase RDI database throughput

Each pipeline has an RDI database. When database throughput limits ingestion
or processing, choose a higher throughput value from its **Performance**
settings.

1. In the Cloud console, open the RDI database for the pipeline.
1. Edit the database **Performance** settings.
1. Increase **Throughput** to the next available value.
1. Check the pipeline Dashboard before making another increase.

Stop increasing throughput when the pipeline no longer improves. Check
processor and target performance too. More database throughput does not
resolve a bottleneck in another component.

## Increase processor capacity

1. From the Cloud RDI **Pipelines** list, select the pipeline.
1. Select the **Settings** tab.
1. Select **Edit**.
1. Add or update the `advanced.resources.taskManager.replicas` property with
   the number of processor replicas you need. Use a positive whole number
   accepted by the console and check [workspace network capacity](#plan-workspace-network-capacity)
   before you increase it.
1. Select **Save changes**.
1. Select **Apply and restart** to apply the change. This temporarily
   interrupts processing.

This property sets the desired processor replica count. After the restart,
check the running count and pipeline performance. More replicas do not
guarantee higher throughput.

For application programming interface (API) configuration, the same property
is represented as follows:

```yaml
processors:
  advanced:
    resources:
      taskManager:
        replicas: 3
```

## Confirm the applied capacity

The **Dashboard** shows the processor replica count next to the processor
status. It shows the running count and configured count in the format
`running / configured replicas`. For example, `3 / 3 replicas` means three
TaskManagers are running. The configured count is also three. If only one
count is available, the Dashboard labels it as running or configured.

The running count can be lower while a restart is in progress. If it remains
below the configured count after the restart, check pipeline and source status
for errors and contact [Redis support](https://redis.io/support/). Network
capacity can prevent additional replicas from starting. Increasing the
configured count again does not resolve a network capacity shortage.

The console metrics show data-stream record counts and pending records. They do
not include a TaskManager replica-count metric.

For programmatic confirmation, use the [Redis Cloud API](/content/operate/rc/api/api-reference.md#tag/Data-Integration)
to send a `GET` request to
`/v1/subscriptions/<subscription-id>/data-integration-workspace/rdi/api/v2/pipelines/<pipeline-name>/status`.
Inspect the `flink-processor` entry in `components`. Its `replicas` value is
the number of ready processor replicas. For example:

```json
{
  "name": "flink-processor",
  "replicas": 3
}
```

Billing is not a real-time way to confirm that a scaling change has completed.
Use the Dashboard or the status API instead.
