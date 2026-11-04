---
Title: Prepare source databases
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
url: '/integrate/redis-data-integration/2.0.0/data-pipelines/prepare-dbs/'
---

Each database uses a different mechanism to track changes to its data and
generally, these mechanisms are not switched on by default.
RDI's Debezium collector uses these mechanisms for change data capture (CDC),
so you must prepare each source database before you can use it with RDI.

A pipeline can capture from more than one source database, and you must prepare each of them
separately. Follow the page for each source's database type. See
[Multiple sources in one pipeline](/content/integrate/redis-data-integration/2.0.0/data-pipelines/multiple-sources.md)
to learn how to configure several sources in one pipeline.

RDI supports the following source databases:

{{< embed-md "rdi-supported-source-versions.md" >}}

The pages in this section give detailed instructions to get your source
database ready for Debezium to use:
