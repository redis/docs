---
Title: Redis Data Integration interactive demo
alwaysopen: false
categories:
- docs
- develop
- ai
description: Deploy an RDI pipeline for a PostgreSQL database, follow inserts, updates, and deletes into Redis, and change a table's keys with a job file.
linkTitle: Interactive demo
hideListLinks: true
weight: 10
---

Redis Data Integration (RDI) keeps Redis in sync with a relational database, so your app and its agents read from Redis instead of the source. This demo follows a food delivery app that keeps its data in PostgreSQL. You deploy the pipeline, run SQL statements against the source, and see each change reach Redis.

The demo runs in your browser and doesn't connect to an RDI pipeline or a database. The configuration, job file, key names, and `redis-di status` output follow the [RDI documentation](/content/integrate/redis-data-integration/_index.md). The data and timings are illustrative. The customers, restaurants, and orders are the same sample data as the [Context Retriever interactive demo](/content/develop/ai/context-engine/context-retriever/interactive-demo.md).

{{< rdi-demo >}}

## What the demo shows

1. **Initial sync.** When you deploy a pipeline, RDI takes a snapshot of the tables you select and writes each row to Redis under its own key, as a hash or a JSON document.
2. **Change data capture.** After the snapshot, RDI captures every insert, update, and delete committed to those tables and applies it to Redis, usually within a few seconds.
3. **Job files.** A job file changes how RDI writes one table, such as its key pattern or its fields. A job only affects changes captured after you deploy it, until you reset the pipeline, and a reset doesn't delete the keys RDI wrote before.

## Next steps

- Follow the [RDI quick start](/content/operate/rc/rdi/quick-start.md) to sync a PostgreSQL database to Redis Cloud.
- Learn how to [define a data pipeline](/content/operate/rc/rdi/define.md) on Redis Cloud.
- See the [job file examples](/content/integrate/redis-data-integration/data-pipelines/transform-examples/_index.md) for more transformations.
