---
Title: Resource usage metrics
alwaysopen: false
categories:
- docs
- operate
- rs
description: null
linkTitle: Resource usage
weight: $weight
url: '/operate/rs/7.8/references/metrics/resource-usage/'
---

## Connections

Number of connections to the database.

**Components measured**: Cluster, Node, and Database

## CPU usage

Percent of the node CPU used. 

**Components measured**:  Cluster and Node

### Main thread CPU usage 

Percent of the CPU used by the main thread.

**Components measured**: Database and Shard

### Fork CPU usage

CPU usage of Redis child forks.

**Components measured**: Database and Shard

### Total CPU usage 

Percent usage of the CPU for all nodes.

**Components measured**: Database

## Free disk space

Remaining unused disk space.

**Components measured**:  Cluster and Node

## Memory
### Used memory 

Total memory used by the database, including RAM, [Flash]({{< relref "/operate/rs/7.8/databases/auto-tiering" >}}) (if enabled), and [replication]({{< relref "/operate/rs/7.8/databases/durability-ha/replication" >}}) (if enabled).

Used memory does not include:

1. Fragmentation overhead - The ratio of memory seen by the operating system to memory allocated by Redis
2. Replication buffers at the primary nodes - Set to 10% of used memory and is between 64 MB and 2048 MB
3. Memory used by Lua scripts - Does not exceed 1 MB
4. Copy on Write (COW) operation that can be triggered by:
    - A full replication process
    - A database snapshot process
    - AOF rewrite process

Used memory is not measured during [shard migration]({{< relref "/operate/rs/7.8/databases/configure/replica-ha" >}}).

**Components measured**: Database and Shard

### Free RAM

Available RAM for System use.

**Components measured**:  Cluster and Node

### Memory limit 

Memory size limit of the database, enforced on the [used memory](#used-memory).

**Components measured**: Database

### Memory usage 

Percent of memory used by Redis out of the [memory limit](#memory-limit).

**Components measured**: Database
## Traffic

### Incoming traffic 

Total incoming traffic to the database in bytes/sec.

All incoming traffic is not measured during [shard migration]({{< relref "/operate/rs/7.8/databases/configure/replica-ha" >}}).

**Components measured**: Cluster, Node and Database

#### Incoming traffic compressed

Total incoming compressed traffic (in bytes/sec) per [Active-Active]({{< relref "/operate/rs/7.8/databases/active-active" >}}) replica database. 

#### Incoming traffic uncompressed

Total incoming uncompressed traffic (in bytes/sec) per [Active-Active]({{< relref "/operate/rs/7.8/databases/active-active" >}}) replica database. 

### Outgoing traffic 

Total outgoing traffic from the database in bytes per second.

Outgoing traffic is not measured during [shard migration]({{< relref "/operate/rs/7.8/databases/configure/replica-ha" >}}).

**Components measured**: Cluster, Node and Database







 
