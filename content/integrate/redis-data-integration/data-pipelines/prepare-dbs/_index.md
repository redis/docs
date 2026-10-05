---
Title: Prepare source databases
aliases: /integrate/redis-data-integration/ingest/data-pipelines/prepare-dbs/
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Enable CDC features in your source databases
group: di
hideListLinks: false
linkTitle: Prepare source databases
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 1
---

Each database uses a different mechanism to track changes to its data and
generally, these mechanisms are not switched on by default.
RDI's Debezium collector uses these mechanisms for change data capture (CDC),
so you must prepare each source database before you can use it with RDI.

A pipeline can capture from more than one source database, and you must prepare each of them
separately. Follow the page for each source's database type. See
[Multiple sources in one pipeline](/content/integrate/redis-data-integration/data-pipelines/multiple-sources.md)
to learn how to configure several sources in one pipeline.

RDI supports the following source databases:

{{< embed-md "rdi-supported-source-versions.md" >}}

For a proof of concept with a collector that you manage, see
[Use an external collector](/content/integrate/redis-data-integration/data-pipelines/prepare-dbs/external-sources.md).
This approach is not recommended for production deployments.

The pages in this section explain how to prepare source databases or configure
an external collector:
