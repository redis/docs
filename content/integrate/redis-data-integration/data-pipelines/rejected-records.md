---
Title: Rejected records
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Learn how RDI stores records that cannot be processed.
group: di
linkTitle: Rejected records
summary: Redis Data Integration stores records that cannot be processed in a dead letter queue.
type: integration
weight: 45
---

Redis Data Integration (RDI) sends records that it cannot process to a dead letter
queue (DLQ). In the Redis Cloud UI, these records are called **rejected records**.

Rejected records help you understand which source tables are affected and why
specific records could not continue through the pipeline. They are intended for
troubleshooting and support, not for normal pipeline operation.

## When records are rejected

RDI can reject a record when it cannot safely transform or write the change event.
Common causes include:

- The incoming change event is malformed or missing required metadata.
- A transformation job fails while processing the record.
- A target write fails, for example because the target key already has an incompatible data type.

By default, RDI stores rejected records instead of silently dropping them. You can
change this behavior with the `processors.error_handling` setting. See the
[pipeline configuration file]({{< relref "/integrate/redis-data-integration/data-pipelines/pipeline-config" >}})
for more information.

## How RDI stores rejected records

RDI stores rejected records in the RDI database as capped Redis streams. Each DLQ
stream corresponds to a source table and tracks the records rejected for that
table.

The maximum number of records stored per DLQ stream is controlled by
`processors.dlq_max_messages`. When the stream reaches the configured limit,
older entries are evicted as newer entries are added.

## What to inspect

Start with the rejected count for each affected table, then inspect a sample
record from the table with the highest count or the table that matters most to
your application.

Useful fields include:

- The affected table.
- The rejection time.
- The rejected operation, such as create, update, delete, or snapshot read.
- The rejection reason.
- The transformation job or operation, when the failure happened during transformation.

{{< note >}}
Rejected records can contain source data when you inspect them directly with CLI
or API tools. Treat DLQ contents as sensitive customer data. The Redis Cloud UI
shows a limited set of troubleshooting metadata and does not show the original
record payload.
{{< /note >}}

## Resolve rejected records

Use the rejection reason to identify the likely fix:

- If a transformation job failed, update the job configuration and deploy the pipeline change.
- If target writes failed because of incompatible existing keys, update the target data or key mapping.
- If records are malformed, inspect the source connector and source database change data capture configuration.

RDI does not automatically replay records from the DLQ after you fix the cause.
If you need existing source data to be processed again, reset the pipeline after
applying the fix. See [Reset data pipeline]({{< relref "/operate/rc/rdi/view-edit#reset-data-pipeline" >}})
for Redis Cloud, or use the appropriate self-managed RDI reset workflow.

## CLI and API access

For self-managed RDI, use the [`redis-di get-rejected`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-get-rejected" >}})
command to inspect rejected records.

RDI API v2 also includes DLQ inspection endpoints. See the
[API reference]({{< relref "/integrate/redis-data-integration/reference/api-reference" >}})
for endpoint details.
