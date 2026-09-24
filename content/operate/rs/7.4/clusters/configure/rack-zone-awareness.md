---
Title: Rack-zone awareness in Redis Enterprise Software
alwaysopen: false
categories:
- docs
- operate
- rs
- kubernetes
description: Rack-zone awareness ensures high availability in the event of a rack
  or zone failure.
linkTitle: Rack-zone awareness
weight: 70
url: '/operate/rs/7.4/clusters/configure/rack-zone-awareness/'
---
Rack-zone awareness helps ensure high availability in the event of a rack or zone failure.

When you enable rack-zone awareness in a Redis Enterprise Software cluster, you assign
a [rack-zone ID](#rack-zone-id-rules) to each node. This ID is used to map the node to a
physical rack or logical zone. The cluster can then ensure that master shards, corresponding replica shards, and associated endpoints are placed on [nodes in different racks or zones](#node-layout-guidelines).

In the event of a rack or zone failure, the replicas and endpoints in the remaining racks and zones are promoted. This ensures high availability when a rack or zone fails.

There is no limitation on the number of racks and zones per cluster. Each
node can belong to a different rack or multiple nodes can belong to the
same rack.

Rack-zone awareness affects various cluster, node, and database actions, such as node rebalancing, node removal, node replacement, shard and endpoint migration, and database failover.

## Rack-zone ID rules

The rack-zone ID must comply with the following rules:

- Maximum length of 63 characters.
- Characters consist of letters, digits, and hyphens ('-'). Underscores ('_') are also accepted as of Redis Enterprise Software 6.4.2-61.
- ID starts with a letter and ends with a letter or a digit.

> [!NOTE]
> Rack-zone IDs are **case-insensitive** (uppercase and lowercase letter are treated as the same).

## Node layout guidelines

Avoid placing the majority of nodes in one availability zone.

If a Redis Enterprise Software cluster consists of three nodes (the recommended minimum), follow these guidelines:

- For high availability, the three nodes must be distributed across three *distinct* racks or zones.

- When using availability zones, all three zones should exist within the same *region* to avoid potential latency issues.

## Set up rack-zone awareness

To enable rack-zone awareness, you need to configure it for the
cluster, nodes, and [databases](#enable-database-rack-zone-awareness).

> [!NOTE]
> - After rack-zone awareness is enabled for a cluster, it cannot be turned off.
>
> - After a rack ID is assigned to a node, it cannot be changed.

### New cluster

You can set up rack-zone awareness for the cluster and its nodes during [cluster creation](/content/operate/rs/7.4/clusters/new-cluster-setup.md):

1. In the **Cluster** screen's **Configuration** section, enable **Rack zone awareness**.

1. Select **Next** to continue to the **Node** configuration screen.

1. Enter a **Rack-zone ID** for the current node.

1. Finish [cluster setup](/content/operate/rs/7.4/clusters/new-cluster-setup.md).

1. For every [node you add to the cluster](/content/operate/rs/7.4/clusters/add-node.md), assign a different **Rack-zone ID**.

### Existing cluster

If you did not configure rack-zone awareness during cluster creation, you can configure rack-zone awareness for existing clusters using the [REST API](/content/operate/rs/7.4/references/rest-api/_index.md):

1. For each node in the cluster, assign a different rack-zone ID using the REST API to [update the node](/content/operate/rs/7.4/references/rest-api/requests/nodes/_index.md#put-node):

    ```sh
    PUT /v1/nodes/<node-ID>
    { "rack_id": "rack-zone-ID" }
    ```

1. [Update the cluster policy](/content/operate/rs/7.4/references/rest-api/requests/cluster/policy.md#put-cluster-policy) to enable rack-zone awareness:

    ```sh
    PUT /v1/cluster/policy
    { "rack_aware": true }
    ```

## Enable database rack-zone awareness

Before you can enable rack-zone awareness for a database, you must configure rack-zone awareness for the cluster and its nodes. For more information, see [set up rack-zone awareness](#set-up-rack-zone-awareness).

<!--
To enable rack-zone awareness for a database using the Cluster Manager UI:

1. From **databases**, [create a new database](/content/operate/rs/7.4/databases/create.md) or edit an existing database's **configuration**.

1. Expand the **High availability & durability** section.

1. Enable [**Replication**](/content/operate/rs/7.4/databases/durability-ha/replication.md).

1. Select **Rack-zone awareness**.

    {{<image filename="images/rs/screenshots/databases/config-rack-zone-awareness.png" alt="Select the Rack-zone awareness checkbox to enable rack-zone awareness for the database." >}}

1. **Create** or **Save** your database.

1. [Rearrange database shards](#rearrange-database-shards) to optimize an existing database for rack-zone awareness.

    > [!NOTE]
    > If you enabled rack-zone awareness during database creation, you can ignore this step.
    >
-->

To enable rack-zone awareness for a database, use a [REST API request](/content/operate/rs/7.4/references/rest-api/requests/bdbs/_index.md#put-bdbs):

```sh
PUT /v1/bdbs/<database-ID>
{ "rack_aware": true }
```

### Rearrange database shards

After you enable rack-zone awareness for an existing database, you should generate an optimized shard placement blueprint using the [REST API](/content/operate/rs/7.4/references/rest-api/_index.md) and use it to rearrange the shards in different racks or zones.

1. [Generate an optimized shard placement blueprint](/content/operate/rs/7.4/references/rest-api/requests/bdbs/actions/optimize_shards_placement.md#get-bdbs-actions-optimize-shards-placement):

    1. Send the following `GET` request:

        ```sh
        GET /v1/bdbs/<database-ID>/actions/optimize_shards_placement
        ```

    1. Copy the `cluster-state-id` from the response headers.

    1. Copy the JSON response body, which represents the new shard placement blueprint.

1. [Rearrange the database shards](/content/operate/rs/7.4/references/rest-api/requests/bdbs/actions/optimize_shards_placement.md#put-bdbs-rearrange-shards) according to the new shard placement blueprint:

    1. In the request headers, include the <nobr>`cluster-state-id`</nobr> from the `optimize_shards_placement` response.

    1. Add the following JSON in the request body and replace <nobr>`<shard placement blueprint>`</nobr> with the new blueprint:

        ```sh
        {
          "shards_blueprint": <shard placement blueprint>
        }
        ```

    1. Send the following `PUT` request to rearrange the shards:

        ```sh
        PUT /v1/bdbs/<database-ID>
        ```

## Shard placement without rack-zone awareness

Even if a database has rack-zone awareness turned off, the cluster still ensures that master and replica shards are placed on distinct nodes.
