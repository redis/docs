---
alwaysopen: false
categories:
- docs
- operate
- rs
db_type: database
description: How to migrate database shards to other nodes in a Redis Software cluster.
linkTitle: Migrate shards
title: Migrate database shards
toc: 'true'
weight: 32
url: '/operate/rs/7.8/databases/migrate-shards/'
---

To migrate database shards to other nodes in the cluster, you can use the [`rladmin migrate`]({{<relref "/operate/rs/references/cli-utilities/rladmin/migrate">}}) command or [REST API requests]({{<relref "/operate/rs/references/rest-api/requests/shards/actions/migrate">}}).

## Use cases for shard migration

Migrate database shards to a different node in the following scenarios:

- Before node removal.

- To balance the database manually in case of latency issues or uneven load distribution across nodes.

- To manage node resources, such as memory usage.

## Considerations for shard migration

For databases with replication:

- Migrating a shard will not cause disruptions since a primary shard will still be available.

- If you try to migrate a primary shard, it will be demoted to a replica shard and a replica shard will be promoted to primary before the migration. If you set `"preserve_roles": true` in the request, a second failover will occur after the migration finishes to change the migrated shard's role back to primary.

For databases without replication, the migrated shard will not be available until the migration is done.

Connected clients shouldn't be disconnected in either case.

If too many primary shards are placed on the same node, it can impact database performance.

## Migrate specific shard

To migrate a specific database shard, use one of the following methods:

- [`rladmin migrate shard`]({{<relref "/operate/rs/references/cli-utilities/rladmin/migrate#migrate-shard">}}):

    ```sh
    rladmin migrate shard <shard_id> target_node <node_id>
    ```

- [Migrate shard]({{<relref "/operate/rs/references/rest-api/requests/shards/actions/migrate#post-shard">}}) REST API request:

    Specify the ID of the shard to migrate in the request path and the destination node's ID as the `target_node_uid` in the request body. See the [request reference]({{<relref "/operate/rs/references/rest-api/requests/shards/actions/migrate#post-request-body">}}) for more options.

    ```sh
    POST /v1/shards/<shard_id>/actions/migrate
    {
        "target_node_uid": <node_id>
    }
    ```

    Example JSON response body:

    ```json
    {
        "action_uid": "<action_id>",
        "description": "Migrate was triggered"
    }
    ```

    You can track the action's progress with a [`GET /v1/actions/<action_uid>`]({{<relref "/operate/rs/references/rest-api/requests/actions#get-action">}}) request.

## Migrate multiple shards

To migrate multiple database shards, use one of the following methods:

- [`rladmin migrate shard`]({{<relref "/operate/rs/references/cli-utilities/rladmin/migrate#migrate-shard">}}):

    ```sh
    rladmin migrate shard <shard_id1> <shard_id2> <shard_id3> target_node <node_id>
    ```

- [Migrate multiple shards]({{<relref "/operate/rs/references/rest-api/requests/shards/actions/migrate#post-multi-shards">}}) REST API request:

    Specify the IDs of the shards to migrate in the `shard_uids` list and the destination node's ID as the `target_node_uid` in the request body. See the [request reference]({{<relref "/operate/rs/references/rest-api/requests/shards/actions/migrate#post-multi-request-body">}}) for more options.

    ```sh
    POST /v1/shards/actions/migrate
    {
        "shard_uids": ["<shard_id1>","<shard_id2>","<shard_id3>"],
        "target_node_uid": <node_id>
    }
    ```

    Example JSON response body:

    ```json
    {
        "action_uid": "<action_id>",
        "description": "Migrate was triggered"
    }
    ```

    You can track the action's progress with a [`GET /v1/actions/<action_uid>`]({{<relref "/operate/rs/references/rest-api/requests/actions#get-action">}}) request.

## Migrate all shards from a node

To migrate all shards from a specific node to another node, run [`rladmin migrate all_shards`]({{<relref "/operate/rs/references/cli-utilities/rladmin/migrate#migrate-all_shards">}}):

```sh
rladmin migrate node <origin_node_id> all_shards target_node <node_id>
```

## Migrate primary shards

You can use the [`rladmin migrate all_master_shards`]({{<relref "/operate/rs/references/cli-utilities/rladmin/migrate#migrate-all_master_shards">}}) command to migrate all primary shards for a specific database or node to another node in the cluster.

To migrate a specific database's primary shards:

```sh
rladmin migrate db db:<id> all_master_shards target_node <node_id>
```

To migrate all primary shards from a specific node:

```sh
rladmin migrate node <origin_node_id> all_master_shards target_node <node_id>
```

## Migrate replica shards

You can use the [`rladmin migrate all_slave_shards`]({{<relref "/operate/rs/references/cli-utilities/rladmin/migrate#migrate-all_slave_shards">}}) command to migrate all replica shards for a specific database or node to another node in the cluster.

To migrate a specific database's replica shards:

```sh
rladmin migrate db db:<id> all_slave_shards target_node <node_id>
```

To migrate all replica shards from a specific node:

```sh
rladmin migrate node <origin_node_id> all_slave_shards target_node <node_id>
```
