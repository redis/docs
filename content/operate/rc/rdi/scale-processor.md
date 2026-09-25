---
Title: Increase Cloud RDI pipeline capacity
aliases:
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

Every Cloud RDI pipeline uses the Flink processor. Pipeline capacity can be
limited by the collector, the RDI database, the processor, or the target
database. Identify the bottleneck before you change a setting.

Cloud RDI does not automatically add or remove TaskManagers based on CPU use,
pending records, throughput, or backpressure. Set the number of TaskManagers
when you need more processing capacity.

A pipeline supports up to 10 sources and up to 10 TaskManagers. Before you
scale near these limits, make sure the workspace has enough network capacity.
See [Capacity and network planning]({{< relref
"/operate/rc/rdi/faq#capacity-and-network-planning" >}}).

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
| Source | `poll.interval.ms` | Reduces the wait before the collector polls for CDC changes. |
| Source | `record.processing.threads` | Increases the threads that process captured records. |
| Sink | `redis.batch.size` | Increases the records written to the RDI database in each batch. |
| Sink | `redis.flush.interval.ms` | Reduces the maximum wait before the collector flushes a batch. |

Use only properties shown for the selected source. The available properties can
vary by source database.

Cloud RDI collectors have 2 CPUs and 8 GB of RAM. You cannot select a
different collector size. Test each change with a representative workload
before you use it in production.

Larger batches and queues use more collector memory. More snapshot and
record-processing threads share the same 2 CPUs. A shorter poll interval can
reduce CDC latency but can increase load on the source database. Change one
property at a time and use the Dashboard to compare throughput, pending
records, and processor load.

## Increase RDI database throughput

Each pipeline has an RDI database named `rdi-pipeline-bdb-<target_db_id>`. Its
default throughput is 25,000 operations per second (ops/sec). You can increase
the throughput to 50,000, 75,000, or 100,000 ops/sec.

1. In the Cloud console, open the RDI database for the pipeline.
1. Edit the database **Performance** settings.
1. Increase **Throughput** to the next value.
1. Check the pipeline Dashboard before making another increase.

Increase throughput gradually. Stop increasing it when the pipeline no longer
improves.

Increase RDI database throughput when the database frequently reports an
out-of-memory (OOM) state and the processor is not continuously **Busy**. This
can mean that the database cannot accept or serve records fast enough for the
pipeline.

## Increase processor capacity

1. From the Cloud RDI **Pipelines** list, select the pipeline.
1. Select the **Settings** tab and select **Edit**.
1. Add or update the `advanced.resources.taskManager.replicas` property with
   the number of TaskManagers you need. The value must be a whole number from
   `1` through `10`.
1. Select **Save changes**, then select **Apply and restart** to apply the
   change.

When you set this property, Cloud RDI uses that number of TaskManagers. If you
do not set it, Cloud RDI calculates the number from the pipeline parallelism
and the configured TaskManager slots. This is a configuration-time calculation,
not reactive autoscaling while the pipeline is running.

For API-based configuration, the same property is represented as follows:

```yaml
processors:
  advanced:
    resources:
      taskManager:
        replicas: 3
```

## Decide when to scale

Use the **Dashboard** to decide whether the processor needs more capacity:

- Check **Throughput** and **Pending**. A growing pending-record count or
  lower-than-required throughput can show that the processor needs
  investigation.
- Check **Processor load**. A processor that remains **Busy** while pending
  records grow can need more capacity. An **Idle** processor is waiting for
  changes from the sources.
- Check **RDI database load**. If the RDI database remains full or frequently
  reports an out-of-memory (OOM) state while the processor remains **Busy**,
  the processor might not read records as fast as collectors write them.
  Increasing the number of TaskManagers can help.

Check the source and target systems too. For example, a processor can be
**Idle** because the target database is overloaded. Increasing TaskManagers
does not remove a bottleneck outside the processor.

## Confirm the applied capacity

The **Dashboard** shows the processor replica count next to the processor
status. It shows the running count and configured count in the format
`running / configured replicas`. For example, `3 / 3 replicas` means three
TaskManagers are running and the pipeline is configured for three. If only one
count is available, the Dashboard identifies it as either running or configured.

The console metrics show data-stream record counts and pending records. They do
not include a TaskManager replica-count metric.

If your organization collects Prometheus metrics for RDI, use them to
investigate processor behavior. They do not provide a TaskManager replica-count
metric.

For programmatic confirmation, get the [pipeline status]({{< relref
"/integrate/redis-data-integration/reference/api-reference" >}}) and inspect
the `flink-processor` entry in `components`. Its `replicas` value is the number
of ready processor replicas. For example:

```json
{
  "name": "flink-processor",
  "replicas": 3
}
```

Billing is not a real-time way to confirm that a scaling change has completed.
Use the Dashboard or the status API instead.
