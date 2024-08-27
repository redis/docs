---
Title: Configure the query performance factor for Redis Query Engine in Redis Enterprise
alwaysopen: false
categories:
- docs
- operate
- stack
description: Enable the Query performance factor for Redis Query Engine in Redis Enterprise to increase the performance of queries.
linkTitle: Enable scalable Redis Query Engine
weight: 20
aliases: /operate/oss_and_stack/stack-with-enterprise/search/scalable-search/
         /operate/oss_and_stack/stack-with-enterprise/search/query-performance-factor/
---

Query performance factor is a capability intended to increase the performance of queries, including [vector search]({{<relref "/develop/interact/search-and-query/query/vector-search">}}). When enabled, it allows you to increase a database's compute capacity and throughput by allocating more virtual CPUs per shard in addition to horizontal scaling with more shards. This document describes how to configure the Query performance factor.

{{<note>}}
Some use cases might not scale effectively. Redis experts can help determine if vertical scaling with the Redis Query Engine will boost performance for your use case and guide you on whether to use vertical scaling, horizontal scaling, or both.
{{</note>}}

## Prerequisites

Redis Query Engine requires a cluster running Redis Enterprise Software version 7.4.2-54 or later.

If you do not have a cluster that supports Redis Query Engine, [install Redis Enterprise Software]({{<relref "/operate/rs/installing-upgrading/install/install-on-linux">}}) version 7.4.2-54 or later on a new cluster, or [upgrade an existing cluster]({{<relref "/operate/rs/installing-upgrading/upgrading/upgrade-cluster">}}).

## Sizing

