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
so you must prepare your source database before you can use it with RDI.

RDI supports the following source databases:

{{< embed-md "rdi-supported-source-versions.md" >}}

The pages in this section give detailed instructions to get your source
database ready for Debezium to use:
