---
Title: Redis Data Integration architecture
aliases: null
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: null
group: di
headerRange: '[2]'
linkTitle: Architecture
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 10
---

This document describes the architecture of RDI write-behind

RDI write-behind allows integration between Redis Enterprise (as the source of changes to data) and downstream databases or datastores.
RDI captures the changes to a selected set of key patterns in a Redis keyspace and asynchronously writes them in small batches to the downstream database, so the application doesn't need to take care of remodeling the data or managing the connection with the downstream database.

RDI write-behind can normalize a key in Redis to several records in one or more tables at the target.
To learn more about write-behind declarative jobs and normalization, see the
[write-behind quick start guide]({{< relref "/integrate/redis-data-integration/write-behind/quickstart/write-behind-guide" >}}).

## Write-behind topology

RDI's CLI and engine come in one edition that can run both ingest and write-behind. However, the topology for write-behind is different.
RDI engine is installed on a Redis database containing the application data and not on a separate staging Redis database. RDI streams data and control plane adds a small footprint of few hundreds of MBs to the Redis database. In the write-behind topology, RDI processes in parallel on each shard and establishes a single connection from each shard to the downstream database.

### Model translation

RDI write-behind can track changes to the following Redis types:

- [Hash]({{< relref "/develop/data-types/hashes" >}})
- [JSON]({{< relref "/develop/data-types/json/" >}})
- [Set]({{< relref "/develop/data-types/sets" >}})
- [Sorted Set]({{< relref "/develop/data-types/sorted-sets" >}})

Unlike the ingest scenario, write-behind has no default behavior for model translation. It is up to the user to create a declarative job, specifying the mapping between Redis keys and target database records.
The job `keys` and `mapping` sections help make this an easy task.

## RDI write behind components

### RDI CLI

RDI comes with a Python-based CLI that is intuitive, self explanatory, and validating, to ease the entire lifecycle of RDI setup and management.

### RDI Engine

RDI write-behind uses Redis Gears as its runtime environment. Gears and RDI engine logic are installed on all source Redis Enterprise database shards, but only primary shards are processing events and the pipeline

The RDI Engine reads Redis change events from Redis Streams (one per tracked key-pattern), process them and translate them to SQL or other language supported by the target database.

RDI writes changes to the target in small batches as a transaction. RDI write-behind guarantee at-least once delivery. In case of network hiccup, disconnection or any temporary failure, RDI will keep retrying writing the changes to the target. In case of hard reject, RDI keeps the reject record and the reason in DLQ (Dead Letter Queue).


### RDI configuration

RDI configuration is persisted at the cluster level. The configuration is written by the CLI `deploy` command, reflecting the configuration file. This mechanism allows for automatic configuration of new shards when needed, and can survive shard and node failure.