1. Calculate the hardware requirements for your Redis database:

    1. Use the [hardware requirements documentation]({{<relref "/operate/rs/installing-upgrading/install/plan-deployment/hardware-requirements">}}) to derive the overall cluster architecture.

    1. Calculate the RAM requirements using the [Index Size Calculator](https://redis.io/redisearch-sizing-calculator/). The total RAM required is the sum of the dataset and index sizes.

1. [Determine the Query performanc factor](#calculate-performance-factor) you want and the required number of CPUs. Unused CPUs, above the 20% necessary for Redis, can be used for the scalable Redis Query Engine.

1. Create a new Redis database with the number of CPUs configured for the Query performance factor.

## Calculate performance factor

### CPUs for Query performance factor

Vertical scaling of the Redis Query Engine is achieved by provisioning additional CPUs for the search module. At least 20% of the available CPUs must be reserved for Redis internal processing. Use the following formula to define the maximum number of CPUs that can be allocated to search.

| Variable | Value |
|----------|-------|
| CPUs per node | x |
| Redis internals | 20% |
| Available CPUs for Redis Query Engine | floor(0.8 * x) |

### Query performance factor versus CPUs

The following table shows the number of CPUs required for each performance factor. This calculation is sensitive to how the search index and queries are defined. Certain scenarios might yield less throughput than the ratios in the following table.

| Scale factor | Minimum CPUs required for Redis Query Engine |
|----------------|-----------------------------------------|
| None (default) | 1 |
| 2 | 3 |
| 4 | 6 |
| 6 | 9 |
| 8 | 12 |
| 10 | 15 |
| 12 | 18 |
| 14 | 21 |
| 16 | 24 |

### Example performance factor calculation

| Variable | Value |
|----------|-------|
| CPUs per node | 8 |
| Available CPUs | floor(0.8 * 8)=6 |
| Scale factor | 4x |
| Minimum CPUs required for scale factor | 6 |

## Enable Query performance factor

To enable the performance factor in Redis Enterprise, use the [REST API]({{<relref "/operate/rs/references/rest-api">}}) to create a new database or update an existing database.

### Create new database

To create a database with the Query performance factor enabled, use the [create database REST API endpoint]({{<relref "/operate/rs/references/rest-api/requests/bdbs#post-bdbs-v1">}}) with a [BDB object]({{<relref "/operate/rs/references/rest-api/objects/bdb">}}) that includes the following parameters:

```json
{
    "sched_policy": "mnp",
    "conns": 32,
    "module_list": [{
        "module_name": "search",
        "module_args": "MT_MODE MT_MODE_FULL WORKER_THREADS <NUMBER_OF_CPUS>"
    }]
}
```

See [Calculate performance factor](#calculate-performance-factor) to determine the value to use for `<NUMBER_OF_CPUS>`.

#### Example REST API request for a new database

The following JSON is an example request body used to create a new database with a 4x Query performance factor enabled:

```json
{
    "name": "scalable-search-db",
    "type": "redis",
    "memory_size": 10000000,
    "port": 13000,
    "authentication_redis_pass": "<your default db pwd>",
    "proxy_policy": "all-master-shards",
    "sched_policy": "mnp",
    "conns": 32,
    "sharding": true,
    "shards_count": 3,
    "shards_placement": "sparse",
    "shard_key_regex": [{"regex": ".*\\{(?<tag>.*)\\}.*"}, {"regex": "(?<tag>.*)"}],
    "replication": false,
    "module_list": [{
        "module_name": "search",
        "module_args": "MT_MODE MT_MODE_FULL WORKER_THREADS 6"
    }]
}
```

The following [cURL](https://curl.se/docs/) request creates a new database from the JSON example:

```sh
curl -k -u "<user>:<password>" https://<host>:9443/v1/bdbs -H "Content-Type:application/json" -d @scalable-search-db.json
```

### Update existing database 

To enable the Query performance factor for an existing database, use the following REST API requests:

- [Update database configuration]({{<relref "/operate/rs/references/rest-api/requests/bdbs#put-bdbs">}}) to modify the DMC proxy.

- [Upgrade module]({{<relref "/operate/rs/references/rest-api/requests/bdbs/modules/upgrade#post-bdb-modules-upgrade">}}) to set the search module’s Query performance factor.

{{<note>}}
- Because this procedure also restarts the database shards, you should perform it during a maintenance period.
- This procedure overwrites any existing module configuration parameters.
{{</note>}}

The following example script uses both endpoints to configure a 4x Query performance factor:

```sh
#!/bin/bash
export DB_ID=1
export CPU=6
export MODULE_ID=`curl -s -k -u "<user>:<password>" https://<host>:9443/v1/bdbs/$DB_ID | jq '.module_list[] | select(.module_name=="search").module_id' | tr -d '"'`

curl -o /dev/null -s -k -u "<user>:<password>" -X PUT https://<host>:9443/v1/bdbs/$DB_ID -H "Content-Type:application/json" -d '{
    "sched_policy": "mnp",
    "conns": 32
}'

sleep 1

curl -o /dev/null -s -k -u "<user>:<password>" https://<host>:9443/v1/bdbs/$DB_ID/modules/upgrade -H "Content-Type:application/json" -d '{
    "modules": [
      {
        "module_name": "search",
        "new_module_args": "MT_MODE MT_MODE_FULL WORKER_THREADS '$CPU'",
        "current_module": "'$MODULE_ID'",
        "new_module": "'$MODULE_ID'"
      }
    ]
}'
```

## Monitoring Redis Query Engine

To monitor a database with a Query performance factor enabled:

1. Integrate your Redis Enterprise deployment with Prometheus. See [Prometheus and Grafana with Redis Enterprise]({{<relref "/integrate/prometheus-with-redis-enterprise">}}) for instructions.

1. Monitor the `redis_process_cpu_usage_percent` shard metric.

    The following Prometheus UI screenshot shows `redis_process_cpu_usage_percent` spikes for a database with two shards:

    - 1st 100% spike: [`memtier_benchmark`](https://github.com/RedisLabs/memtier_benchmark) search test at the default (no additional CPUs for search).

    - 2nd 100% spike: reconfiguration and shard restart for a 4x Query performance factor.

    - 3rd 600% spike: `memtier_benchmark` search test with threading at a 4x Query performance factor (6 CPUs per shard).

    {{<image filename="images/rs/screenshots/monitor-rs-scalable-search-cpu-usage.png" alt="The Prometheus graph shows three spikes for redis_process_cpu_usage_percent: 100%, another 100%, then 600%.">}}
