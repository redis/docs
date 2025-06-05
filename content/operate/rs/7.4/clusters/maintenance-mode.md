---
Title: Maintenance mode for cluster nodes
alwaysopen: false
categories:
- docs
- operate
- rs
description: Prepare a cluster node for maintenance.
linkTitle: Maintenance mode
weight: 60
url: '/operate/rs/7.4/clusters/maintenance-mode/'
---

Use maintenance mode to prevent data loss during hardware patching or operating system maintenance on Redis Enterprise servers. When maintenance mode is on, all shards move off of the node under maintenance and migrate to another available node.

## Activate maintenance mode

When you activate maintenance mode, Redis Enterprise does the following:

1. Checks whether the cluster has enough active nodes to maintain quorum if one goes down. If taking a node offline would cause quorum loss, maintenance mode will not activate.

    {{<warning>}}
This check does not consider if other nodes are already in maintenance mode. Do not put the majority of nodes into maintenance mode and restart them simultaneously, as this can cause the cluster to lose quorum and lead to data loss.
    {{</warning>}}

1. If no maintenance mode snapshots already exist or if you use `overwrite_snapshot` when you activate maintenance mode, Redis Enterprise creates a new node snapshot that records the node's shard and endpoint configuration.

1. Marks the node as a quorum node to prevent shards and endpoints from migrating to it.

    At this point, [`rladmin status`]({{< relref "/operate/rs/7.4/references/cli-utilities/rladmin/status" >}}) displays the node's shards field in yellow, which indicates that shards cannot migrate to the node.

    {{< image filename="/images/rs/maintenance_mode.png" >}}

1. Migrates shards and binds endpoints to other nodes, when space is available.

Maintenance mode does not demote a master node by default. The cluster elects a new master node when the original master node restarts. 

