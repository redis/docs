---
Title: rladmin node maintenance_mode
alwaysopen: false
categories:
- docs
- operate
- rs
description: Turns quorum-only mode on or off for a node.
headerRange: '[1-2]'
linkTitle: maintenance_mode
toc: 'true'
weight: $weight
url: '/operate/rs/7.8/references/cli-utilities/rladmin/node/maintenance-mode/'
---

Configures [quorum-only mode]({{< relref "/operate/rs/7.8/clusters/maintenance-mode#activate-maintenance-mode" >}}) on a node.

## `node maintenance_mode on`

Migrates shards out of the node and turns the node into a quorum node to prevent shards from returning to it.

```sh
rladmin node <ID> maintenance_mode on
        [ keep_slave_shards ]
        [ evict_ha_replica { enabled | disabled } ]
        [ evict_active_active_replica { enabled | disabled } ]
        [ evict_dbs <list of database names or IDs> ]
        [ demote_node ]
        [ overwrite_snapshot ]
        [ max_concurrent_actions <integer> ]
```

### Parameters

| Parameter             | Type/Value                     | Description                                                                               |
|-----------------------|--------------------------------|-------------------------------------------------------------------------------------------|
| node                  | integer                        | Turns the specified node into a quorum node                                              |
| demote_node           |                                | If the node is a primary node, changes the node to replica                                |
| evict_ha_replica | `enabled`<br />`disabled` | Migrates the HA replica shards in the node |
| evict_active_active_replica | `enabled`<br />`disabled` | Migrates the Active-Active replica shards in the node |
| evict_dbs | list of database names or IDs | Specify databases whose shards should be evicted from the node when entering maintenance mode.<br /><br />Examples:<br />`$ rladmin node 1 maintenance_mode on evict_dbs db:1 db:2`<br />`$ rladmin node 1 maintenance_mode on evict_dbs db_name1 db_name2` |
| keep_slave_shards     |                                | Keeps replica shards in the node and demotes primary shards to replicas.<br /><br />Deprecated as of Redis Enterprise Software 7.4.2. Use `evict_ha_replica disabled evict_active_active_replica disabled` instead. |
| max_concurrent_actions | integer | Maximum number of concurrent actions during node maintenance |
| overwrite_snapshot | | Overwrites the latest existing node snapshot taken when enabling maintenance mode |

### Returns

Returns `OK` if the node was converted successfully. If the cluster does not have enough resources to migrate the shards, the process returns a warning.

Use [`rladmin status nodes`]({{< relref "/operate/rs/7.8/references/cli-utilities/rladmin/status#status-nodes" >}}) to verify the node became a quorum node.

### Example

```sh
$ rladmin node 2 maintenance_mode on overwrite_snapshot
Found snapshot from 2024-01-06T11:36:47Z, overwriting the snapshot
Performing maintenance_on action on node:2: 0%
created snapshot NodeSnapshot<name=maintenance_mode_2024-01-11_20-25-37,time=None,node_uid=2>

node:2 will not accept any more shards
Performing maintenance_on action on node:2: 100%
OK
$ rladmin status nodes
CLUSTER NODES:
NODE:ID ROLE   ADDRESS    EXTERNAL_ADDRESS  HOSTNAME     SHARDS CORES       FREE_RAM         PROVISIONAL_RAM  VERSION   STATUS
*node:1 master 192.0.2.12 198.51.100.1      3d99db1fdf4b 5/100  6           14.21GB/19.54GB  10.62GB/16.02GB  6.2.12-37 OK
node:2  slave  192.0.2.13 198.51.100.2      fc7a3d332458 0/0    6           14.21GB/19.54GB  0KB/0KB          6.2.12-37 OK
node:4  slave  192.0.2.14                   6d754fe12cb9 5/100  6           14.21GB/19.54GB  10.62GB/16.02GB  6.2.12-37 OK
```

## `node maintenance_mode off`

Turns maintenance mode off and returns the node to its previous state.

```sh
rladmin node <ID> maintenance_mode off
        [ { snapshot_name <name> | skip_shards_restore } ]
        [ max_concurrent_actions <integer> ]
```

### Parameters

| Parameter             | Type/Value                     | Description                                                                               |
|-----------------------|--------------------------------|-------------------------------------------------------------------------------------------|
| node                  | integer                        | Restores the node back to the previous state                                              |
| max_concurrent_actions | integer | Maximum number of concurrent actions during node maintenance |
| skip_shards_restore   |                                | Does not restore shards back to the node                                                  |
| snapshot_name         | string                         | Restores the node back to a state stored in the specified snapshot                        |

### Returns

Returns `OK` if the node was restored successfully.

Use [`rladmin status nodes`]({{< relref "/operate/rs/7.8/references/cli-utilities/rladmin/status#status-nodes" >}}) to verify the node was restored.

### Example

```sh
$ rladmin node 2 maintenance_mode off
Performing maintenance_off action on node:2: 0%
Found snapshot: NodeSnapshot<name=maintenance_mode_2022-05-12_20-25-37,time=2022-05-12T20:25:37Z,node_uid=2>
Performing maintenance_off action on node:2: 0%
migrate redis:12 to node:2: executing
Performing maintenance_off action on node:2: 0%
migrate redis:12 to node:2: finished
Performing maintenance_off action on node:2: 0%
migrate redis:17 to node:2: executing

migrate redis:15 to node:2: executing
Performing maintenance_off action on node:2: 0%
migrate redis:17 to node:2: finished

migrate redis:15 to node:2: finished
Performing maintenance_off action on node:2: 0%
failover redis:16: executing

failover redis:14: executing
Performing maintenance_off action on node:2: 0%
failover redis:16: finished

failover redis:14: finished
Performing maintenance_off action on node:2: 0%
failover redis:18: executing
Performing maintenance_off action on node:2: 0%
failover redis:18: finished

migrate redis:21 to node:2: executing

migrate redis:19 to node:2: executing
Performing maintenance_off action on node:2: 0%
migrate redis:21 to node:2: finished

migrate redis:19 to node:2: finished

failover redis:20: executing
Performing maintenance_off action on node:2: 0%
failover redis:20: finished
Performing maintenance_off action on node:2: 0%
rebind endpoint:6:1: executing
Performing maintenance_off action on node:2: 0%
rebind endpoint:6:1: finished
Performing maintenance_off action on node:2: 100%
OK
$ rladmin status nodes
CLUSTER NODES:
NODE:ID ROLE   ADDRESS    EXTERNAL_ADDRESS  HOSTNAME      SHARDS CORES       FREE_RAM        PROVISIONAL_RAM  VERSION   STATUS
*node:1 master 192.0.2.12 198.51.100.1      3d99db1fdf4b  5/100  6           14.2GB/19.54GB  10.61GB/16.02GB  6.2.12-37 OK    
node:2  slave  192.0.2.13 198.51.100.2      fc7a3d332458  5/100  6           14.2GB/19.54GB  10.61GB/16.02GB  6.2.12-37 OK    
node:4  slave  192.0.2.14                   6d754fe12cb9  0/100  6           14.2GB/19.54GB  10.69GB/16.02GB  6.2.12-37 OK
```
