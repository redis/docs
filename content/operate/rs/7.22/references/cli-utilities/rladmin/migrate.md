---
Title: rladmin migrate
alwaysopen: false
categories:
- docs
- operate
- rs
description: Moves Redis Enterprise Software shards or endpoints to a new node in
  the same cluster.
headerRange: '[1-2]'
linkTitle: migrate
toc: 'true'
weight: $weight
url: '/operate/rs/7.22/references/cli-utilities/rladmin/igrate/'
---

Moves Redis Enterprise shards or endpoints to a new node in the same cluster.

For more information about shard migration use cases and considerations, see [Migrate database shards]({{<relref "/operate/rs/7.22/databases/migrate-shards">}}).

## `migrate all_master_shards`

Moves all primary shards of a specified database or node to a new node in the same cluster.

```sh
rladmin migrate { db { db:<id> | <name> } | node <origin node ID> }
        all_master_shards
        target_node <id>
        [ override_policy ]
```

### Parameters

| Parameter                     | Type/Value             | Description                                                                     |
|-------------------------------|------------------------|---------------------------------------------------------------------------------|
| db                            | db:\<id\><br /> name   | Limits migration to a specific database                                           |
| node                          | integer                | Limits migration to a specific origin node                                        |
| target_node                   | integer                | Migration target node                                                           |
| override_policy               |                        | Overrides the rack aware policy and allows primary and replica shards on the same node |

### Returns

Returns `Done` if the migration completed successfully. Otherwise, returns an error.

Use [`rladmin status shards`]({{< relref "/operate/rs/7.22/references/cli-utilities/rladmin/status#status-shards" >}}) to verify the migration completed.

### Example

```sh
$ rladmin status shards db db:6 sort ROLE
SHARDS:
DB:ID  NAME       ID         NODE    ROLE    SLOTS         USED_MEMORY   STATUS
db:6   tr02       redis:14   node:3  master  0-4095        3.01MB        OK     
db:6   tr02       redis:16   node:3  master  4096-8191     3.2MB         OK     
db:6   tr02       redis:18   node:3  master  8192-12287    3.2MB         OK     
db:6   tr02       redis:20   node:3  master  12288-16383   3.01MB        OK
$ rladmin migrate db db:6 all_master_shards target_node 1
Monitoring 8b0f28e2-4342-427a-a8e3-a68cba653ffe
queued - migrate_shards
running - migrate_shards
Executing migrate_redis with shards_uids ['18', '14', '20', '16']
Ocompleted - migrate_shards
Done
$ rladmin status shards node 1
SHARDS:
DB:ID  NAME       ID         NODE    ROLE    SLOTS         USED_MEMORY   STATUS
db:6   tr02       redis:14   node:1  master  0-4095        3.22MB        OK     
db:6   tr02       redis:16   node:1  master  4096-8191     3.22MB        OK     
db:6   tr02       redis:18   node:1  master  8192-12287    3.22MB        OK     
db:6   tr02       redis:20   node:1  master  12288-16383   2.99MB        OK  
```
## `migrate all_shards`

Moves all shards on a specified node to a new node in the same cluster.

``` sh
rladmin migrate node <origin node ID>
            [ max_concurrent_bdb_migrations <value> ]
            all_shards
            target_node <id>
            [ override_policy ]
```

### Parameters

| Parameter                     | Type/Value             | Description                                                                     |
|-------------------------------|------------------------|---------------------------------------------------------------------------------|
| node                          | integer                | Limits migration to a specific origin node                                        |
| max_concurrent_bdb_migrations | integer                | Sets the maximum number of concurrent endpoint migrations                           |
| override_policy               |                        | Overrides the rack aware policy and allows primary and replica shards on the same node |

### Returns

Returns `Done` if the migration completed successfully. Otherwise, returns an error.

Use [`rladmin status shards`]({{< relref "/operate/rs/7.22/references/cli-utilities/rladmin/status#status-shards" >}}) to verify the migration completed.