Add the `demote_node` option to the `rladmin` command to [demote a master node](#demote-a-master-node) when you activate maintenance mode.

To activate maintenance mode for a node, run the following command:

```sh
rladmin node <node_id> maintenance_mode on overwrite_snapshot
```

You can start server maintenance if:

- All shards and endpoints have moved to other nodes

- Enough nodes are still online to maintain quorum

### Prevent replica shard migration

If you do not have enough resources available to move all of the shards to other nodes, you can turn maintenance mode on without migrating the replica shards.

Before you prevent replica shard migration during maintenance mode, consider the following effects:

- Replica shards remain on the node during maintenance.

- If the maintenance node fails, the master shards do not have replica shards to maintain data redundancy and high availability.

- Replica shards that remain on the node can still be promoted during failover to preserve availability.

To activate maintenance mode without replica shard migration, run:

```sh
rladmin node <node_id> maintenance_mode on evict_ha_replica disabled evict_active_active_replica disabled
```

### Demote a master node

If maintenance might affect connectivity to the master node, you can demote the master node when you  activate maintenance mode.  This lets the cluster elect a new master node.

To demote a master node when activating maintenance mode, run:

```sh
rladmin node <node_id> maintenance_mode on demote_node
```

### Verify maintenance mode activation

To verify maintenance mode for a node, use `rladmin status` and review the node's shards field.  If that value is displayed in yellow (shown earlier), then the node is in maintenance mode.

Avoid activating maintenance mode when it is already active.  Maintenance mode activations stack.  If you activate maintenance mode for a node that is already in maintenance mode, you will have to deactivate maintenance mode twice in order to restore full functionality.

## Deactivate maintenance mode

When you deactivate maintenance mode, Redis Enterprise:

1. Loads a [specified node snapshot](#specify-a-snapshot) or defaults to the latest maintenance mode snapshot.

1. Unmarks the node as a quorum node to allow shards and endpoints to migrate to the node.

1. Restores the shards and endpoints that were in the node at the time of the snapshot.

1. Deletes the snapshot.

To deactivate maintenance mode after server maintenance, run:

```sh
rladmin node <node_id> maintenance_mode off
```

By default, a snapshot is required to deactivate maintenance mode.  If the snapshot cannot be restored, deactivation is cancelled and the node remains in maintenance mode.  In such events, it may be necessary to [reset node status](#reset_node_status).

### Specify a snapshot

When you turn off maintenance mode, you can restore the node configuration from a maintenance mode snapshot or any snapshots previously created by [`rladmin node <node_id> snapshot create`]({{< relref "/operate/rs/7.4/references/cli-utilities/rladmin/node/snapshot#node-snapshot-create" >}}). If you do not specify a snapshot, Redis Enterprise uses the latest maintenance mode snapshot by default.

To get a list of available snapshots, run:

```sh
rladmin node <node_id> snapshot list
```

To specify a snapshot when you turn maintenance mode off, run:

```sh
rladmin node <node_id> maintenance_mode off snapshot_name <snapshot_name>
```

{{<note>}}
If an error occurs when you turn on maintenance mode, the snapshot is not deleted.
When you rerun the command, use the snapshot from the initial attempt since it contains the original state of the node.
{{</note>}}

### Skip shard restoration

You can prevent the migrated shards and endpoints from returning to the original node after you turn off maintenance mode.

To turn maintenance mode off and skip shard restoration, run:

```sh
rladmin node <node_id> maintenance_mode off skip_shards_restore
```

### Reset node status

In extreme cases, you may need to reset a node's status.  Run the following commands to do so:

```
$ rladmin tune node <node_id> max_listeners 100
$ rladmin tune node <node_id> quorum_only disabled
```

Use these commands with caution.  For best results, contact Support before running these commands.

## Cluster status example

This example shows how the output of [`rladmin status`]({{< relref "/operate/rs/7.4/references/cli-utilities/rladmin/status" >}}) changes when you turn on maintenance mode for a node.

The cluster status before turning on maintenance mode:

```sh
redislabs@rp1_node1:/opt$ rladmin status
CLUSTER NODES:
NODE:ID   ROLE     ADDRESS       EXTERNAL_ADDRESS     HOSTNAME    SHARDS
*node:1   master   172.17.0.2                         rp1_node1   2/100
node:2    slave    172.17.0.4                         rp3_node1   2/100
node:3    slave    172.17.0.3                         rp2_node1   0/100
```

The cluster status after turning on maintenance mode:

```sh
redislabs@rp1_node1:/opt$ rladmin node 2 maintenance_mode on
Performing maintenance_on action on node:2: 0%
created snapshot NodeSnapshot<name=maintenance_mode_2019-03-14_09-50-59,time=None,node_uid=2>

node:2 will not accept any more shards
Performing maintenance_on action on node:2: 100%
OK
redislabs@rp1_node1:/opt$ rladmin status
CLUSTER NODES:
NODE:ID   ROLE     ADDRESS       EXTERNAL_ADDRESS     HOSTNAME    SHARDS
*node:1   master   172.17.0.2                         rp1_node1   2/100
node:2    slave    172.17.0.4                         rp3_node1   0/0
node:3    slave    172.17.0.3                         rp2_node1   2/100
```

After turning on maintenance mode for node 2, Redis Enterprise saves a snapshot of its configuration and then moves its shards and endpoints to node 3.

Now node 2 has `0/0` shards because shards cannot migrate to it while it is in maintenance mode.

## Maintenance mode REST API

You can also turn maintenance mode on or off using [REST API requests]({{< relref "/operate/rs/7.4/references/rest-api" >}}) to [<nobr>POST `/nodes/{node_uid}/actions/{action}`</nobr>]({{< relref "/operate/rs/7.4/references/rest-api/requests/nodes/actions#post-node-action" >}}).

### Activate maintenance mode (REST API)

Use <nobr>`POST /nodes/{node_uid}/actions/maintenance_on`</nobr> to activate maintenance mode:

```sh
POST https://<hostname>:9443/v1/nodes/<node_id>/actions/maintenance_on
{
    "overwrite_snapshot": true,
    "evict_ha_replica": true,
    "evict_active_active_replica": true
}
```

You can set `evict_ha_replica` and `evict_active_active_replica` to `false` to [prevent replica shard migration](#prevent-replica-shard-migration).

The `maintenance_on` request returns a JSON response body:

```json
{
    "status":"queued",
    "task_id":"<task-id-guid>"
}
```

### Deactivate maintenance mode (REST API)

Use <nobr>`POST /nodes/{node_uid}/actions/maintenance_off`</nobr> deactivate maintenance mode:

```sh
POST https://<hostname>:9443/v1/nodes/<node_id>/actions/maintenance_off
{ "skip_shards_restore": false }
```

The `skip_shards_restore` boolean flag allows the `maintenance_off` action to [skip shard restoration](#skip-shard-restoration) when set to `true`.

The `maintenance_off` request returns a JSON response body:

```json
{
    "status":"queued",
    "task_id":"<task-id-guid>"
}
```

### Track action status

You can send a request to [<nobr>GET `/nodes/{node_uid}/actions/{action}`</nobr>]({{< relref "/operate/rs/7.4/references/rest-api/requests/nodes/actions#get-node-action" >}}) to track the [status]({{< relref "/operate/rs/7.4/references/rest-api/objects/action" >}}) of the `maintenance_on` and `maintenance_off` actions.

This request returns the status of the `maintenance_on` action:

```sh
GET https://<hostname>:9443/v1/nodes/<node_id>/actions/maintenance_on
```

The response body:

```json
{
    "status":"completed",
    "task_id":"38c7405b-26a7-4379-b84c-cab4b3db706d"
}
```
