---
Title: Configure the query performance factor for Redis Query Engine in Redis Enterprise
alwaysopen: false
categories:
- docs
- operate
- stack
description: Configure the query performance factor for Redis Query Engine in Redis Enterprise to increase the performance of queries.
linkTitle: Configure query performance factor
weight: 20
aliases: /operate/oss_and_stack/stack-with-enterprise/search/scalable-search/
         /operate/oss_and_stack/stack-with-enterprise/search/query-performance-factor/
---

Query performance factors are intended to increase the performance of queries, including [vector search]({{<relref "/develop/interact/search-and-query/query/vector-search">}}). When enabled, it allows you to increase a database's compute capacity and query throughput by allocating more virtual CPUs per shard. This is in addition to horizontal scaling with more shards which enables a higher throughput of key value operations. This document describes how to configure the query performance factor.

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

1. [Determine the query performance factor](#calculate-query-performance-factor) you want and the required number of CPUs. Unused CPUs, above the 20% necessary for Redis, can be used for the scalable Redis Query Engine.

1. Create a new Redis database with the number of CPUs configured for the query performance factor.

## Calculate query performance factor

### CPUs for query performance factor

Vertical scaling of the Redis Query Engine is achieved by provisioning additional CPUs for the RediSearch module. At least 20% of the available CPUs must be reserved for Redis internal processing. Use the following formula to define the maximum number of CPUs that can be allocated to search.

| Variable | Value |
|----------|-------|
| CPUs per node | x |
| Redis internals | 20% |
| Available CPUs for Redis Query Engine | floor(0.8 * x) |

### Query performance factor versus CPUs

The following table shows the number of CPUs required for each performance factor. This calculation is sensitive to how the search index and queries are defined. Certain scenarios might yield less throughput than the ratios in the following table.

| Scale factor | Minimum CPUs required for Redis Query Engine <WORKERS> |
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
| Minimum CPUs required for scale factor - WORKERS | 6 |

## Configure query performance factor manually

To manually configure the query performance factor in Redis Enterprise Software:

1. [Configure query performance factor parameters](#config-db-ui) when you create a new database or edit an existing database's configuration in the Cluster Manager UI.

1. If you configure the query performance factor for an existing database, you also need to [restart shards](#restart-shards). Newly created databases can skip this step.

### Configure query performance factor parameters in the Cluster Manager UI {#config-db-ui}

You can use the Cluster Manager UI to configure the query performance factor when you [create a new database]({{<relref "/operate/rs/databases/create">}}) or [edit an existing database]({{<relref "/operate/rs/databases/configure#edit-database-settings">}}) with search enabled.

1. In the **Capabilities** section of the database configuration screen, click **Parameters**.

1. If you are creating a new database, select **Search and query**.

1. Adjust the **RediSearch** parameters to include: 

    `WORKERS <NUMBER_OF_THREADS>`

    See [Calculate query performance factor](#calculate-query-performance-factor) to determine the minimum CPUs required to use for `<NUMBER_OF_THREADS>`.
    
1. Expand the **Query Performance Factor** section and enter the following values:

    - `mnp` for **Connections routing**

    - `32` for **Connections limit**

    {{<image filename="images/rs/screenshots/databases/rs-config-query-performance-factor.png" alt="Configure search parameters and query performance factor.">}}
    
1. Click **Done** to close the parameter editor.

1. Click **Create** or **Save**.

### Restart shards {#restart-shards}

After you update the query performance factor for an existing database, restart all shards to apply the new settings. You can migrate shards to restart them. Newly created databases can skip this step.

1. Use [`rladmin status shards db <db-name>`]({{<relref "/operate/rs/references/cli-utilities/rladmin/status#status-shards">}}) to list all shards for your database:

    ```sh
    rladmin status shards db db-name
    ```

    Example output:

    ```sh
    SHARDS:
    DB:ID   NAME                ID      NODE   ROLE   SLOTS   USED_MEMORY STATUS
    db:2    db-name             redis:1 node:1 master 0-16383 1.95MB      OK    
    db:2    db-name             redis:2 node:2 slave  0-16383 1.95MB      OK    
    ```

    Note the following fields for the next steps: 
    - `ID`: the Redis shard's ID.
    - `NODE`: the node on which the shard currently resides.
    - `ROLE`: `master` is a primary shard; `slave` is a replica shard.

1. For each replica shard, use [`rladmin migrate shard`]({{<relref "/operate/rs/references/cli-utilities/rladmin/migrate">}}) to move it to a different node and restart it:

    ```sh
    rladmin migrate shard <shard_id> target_node <node_id>
    ```

1. After you migrate the replica shards, migrate the original primary shards.

1. Rerun `rladmin status shards db <db-name>` to verify the shards migrated to different nodes:

    ```sh
    rladmin status shards db db-name
    ```

    Example output:

    ```sh
    SHARDS:
    DB:ID   NAME                ID      NODE   ROLE   SLOTS   USED_MEMORY STATUS
    db:2    db-name             redis:1 node:2 master 0-16383 1.95MB      OK    
    db:2    db-name             redis:2 node:1 slave  0-16383 1.95MB      OK    
    ```

## Configure query performance factor with the REST API

You can configure the query performance factor when you [create a new database](#create-db-rest-api) or [update an existing database](#update-db-rest-api) using the Redis Enterprise Software [REST API]({{<relref "/operate/rs/references/rest-api">}}).

### Create new database with the REST API {#create-db-rest-api}

To create a database and configure the query performance factor, use the [create database REST API endpoint]({{<relref "/operate/rs/references/rest-api/requests/bdbs#post-bdbs-v1">}}) with a [BDB object]({{<relref "/operate/rs/references/rest-api/objects/bdb">}}) that includes the following parameters:

```json
{
    "sched_policy": "mnp",
    "conns": 32,
    "module_list": [{
        "module_name": "search",
        "module_args": "WORKERS <NUMBER_OF_THREADS>"
    }]
}
```

See [Calculate performance factor](#calculate-query-performance-factor) to determine the value to use for `<NUMBER_OF_CPUS>`.

#### Example REST API request for a new database

The following JSON is an example request body used to create a new database with a 4x query performance factor configured:

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
        "module_args": "WORKERS 6"
    }]
}
```

The following [cURL](https://curl.se/docs/) request creates a new database from the JSON example:

```sh
curl -k -u "<user>:<password>" https://<host>:9443/v1/bdbs -H "Content-Type:application/json" -d @scalable-search-db.json
```

### Update existing database with the REST API {#update-db-rest-api}

To configure the query performance factor for an existing database, use the following REST API requests:

- [Update database configuration]({{<relref "/operate/rs/references/rest-api/requests/bdbs#put-bdbs">}}) to modify the DMC proxy.

- [Upgrade module]({{<relref "/operate/rs/references/rest-api/requests/bdbs/modules/upgrade#post-bdb-modules-upgrade">}}) to set the search module’s query performance factor.

{{<note>}}
- Because this procedure also restarts the database shards, you should perform it during a maintenance period.
- This procedure overwrites any existing module configuration parameters.
{{</note>}}

The following example script uses both endpoints to configure a 4x query performance factor:

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
        "new_module_args": "WORKERS '$CPU'",
        "current_module": "'$MODULE_ID'",
        "new_module": "'$MODULE_ID'"
      }
    ]
}'
```

## Monitoring Redis Query Engine

To monitor a database with a query performance factor configured:

1. Integrate your Redis Enterprise deployment with Prometheus. See [Prometheus and Grafana with Redis Enterprise]({{<relref "/integrate/prometheus-with-redis-enterprise">}}) for instructions.

1. Monitor the `redis_process_cpu_usage_percent` shard metric.

    The following Prometheus UI screenshot shows `redis_process_cpu_usage_percent` spikes for a database with two shards:

    - 1st 100% spike: [`memtier_benchmark`](https://github.com/RedisLabs/memtier_benchmark) search test at the default (no additional CPUs for search).

    - 2nd 100% spike: reconfiguration and shard restart for a 4x query performance factor.

    - 3rd 600% spike: `memtier_benchmark` search test with threading at a 4x query performance factor (6 CPUs per shard).

    {{<image filename="images/rs/screenshots/monitor-rs-scalable-search-cpu-usage.png" alt="The Prometheus graph shows three spikes for redis_process_cpu_usage_percent: 100%, another 100%, then 600%.">}}
