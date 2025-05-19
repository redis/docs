---
Title: rladmin status
alwaysopen: false
categories:
- docs
- operate
- rs
description: Displays the current cluster status and topology information.
headerRange: '[1-2]'
linkTitle: status
toc: 'true'
weight: $weight
url: '/operate/rs/7.8/references/cli-utilities/rladmin/status/'
---

Displays the current cluster status and topology information.

## `status`

Displays the current status of all nodes, databases, database endpoints, and shards on the cluster.

``` sh
rladmin status
        [ extra <parameter> ]
        [ issues_only]
```

### Parameters

| Parameter | Description |
|-----------|-------------|
| extra \<parameter\> | Extra options that show more information |
| issues_only | Filters out all items that have an `OK` status  |

| Extra parameter | Description |
|-------------------|-------------|
| extra all | Shows all `extra` information |
| extra backups | Shows periodic backup status |
| extra frag | Shows fragmented memory available after the restart |
| extra nodestats | Shows shards per node |
| extra rack_id | Shows `rack_id` if customer is not `rack_aware` |
| extra redis_version | Shows Redis version of all databases in the cluster |
| extra state_machine | Shows execution of state machine information  |
| extra watchdog | Shows watchdog status  |

### Returns

Returns tables of the status of all nodes, databases, and database endpoints on the cluster.

If `issues_only` is specified, it only shows instances that do not have an `OK` status.

In the `CLUSTER NODES` section, `*node` indicates which node you are connected to.