### Example

```sh
$ rladmin status shards node 1
SHARDS:
DB:ID  NAME       ID         NODE    ROLE    SLOTS         USED_MEMORY   STATUS
db:5   tr01       redis:12   node:1  master  0-16383       3.04MB        OK
db:6   tr02       redis:15   node:1  slave   0-4095        2.93MB        OK
db:6   tr02       redis:17   node:1  slave   4096-8191     2.93MB        OK
db:6   tr02       redis:19   node:1  slave   8192-12287    3.08MB        OK
db:6   tr02       redis:21   node:1  slave   12288-16383   3.08MB        OK
$ rladmin migrate node 1 all_shards target_node 2
Monitoring 71a4f371-9264-4398-a454-ce3ff4858c09
queued - migrate_shards
.running - migrate_shards
Executing migrate_redis with shards_uids ['21', '15', '17', '19']
OExecuting migrate_redis with shards_uids ['12']
Ocompleted - migrate_shards
Done
$ rladmin status shards node 2
SHARDS:
DB:ID  NAME       ID         NODE    ROLE    SLOTS         USED_MEMORY   STATUS
db:5   tr01       redis:12   node:2  master  0-16383       3.14MB        OK
db:6   tr02       redis:15   node:2  slave   0-4095        2.96MB        OK
db:6   tr02       redis:17   node:2  slave   4096-8191     2.96MB        OK
db:6   tr02       redis:19   node:2  slave   8192-12287    2.96MB        OK
db:6   tr02       redis:21   node:2  slave   12288-16383   2.96MB        OK
```

## `migrate all_slave_shards`

Moves all replica shards of a specified database or node to a new node in the same cluster.

```sh
rladmin migrate { db { db:<id> | <name> } | node <origin node ID> }
            all_slave_shards
            target_node <id>
            [ override_policy ]
```

### Parameters

| Parameter                     | Type/Value             | Description                                                                     |
|-------------------------------|------------------------|---------------------------------------------------------------------------------|
| db                            | db:\<id\><br /> name   | Limits migration to a specific database                                           |
| node                          | integer                | Limits migration to a specific origin node                                        |
| target_node                   | integer                | Migration target node                                                           |
| override_policy               |                        | Overrides the rack aware policy and allows primary and replica shards on the same node |

### Returns

Returns `Done` if the migration completed successfully. Otherwise, returns an error.

Use [`rladmin status shards`]({{< relref "/operate/rs/7.22/references/cli-utilities/rladmin/status#status-shards" >}}) to verify the migration completed.

### Example

```sh
$ rladmin status shards db db:6 node 2
SHARDS:
DB:ID  NAME      ID         NODE    ROLE   SLOTS          USED_MEMORY    STATUS
db:6   tr02      redis:15   node:2  slave  0-4095         3.06MB         OK
db:6   tr02      redis:17   node:2  slave  4096-8191      3.06MB         OK
db:6   tr02      redis:19   node:2  slave  8192-12287     3.06MB         OK
db:6   tr02      redis:21   node:2  slave  12288-16383    3.06MB         OK
$ rladmin migrate db db:6 all_slave_shards target_node 3
Monitoring 5d36a98c-3dc8-435f-8ed9-35809ba017a4
queued - migrate_shards
.running - migrate_shards
Executing migrate_redis with shards_uids ['15', '17', '21', '19']
Ocompleted - migrate_shards
Done
$ rladmin status shards db db:6 node 3
SHARDS:
DB:ID  NAME      ID         NODE    ROLE   SLOTS          USED_MEMORY    STATUS
db:6   tr02      redis:15   node:3  slave  0-4095         3.04MB         OK
db:6   tr02      redis:17   node:3  slave  4096-8191      3.04MB         OK
db:6   tr02      redis:19   node:3  slave  8192-12287     3.04MB         OK
db:6   tr02      redis:21   node:3  slave  12288-16383    3.04MB         OK
```

