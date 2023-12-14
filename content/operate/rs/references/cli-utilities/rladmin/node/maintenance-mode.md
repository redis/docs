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
---

Configures [quorum-only mode]({{< relref "/operate/rs/clusters/maintenance-mode#activate-maintenance-mode" >}}) on a node.

## `node maintenance_mode on`

Migrates shards out of the node and turns the node into a quorum node to prevent shards from returning to it.

```sh
rladmin node <ID> maintenance_mode on
        [ keep_slave_shards ]
        [ demote_node ]
        [ max_concurrent_actions <integer> ]
```

### Parameters

| Parameter             | Type/Value                     | Description                                                                               |
|-----------------------|--------------------------------|-------------------------------------------------------------------------------------------|
| node                  | integer                        | Turns the specified node into a quorum node                                              |
| demote_node           |                                | If the node is a primary node, changes the node to replica                                |
| keep_slave_shards     |                                | Keeps replica shards in the node and demotes primary shards to replicas                    |
| max_concurrent_actions | integer | Maximum number of concurrent actions during node maintenance |

### Returns

Returns `OK` if the node was converted successfully. If the cluster does not have enough resources to migrate the shards, the process returns a warning.

Use [`rladmin status nodes`]({{< relref "/operate/rs/references/cli-utilities/rladmin/status#status-nodes" >}}) to verify the node became a quorum node.

### Example

```sh
$ rladmin node 2 maintenance_mode on
Performing maintenance_on action on node:2: 0%
created snapshot NodeSnapshot<name=maintenance_mode_2022-05-12_20-25-37,time=None,node_uid=2>

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

Use [`rladmin status nodes`]({{< relref "/operate/rs/references/cli-utilities/rladmin/status#status-nodes" >}}) to verify the node was restored.

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
