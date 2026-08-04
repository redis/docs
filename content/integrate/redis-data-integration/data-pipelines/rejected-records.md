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

DLQ stream names use the `dlq:` prefix followed by the source data stream name.
In current RDI versions, the stream name is typically:

```text
dlq:data:{rdi}:<schema_or_database>.<table>
```

For example, rejected records for the `public.users` table are stored in:

```text
dlq:data:{rdi}:public.users
```

For sources that include the source name in the stream qualifier, the final part
can contain three components:

```text
dlq:data:{rdi}:<source>.<schema_or_database>.<table>
```

Some RDI versions or configurations can use a hash-tagged variant such as
`dlq:{data:rdi:<schema_or_database>.<table>}`. To find all DLQ streams in the
RDI database, scan for stream keys that start with `dlq:`.

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
- The rejected operation. RDI stores this as an `opcode` value such as `c`,
  `u`, `d`, `r`, `t`, or `m`. See [Using the operation code]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples/redis-opcode-example" >}})
  for the operation labels.
- The rejection reason.
- The transformation job or operation, when the failure happened during transformation.

{{< note >}}
Rejected records can contain source data when you inspect them directly in the
RDI database. Treat DLQ contents as sensitive customer data. The Redis Cloud UI
uses the RDI DLQ API and shows a sanitized set of troubleshooting metadata. It
does not show the original record payload or every field stored in the
corresponding DLQ stream.
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

For self-managed RDI, use the [`redis-di list-dlqs`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-list-dlqs" >}})
command to see the dead-letter queues and the
[`redis-di list-dlq-records`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-list-dlq-records" >}})
command (also available as `redis-di get-rejected`) to inspect the rejected records of a queue.

For Redis Cloud RDI, connect to the RDI database and inspect the corresponding
DLQ streams directly when you need details that are not shown in the Redis Cloud
UI.

RDI API v2 also includes DLQ inspection endpoints. See the
[API reference]({{< relref "/integrate/redis-data-integration/reference/api-reference" >}})
for endpoint details.
