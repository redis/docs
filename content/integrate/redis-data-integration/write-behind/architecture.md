---
Title: RDI write-behind architecture
aliases: null
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Discover the main components of RDI write-behind
group: di
headerRange: '[2]'
linkTitle: Architecture
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 10
---

RDI write-behind lets you integrate Redis Enterprise (as the source of changes to data) and downstream databases or datastores.
RDI captures any changes to a selected set of key patterns in a Redis keyspace and asynchronously writes them in small batches to the downstream database. This means that your app doesn't need to handle the data remodeling or manage the connection with the downstream database.

RDI write-behind can normalize a key in Redis to several records in one or more tables at the target.
To learn more about write-behind declarative jobs and normalization, see the
[write-behind quick start guide]({{< relref "/integrate/redis-data-integration/write-behind/quickstart/write-behind-guide" >}}).

## Write-behind topology

RDI's CLI and engine are shipped as one product that can run both ingest and write-behind pipelines.
However, the two different types of pipeline have different topologies.

The RDI engine is installed on the Redis database that contains the application data and not on a separate staging Redis database. The RDI data streams and its control plane add only a small footprint of a few hundred MB to the Redis database. In the write-behind topology, RDI processes data in parallel on each shard and establishes a single connection from each shard to the downstream database.

### Model translation

RDI write-behind can track changes to the following Redis types:

- [Hash]({{< relref "/develop/data-types/hashes" >}})
- [JSON]({{< relref "/develop/data-types/json/" >}})
- [Set]({{< relref "/develop/data-types/sets" >}})
- [Sorted Set]({{< relref "/develop/data-types/sorted-sets" >}})

Unlike the ingest scenario, write-behind has no default behavior for model translation. You must always
create a declarative job to specify the mapping between Redis keys and target database records.
The job configuration has `keys` and `mapping` sections that help make this an easy task.

## RDI write-behind components

### RDI CLI

RDI's Python-based CLI is highly intuitive to use and performs validations to help you avoid mistakes.
The CLI makes it easy to set up RDI and manage it over its entire lifecycle.

### RDI Engine

RDI write-behind uses Redis Gears as its runtime environment. The Gears and RDI engine logic are installed
on all source Redis Enterprise database shards, but only primary shards process events and handle the pipeline.

The RDI Engine reads Redis change events from Redis Streams (one for each tracked key-pattern),
processes them, and translates them to SQL or whatever other language the target database uses.

RDI writes changes to the target in small batches using transactions. RDI write-behind guarantees
*at-least once* delivery. If any network problems, disconnections, or other temporary failures occur,
RDI will keep attempting to write the changes to the target. If a hard reject occurs, RDI keeps the reject
record and the reason in a *dead letter queue (DLQ)*.

### RDI configuration

The RDI configuration is persisted at the cluster level. The configuration is written by the CLI
[`deploy`]({{< relref "/integrate/redis-data-integration/write-behind/reference/cli/redis-di-deploy" >}})
command, which saves all changes to the configuration file. This mechanism allows for automatic configuration of new shards
whenever you need them, and it can survive shard and node failure.
