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

The following are starting points for a collector with eight CPU cores. Test
them with a representative workload before you use them in production.

### Prioritize snapshot throughput

Use this profile when completing the initial snapshot is more important than
CDC latency.

| Collector section | Property | Value |
| --- | --- | --- |
| Source | `snapshot.max.threads` | `2` |
| Source | `snapshot.fetch.size` | `40000` |
| Source | `max.batch.size` | `16000` |
| Source | `max.queue.size` | `92000` |
| Source | `poll.interval.ms` | `10` |
| Source | `record.processing.threads` | `6` |
| Sink | `redis.batch.size` | `10000` |
| Sink | `redis.flush.interval.ms` | `1` |

This profile assigns two snapshot threads and six record-processing threads.
The queue needs enough collector memory to buffer 92,000 records.

### Prioritize CDC latency

Use this profile when CDC latency is more important than snapshot throughput.

| Collector section | Property | Value |
| --- | --- | --- |
| Source | `snapshot.max.threads` | `1` |
| Source | `snapshot.fetch.size` | `40000` |
| Source | `max.batch.size` | `32000` |
| Source | `max.queue.size` | `140000` |
| Source | `poll.interval.ms` | `1` |
| Source | `record.processing.threads` | `8` |
| Sink | `redis.batch.size` | `12000` |
| Sink | `redis.flush.interval.ms` | `1` |

This profile uses frequent polling to reduce CDC latency. The 140,000-record
queue needs more collector memory. Monitor the collector memory use and lower
the queue size if memory pressure occurs.

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
   the number of TaskManagers you need. The value must be a whole number of at
   least `1`.
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
investigate processor behavior. They are not a replacement for the status API
when you need the ready replica count.

If you use the RDI API, get the [pipeline status]({{< relref
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
