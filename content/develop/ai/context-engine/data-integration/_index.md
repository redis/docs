---
Title: Redis Data Integration
alwaysopen: false
categories:
- docs
- develop
- ai
description: Keep Redis in sync with your primary databases so AI agents always have access to fresh, accurate business data.
linkTitle: Data Integration
hideListLinks: true
weight: 40
---

Redis Data Integration (RDI) is a fully-managed data pipeline service that keeps your Redis Cloud database in sync with your existing relational databases in near real time. By streaming live data from your primary databases into Redis, RDI ensures that AI agents always have access to accurate, up-to-date business data without querying slow source databases directly.

[Get started](#get-started) with RDI on [Redis Cloud]({{< relref "/operate/rc/rdi" >}}) or explore the full [Redis Data Integration documentation]({{< relref "/integrate/redis-data-integration" >}}).

## Redis Data Integration overview

AI agents are only as reliable as the data they work with. RDI solves the freshness problem by using [Change Data Capture (CDC)](https://en.wikipedia.org/wiki/Change_data_capture) to detect changes in your source database and propagate them to Redis within seconds. Agents interact only with Redis, which is fast, predictable, and always current.

RDI pipelines run in two phases:

- **Initial sync**: Reads a full snapshot of your source data and loads it into the target Redis database.
- **Streaming**: Captures changes as they happen and applies them to Redis within seconds of the source change.

Data is transformed from relational rows into Redis hashes or JSON documents as part of the pipeline, with no coding required. You define what data to sync and how to map it using configuration, and RDI handles the rest.

### Why agents need fresh data

Without a reliable data pipeline, agents face two common failure modes: stale cached data that no longer reflects reality, or slow queries to source databases that block agent responsiveness. RDI eliminates both by maintaining a continuously updated Redis cache that agents can query at full Redis speed.

## Key benefits

- **Near real-time updates**: Changes in your source database reach Redis within seconds using CDC.
- **No direct database access**: Agents query Redis, not your production databases, preserving performance and security.
- **No coding required**: Define pipelines through configuration. Transformations are handled automatically.
- **Fully managed on Redis Cloud**: No infrastructure to provision or maintain.
- **High throughput**: Processes approximately 10,000 records per second per core for initial snapshots and streaming.
- **At-least-once delivery**: RDI guarantees every change in the defined dataset is delivered to Redis.

## Supported source databases

RDI supports the following source databases when used with Redis Cloud:

| Database | Versions |
|----------|----------|
| Oracle | 19c, 21c |
| MySQL | 5.7, 8.0.x, 8.2 |
| PostgreSQL | 10–16 |
| MariaDB | 10.5, 11.4.3 |
| AWS Aurora PostgreSQL | 15 |
| SQL Server | 2017, 2019, 2022 |

## Get started {#get-started}

{{< multitabs id="rdi-get-started"
    tab1="Redis Cloud"
    tab2="Redis Enterprise" >}}

RDI on Redis Cloud is available in preview for Redis Cloud Pro databases hosted on AWS.

To get started:

1. [Prepare your source database]({{< relref "/operate/rc/rdi/setup" >}}) and configure credentials and connectivity.
2. [Define your data pipeline]({{< relref "/operate/rc/rdi/define" >}}) by selecting which tables to sync and how to map them.
3. [View and manage your pipeline]({{< relref "/operate/rc/rdi/view-edit" >}}) once it's running.

See the [RDI Cloud quick start]({{< relref "/operate/rc/rdi/quick-start" >}}) to get up and running quickly with a PostgreSQL source database.

-tab-sep-

RDI is also available for self-managed Redis Enterprise deployments. See the [Redis Data Integration documentation]({{< relref "/integrate/redis-data-integration" >}}) for full installation and configuration instructions.

{{< /multitabs >}}