## `migrate endpoint_to_shards`

Moves database endpoints to the node where the majority of primary shards are located.

```sh
rladmin migrate [ db { db:<id> | <name> } ]
            endpoint_to_shards
            [ restrict_target_node <id> ]
            [ commit ]
            [ max_concurrent_bdb_migrations <value> ]
```

### Parameters

| Parameter                     | Type/Value             | Description                                                                     |
|-------------------------------|------------------------|---------------------------------------------------------------------------------|
| db                            | db:\<id\><br /> name   | Limits migration to a specific database                                           |
| restrict_target_node          | integer | Moves the endpoint only if the target node matches the specified node |
| commit                        |                        | Performs endpoint movement                                                      |
| max_concurrent_bdb_migrations | integer                | Sets the maximum number of concurrent endpoint migrations                           |


### Returns

Returns a list of steps to perform the migration. If the `commit` flag is set, the steps will run and return `Finished successfully` if they were completed. Otherwise, returns an error.

Use [`rladmin status endpoints`]({{< relref "/operate/rs/7.22/references/cli-utilities/rladmin/status#status-endpoints" >}}) to verify that the endpoints were moved.

### Example

```sh
$ rladmin status endpoints db db:6
ENDPOINTS:
DB:ID    NAME   ID                 NODE      ROLE                       SSL     
db:6     tr02   endpoint:6:1       node:3    all-master-shards          No      
$ rladmin migrate db db:6 endpoint_to_shards
* Going to bind endpoint:6:1 to node 1
Dry-run completed, add 'commit' argument to execute
$ rladmin migrate db db:6 endpoint_to_shards commit
* Going to bind endpoint:6:1 to node 1
Executing bind endpoint:6:1: OOO.
Finished successfully
$ rladmin status endpoints db db:6
ENDPOINTS:
DB:ID    NAME   ID                 NODE      ROLE                       SSL     
db:6     tr02   endpoint:6:1       node:1    all-master-shards          No      
```

## `migrate shard`

Moves one or more shards to a new node in the same cluster.

```sh
rladmin migrate shard <id1.. idN>
            [ preserve_roles ]
            target_node <id>
            [ override_policy ]
```

### Parameters

| Parameter                     | Type/Value             | Description                                                                     |
|-------------------------------|------------------------|---------------------------------------------------------------------------------|
| shard                         | list of shard IDs      | Shards to migrate                                                               |
| preserve_roles                |                        | Performs an additional failover to guarantee the primary shards' roles are preserved |
| target_node                   | integer                | Migration target node                                                           |
| override_policy               |                        | Overrides the rack aware policy and allows primary and replica shards on the same node |

### Returns

Returns `Done` if the migration completed successfully. Otherwise, returns an error.

Use [`rladmin status shards`]({{< relref "/operate/rs/7.22/references/cli-utilities/rladmin/status#status-shards" >}}) to verify the migration completed.

### Example

```sh
$ rladmin status shards db db:5
SHARDS:
DB:ID  NAME        ID         NODE     ROLE     SLOTS     USED_MEMORY    STATUS
db:5   tr01        redis:12   node:2   master   0-16383   3.01MB         OK
db:5   tr01        redis:13   node:3   slave    0-16383   3.1MB          OK
$ rladmin migrate shard 13 target_node 1
Monitoring d2637eea-9504-4e94-a70c-76df087efcb2
queued - migrate_shards
.running - migrate_shards
Executing migrate_redis with shards_uids ['13']
Ocompleted - migrate_shards
Done
$ rladmin status shards db db:5
SHARDS:
DB:ID  NAME        ID         NODE     ROLE     SLOTS     USED_MEMORY    STATUS
db:5   tr01        redis:12   node:2   master   0-16383   3.01MB         OK
db:5   tr01        redis:13   node:1   slave    0-16383   3.04MB         OK
```
