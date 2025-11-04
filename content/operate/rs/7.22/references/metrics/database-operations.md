---
Title: Database operations metrics
alwaysopen: false
categories:
- docs
- operate
- rs
- rc
description: null
linkTitle: Database operations
weight: $weight
url: '/operate/rs/7.22/references/metrics/database-operations/'
---

## Evicted objects/sec

Number of objects evicted from the database per second.

Objects are evicted from the database according to the [eviction policy]({{< relref "/operate/rs/7.22/databases/memory-performance/eviction-policy" >}}).

Object information is not measured during [shard migration]({{< relref "/operate/rs/7.22/databases/configure/replica-ha" >}}).

**Components measured**: Database and Shard

## Expired objects/sec

Number of expired objects per second.

Object information is not measured during [shard migration]({{< relref "/operate/rs/7.22/databases/configure/replica-ha" >}}).

**Components measured**: Database and Shard

## Hit ratio 

Ratio of the number of operations on existing keys out of the total number of operations. 

**Components measured**: Database and Shard

### Read misses/sec

The number of [read operations](#readssec) per second on keys that do not exist.

Read misses are not measured during [shard migration]({{< relref "/operate/rs/7.22/databases/configure/replica-ha" >}}).

**Components measured**: Database

### Write misses/sec 

Number of [write operations](#writessec) per second on keys that do not exist.

Write misses are not measured during [shard migration]({{< relref "/operate/rs/7.22/databases/configure/replica-ha" >}}).

**Components measured**: Database and Shard

## Latency 

The total amount of time between sending a Redis operation and receiving a response from the database.

The graph shows average, minimum, maximum, and last latency values for all latency metrics.

**Components measured**: Database

### Reads latency 

[Latency](#latency) of [read operations](#readssec).

**Components measured**: Database

### Writes latency 

[Latency](#latency) per [write operation](#writessec).

**Components measured**: Database

### Other commands latency 

[Latency](#latency) of [other operations](#other-commandssec).

**Components measured**: Database

## Ops/sec

Number of total operations per second, which includes [read operations](#readssec), [write operations](#writessec), and [other operations](#other-commandssec).

**Components measured**: Cluster, Node, Database, and Shard

### Reads/sec

Number of total read operations per second.

To find out which commands are read operations, run the following command with [`redis-cli`]({{< relref "/operate/rs/7.22/references/cli-utilities/redis-cli" >}}):

```sh
ACL CAT read
```

**Components measured**: Database

### Writes/sec

Number of total write operations per second.

To find out which commands are write operations, run the following command with [`redis-cli`]({{< relref "/operate/rs/7.22/references/cli-utilities/redis-cli" >}}):

```sh
ACL CAT write
```

**Components measured**: Database

#### Pending writes min

Minimum number of write operations queued per [Active-Active]({{< relref "/operate/rs/7.22/databases/active-active" >}}) replica database. 

#### Pending writes max

Maximum number of write operations queued per [Active-Active]({{< relref "/operate/rs/7.22/databases/active-active" >}}) replica database. 

### Other commands/sec 

Number of operations per second that are not [read operations](#readssec) or [write operations](#writessec).

Examples of other operations include [PING]({{< relref "/commands/ping" >}}), [AUTH]({{< relref "/commands/auth" >}}), and [INFO]({{< relref "/commands/info" >}}).

**Components measured**: Database

## Total keys 

Total number of keys in the dataset.
 
Does not include replicated keys, even if [replication]({{< relref "/operate/rs/7.22/databases/durability-ha/replication" >}}) is enabled.

Total keys is not measured during [shard migration]({{< relref "/operate/rs/7.22/databases/configure/replica-ha" >}}). 

**Components measured**: Database








