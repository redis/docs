---
Title: FAQ
aliases:
    - /operate/rc/databases/rdi/faq/
    - /operate/rc/databases/rdi/faq
alwaysopen: false
categories:
- docs
- operate
- rc
description: Find answers to common questions about Redis Cloud Data Integration.
hideListLinks: true
weight: 6
---

## Does Cloud RDI automatically scale the Flink processor?

No. Cloud RDI does not automatically add or remove TaskManagers based on
processor load, pending records, throughput, or backpressure. Set the desired
number of TaskManagers with
`advanced.resources.taskManager.replicas`. See [Scale a data pipeline
processor]({{< relref "/operate/rc/rdi/scale-processor" >}}).

## How do I increase processing capacity for a pipeline?

For a Flink pipeline, edit its advanced properties and set
`advanced.resources.taskManager.replicas` to the needed number. Save the
change, then apply and restart the pipeline. The setting does not apply to
Classic pipelines.

## Can I see that the processor has scaled in the console?

The pipeline configuration shows the requested number of TaskManagers. The
Cloud RDI console does not currently show the ready replica count or a scale
event. Its Metrics tab shows processing behavior, such as throughput and
backpressure, but not the replica count.

For the ready replica count, use the RDI API pipeline-status response and
inspect the `flink-processor` component's `replicas` value. See [Confirm the
applied capacity]({{< relref "/operate/rc/rdi/scale-processor" >}}).

## Can I use billing to confirm a scaling change?

No. Billing is not a real-time deployment-status signal. Use the pipeline
configuration, processor metrics, or the RDI API status instead.
