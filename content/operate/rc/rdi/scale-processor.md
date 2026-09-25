---
Title: Scale a data pipeline processor
aliases:
    - /operate/rc/databases/rdi/scale-processor/
    - /operate/rc/databases/rdi/scale-processor
alwaysopen: false
categories:
- docs
- operate
- rc
description: Change the processing capacity of a Redis Cloud data pipeline.
hideListLinks: true
weight: 5
---

Cloud RDI pipelines that use the Flink processor can run more than one
TaskManager. Adding TaskManagers increases the processing capacity available to
the pipeline.

Cloud RDI does not automatically add or remove TaskManagers based on CPU use,
pending records, throughput, or backpressure. Set the number of TaskManagers
when you need more processing capacity.

{{< note >}}
This setting applies only to Flink pipelines. Classic pipelines do not use
Flink TaskManagers.
{{< /note >}}

## Set the number of TaskManagers

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
- Check **RDI database load**. If the RDI database remains in an out-of-memory
  state, the processor cannot process data fast enough. Increasing the number
  of TaskManagers can help.

Check the source and target systems too. Increasing TaskManagers does not
remove a bottleneck outside the processor.

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