For descriptions of the fields returned by `rladmin status extra all`, see the output tables for [nodes](#returns-nodes), [databases](#returns-dbs), [endpoints](#returns-endpoints), and [shards](#returns-shards).

### Example

``` sh
$ rladmin status extra all
CLUSTER:
OK. Cluster master: 1 (198.51.100.2)
Cluster health: OK, [1, 0.13333333333333333, 0.03333333333333333]
failures/minute - avg1 1.00, avg15 0.13, avg60 0.03.

CLUSTER NODES:
NODE:ID ROLE   ADDRESS      EXTERNAL_ADDRESS HOSTNAME     MASTERS SLAVES OVERBOOKING_DEPTH SHARDS CORES FREE_RAM        PROVISIONAL_RAM VERSION   SHA    RACK-ID STATUS
node:1  master 198.51.100.2                  3d99db1fdf4b 4       0      10.91GB           4/100  6     14.91GB/19.54GB 10.91GB/16.02GB 6.2.12-37 5c2106 -       OK    
node:2  slave  198.51.100.3                  fc7a3d332458 0       0      11.4GB            0/100  6     14.91GB/19.54GB 11.4GB/16.02GB  6.2.12-37 5c2106 -       OK    
*node:3 slave  198.51.100.4                  b87cc06c830f 0       0      11.4GB            0/100  6     14.91GB/19.54GB 11.4GB/16.02GB  6.2.12-37 5c2106 -       OK    

DATABASES:
DB:ID NAME      TYPE  STATUS SHARDS PLACEMENT REPLICATION PERSISTENCE ENDPOINT                        EXEC_STATE EXEC_STATE_MACHINE BACKUP_PROGRESS MISSING_BACKUP_TIME REDIS_VERSION
db:3  database3 redis active 4      dense     disabled    disabled    redis-11103.cluster.local:11103 N/A        N/A                N/A             N/A                 6.0.16       

ENDPOINTS:
DB:ID     NAME             ID                    NODE       ROLE       SSL        WATCHDOG_STATUS          
db:3      database3        endpoint:3:1          node:1     single     No         OK                       

SHARDS:
DB:ID NAME      ID      NODE   ROLE   SLOTS       USED_MEMORY BACKUP_PROGRESS RAM_FRAG WATCHDOG_STATUS STATUS
db:3  database3 redis:4 node:1 master 0-4095      2.08MB      N/A             4.73MB   OK              OK    
db:3  database3 redis:5 node:1 master 4096-8191   2.08MB      N/A             4.62MB   OK              OK    
db:3  database3 redis:6 node:1 master 8192-12287  2.08MB      N/A             4.59MB   OK              OK    
db:3  database3 redis:7 node:1 master 12288-16383 2.08MB      N/A             4.66MB   OK              OK
```

## `status databases`

Displays the current status of all databases on the cluster.

``` sh
rladmin status databases
        [ extra <parameters> ]
        [ sort <column_titles> ]
        [ issues_only ]
```

### Parameters

| Parameter | Description |
|-----------|-------------|
| extra \<parameter\> | Extra options that show more information |
| sort \<column_titles\> | Sort results by specified column titles |
| issues_only | Filters out all items that have an `OK` status  |


| Extra parameter | Description |
|-------------------|-------------|
| extra all | Shows all `extra` information |
| extra backups | Shows periodic backup status |
| extra frag | Shows fragmented memory available after the restart |
| extra nodestats | Shows shards per node |
| extra rack_id | Shows `rack_id` if customer is not `rack_aware` |
| extra redis_version | Shows Redis version of all databases in the cluster |
| extra state_machine | Shows execution of state machine information  |
| extra watchdog | Shows watchdog status  |

### Returns {#returns-dbs}

Returns a table of the status of all databases on the cluster.

If `sort <column_titles>` is specified, the result is sorted by the specified table columns.

If `issues_only` is specified, it only shows databases that do not have an `OK` status.

The following table describes the fields returned by `rladmin status databases extra all`:

| Field | Description |
|-------|-------------|
| DB:ID | Database ID |
| NAME | Database name |
| TYPE | Database type: Redis or Memcached |
| STATUS | Database status |
| SHARDS | The number of primary shards in the database |
| PLACEMENT | How the shards are spread across nodes in the cluster, densely or sparsely |
| REPLICATION | Is replication enabled for the database |
| PERSISTENCE | Is persistence enabled for the database |
| ENDPOINT | Database endpoint |
| EXEC_STATE |  The current state of the state machine |
| EXEC_STATE_MACHINE | The name of the running state machine |
| BACKUP_PROGRESS | The database’s backup progress |
| MISSING_BACKUP_TIME | How long ago a backup was done |
| REDIS_VERSION | The database’s Redis version |

### Example

``` sh
$ rladmin status databases sort REPLICATION PERSISTENCE
DB:ID NAME      TYPE  STATUS SHARDS PLACEMENT REPLICATION PERSISTENCE ENDPOINT                                       
db:1  database1 redis active 1      dense     disabled    disabled    redis-10269.testdbd11169.localhost:10269
db:2  database2 redis active 1      dense     disabled    snapshot    redis-13897.testdbd11169.localhost:13897
db:3  database3 redis active 1      dense     enabled     snapshot    redis-19416.testdbd13186.localhost:19416
```

## `status endpoints`

Displays the current status of all endpoints on the cluster.

``` sh
rladmin status endpoints
        [ node <id> ]
        [ db { db:<id> | <name> } ]
        [ extra <parameters> ]
        [ sort <column_titles> ]
        [ issues_only ]
```

### Parameters

| Parameter | Description |
|-----------|-------------|
| node \<id\> | Only show endpoints for the specified node ID |
| db db:\<id\> | Only show endpoints for the specified database ID |
| db \<name\> | Only show endpoints for the specified database name |
| extra \<parameter\> | Extra options that show more information |
| sort \<column_titles\> | Sort results by specified column titles |
| issues_only | Filters out all items that have an `OK` status  |


| Extra parameter | Description |
|-------------------|-------------|
| extra all | Shows all `extra` information |
| extra backups | Shows periodic backup status |
| extra frag | Shows fragmented memory available after the restart |
| extra nodestats | Shows shards per node |
| extra rack_id | Shows `rack_id` if customer is not `rack_aware` |
| extra redis_version | Shows Redis version of all endpoints in the cluster |
| extra state_machine | Shows execution of state machine information  |
| extra watchdog | Shows watchdog status  |

### Returns {#returns-endpoints}

Returns a table of the status of all endpoints on the cluster.

If `sort <column_titles>` is specified, the result is sorted by the specified table columns.

If `issues_only` is specified, it only shows endpoints that do not have an `OK` status.

The following table describes the fields returned by `rladmin status endpoints extra all`:

| Field | Description |
|-------|-------------|
| DB:ID | Database ID |
| NAME | Database name |
| ID | Endpoint ID |
| NODE | The node that hosts the endpoint |
| ROLE | The proxy policy of the database: single, all-master-shards, or all-nodes |
| SSL | Is SSL enabled |
| WATCHDOG_STATUS | The shards related to the endpoint are monitored and healthy |

### Example

``` sh
$ rladmin status endpoints
DB:ID     NAME             ID                    NODE        ROLE        SSL    
db:1      database1        endpoint:1:1          node:1      single      No     
db:2      database2        endpoint:2:1          node:2      single      No     
db:3      database3        endpoint:3:1          node:3      single      No
```

## `status modules`

Displays the current status of modules installed on the cluster and modules used by databases. This information is not included in the combined status report returned by [`rladmin status`](#status).

``` sh
rladmin status modules
        [ db { db:<id1> | <name1> } ... { db:<idN> | <nameN> } ]
        [ extra { all | compatible_redis_version | min_redis_version | module_id } ]
```

### Parameters

| Parameter | Description |
|-----------|-------------|
| db db:\<id\> | Provide a list of database IDs to show only modules used by the specified databases<br />(for example: `rladmin status modules db db:1 db:2`) |
| db \<name\> | Provide a list of database names to show only modules used by the specified databases<br />(for example: `rladmin status modules db name1 name2`) |
| extra all | Shows all extra information |
| extra compatible_redis_version | Shows the compatible Redis database version for the module |
| extra module_id | Shows module IDs |
| extra&nbsp;min_redis_version | Shows the minimum compatible Redis database version for each module |

### Returns

Returns the status of modules installed on the cluster and modules used by databases.

### Example

```sh
$ rladmin status modules extra all                
CLUSTER MODULES:
MODULE           VERSION   MIN_REDIS_VERSION  ID                                
RedisBloom       2.4.5     6.0                1b895a180592cbcae5bd3bff6af24be2  
RedisBloom       2.6.8     7.1                95264e7c9ac9540268c115c86a94659b  
RediSearch 2     2.6.12    6.0                2c000539f65272f7a2712ed3662c2b6b  
RediSearch 2     2.8.9     7.1                dd9a75710db528afa691767e9310ac6f  
RedisGears       2.0.15    7.1                18c83d024b8ee22e7caf030862026ca6  
RedisGraph       2.10.12   6.0                5a1f2fdedb8f6ca18f81371ea8d28f68  
RedisJSON        2.4.7     6.0                28308b101a0203c21fa460e7eeb9344a  
RedisJSON        2.6.8     7.1                b631b6a863edde1b53b2f7a27a49c004  
RedisTimeSeries  1.8.11    6.0                8fe09b00f56afe5dba160d234a6606af  
RedisTimeSeries  1.10.9    7.1                98a492a017ea6669a162fd3503bf31f3  

DATABASE MODULES:
DB:ID      NAME             MODULE            VERSION  ARGS              STATUS 
db:1       search-json-db   RediSearch 2      2.8.9    PARTITIONS AUTO   OK     
db:1       search-json-db   RedisJSON         2.6.8                      OK     
db:2       timeseries-db    RedisTimeSeries   1.10.9                     OK      
```

## `status nodes`

Displays the current status of all nodes on the cluster.

``` sh
rladmin status nodes
        [ extra <parameters> ]
        [ sort <column_titles> ]
        [ issues_only ]
```

### Parameters

| Parameter | Description |
|-----------|-------------|
| extra \<parameter\> | Extra options that show more information |
| sort \<column_titles\> | Sort results by specified column titles |
| issues_only | Filters out all items that have an `OK` status  |


| Extra parameter | Description |
|-------------------|-------------|
| extra all | Shows all `extra` information |
| extra backups | Shows periodic backup status |
| extra frag | Shows fragmented memory available after the restart |
| extra nodestats | Shows shards per node |
| extra rack_id | Shows `rack_id` if customer is not `rack_aware` |
| extra redis_version | Shows Redis version of all nodes in the cluster |
| extra state_machine | Shows execution of state machine information  |
| extra watchdog | Shows watchdog status  |

### Returns {#returns-nodes}

Returns a table of the status of all nodes on the cluster.

If `sort <column_titles>` is specified, the result is sorted by the specified table columns.

If `issues_only` is specified, it only shows nodes that do not have an `OK` status.

`*node` indicates which node you are connected to.

The following table describes the fields returned by `rladmin status nodes extra all`:

| Field | Description |
|-------|-------------|
| NODE:ID | Node ID |
| ROLE | Is the node a primary (`master`) or secondary (`slave`) node |
| ADDRESS | The node’s internal IP address |
| EXTERNAL ADDRESS | The node’s external IP address |
| HOSTNAME | Node name |
| MASTERS | The number of primary shards on the node |
| SLAVES | The number of replica shards on the node |
| OVERBOOKING_DEPTH | Memory available to create new shards, accounting for the memory reserved for existing shards to grow, even if `shards_overbooking` is enabled. A negative value indicates how much memory is overbooked rather than just showing that no memory is available for new shards. |
| SHARDS | The number of shards on the node |
| CORES | The number of cores on the node |
| FREE_RAM | free_memory/total_memory<br />**free_memory**: the amount of free memory reported by the OS.<br />**total_memory**: the total physical memory available on the node. |
| PROVISIONAL_RAM | Memory available to create new shards, displayed as available_provisional_memory/total_provisional_memory.<br />**available_provisional_memory**: memory currently available for the creation of new shards.<br />**total_provisional_memory**: memory that would be available to create new shards if the used memory on the node was 0.<br />If the available provisional memory is 0, the node cannot create new shards because the node has reached its shard limit, is in maintenance mode, or is a quorum-only node. |
| FLASH | The amount of flash memory available on the node, similar to `FREE_RAM` |
| AVAILABLE_FLASH | Flash memory available to create new shards, similar to `PROVISIONAL_RAM` |
| VERSION | The cluster version installed on the node |
| SHA | The node’s SHA hash |
| RACK-ID | The node’s rack ID |
| STATUS | The node’s status |

### Example

``` sh
$ rladmin status nodes sort PROVISIONAL_RAM HOSTNAME
CLUSTER NODES:
NODE:ID     ROLE       ADDRESS          EXTERNAL_ADDRESS          HOSTNAME            SHARDS     CORES          FREE_RAM                 PROVISIONAL_RAM          VERSION        STATUS   
node:1      master     198.51.100.2                                 3d99db1fdf4b        4/100      6              14.74GB/19.54GB          10.73GB/16.02GB          6.2.12-37      OK       
*node:3     slave      198.51.100.4                                 b87cc06c830f        0/100      6              14.74GB/19.54GB          11.22GB/16.02GB          6.2.12-37      OK       
node:2      slave      198.51.100.3                                 fc7a3d332458        0/100      6              14.74GB/19.54GB          11.22GB/16.02GB          6.2.12-37      OK       
```

## `status shards`

Displays the current status of all shards on the cluster.

``` sh
rladmin status shards
        [ node <id> ]
        [ db {db:<id> | <name>} ]
        [ extra <parameters> ]
        [ sort <column_titles> ]
        [ issues_only ]
```

### Parameters

| Parameter | Description |
|-----------|-------------|
| node \<id\> | Only show shards for the specified node ID |
| db db:\<id\> | Only show shards for the specified database ID |
| db \<name\> | Only show shards for the specified database name |
| extra \<parameter\> | Extra options that show more information |
| sort \<column_titles\> | Sort results by specified column titles |
| issues_only | Filters out all items that have an `OK` status  |


| Extra parameter | Description |
|-------------------|-------------|
| extra all | Shows all `extra` information |
| extra backups | Shows periodic backup status |
| extra frag | Shows fragmented memory available after the restart |
| extra shardstats | Shows shards per node |
| extra rack_id | Shows `rack_id` if customer is not `rack_aware` |
| extra redis_version | Shows Redis version of all shards in the cluster |
| extra state_machine | Shows execution of state machine information  |
| extra watchdog | Shows watchdog status  |

### Returns {#returns-shards}

Returns a table of the status of all shards on the cluster.

If `sort <column_titles>` is specified, the result is sorted by the specified table columns.

If `issues_only` is specified, it only shows shards that do not have an `OK` status.

The following table describes the fields returned by `rladmin status shards extra all`:

| Field | Description |
|-------|-------------|
| DB:ID | Database ID |
| NAME | Database name |
| ID | Shard ID |
| NODE | The node on which the shard resides |
| ROLE | The shard’s role: primary (`master`) or replica (`slave`) |
| SLOTS | Redis keys slot range of the shard |
| USED_MEMORY | Memory used by the shard |
| BACKUP_PROGRESS | The shard’s backup progress |
| RAM_FRAG | The shard’s RAM fragmentation caused by deleted data or expired keys. A large value can indicate inefficient memory allocation. |
| FLASH_FRAG | For Auto Tiering databases, the shard’s flash fragmentation |
| WATCHDOG_STATUS | The shard is being monitored by the node watchdog and the shard is healthy |
| STATUS | The shard’s status |

### Example

``` sh
$ rladmin status shards sort USED_MEMORY ID
SHARDS:
DB:ID               NAME                       ID                   NODE               ROLE               SLOTS                           USED_MEMORY                     STATUS          
db:3                database3                  redis:6              node:1             master             8192-12287                      2.04MB                          OK              
db:3                database3                  redis:4              node:1             master             0-4095                          2.08MB                          OK              
db:3                database3                  redis:5              node:1             master             4096-8191                       2.08MB                          OK              
db:3                database3                  redis:7              node:1             master             12288-16383                     2.08MB                          OK              
```
