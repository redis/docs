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
---
Rack-zone awareness helps ensure high availability in the event of a rack or zone failure.

When you enable rack-zone awareness in a Redis Enterprise Software cluster, you assign
a [rack-zone ID](#rack-zone-id-rules) to each node. This ID is used to map the node to a
physical rack or logical zone. The cluster can then ensure that primary shards, corresponding replica shards, and associated endpoints are placed on [nodes in different racks or zones](#node-layout-guidelines).

In the event of a rack or zone failure, the replicas and endpoints in the remaining racks and zones are promoted. This ensures high availability when a rack or zone fails.

There is no limitation on the number of racks and zones per cluster. Each
node can belong to a different rack or multiple nodes can belong to the
same rack.

Rack-zone awareness affects various cluster, node, and database actions, such as node rebalancing, node removal, node replacement, shard and endpoint migration, and database failover.

## Rack-zone ID rules

The rack-zone ID must comply with the following rules:

- Maximum length of 63 characters.
- Characters consist of letters, digits, and hyphens ('-'). Underscores ('_') are also accepted as of Redis Enterprise Software [6.4.2-61]({{< relref "/operate/rs/release-notes/rs-6-4-2-releases/rs-6-4-2-61" >}}).
- ID starts with a letter and ends with a letter or a digit.

{{< note >}}
Rack-zone IDs are **case-insensitive** (uppercase and lowercase letter are treated as the same).
{{< /note >}}

## Node layout guidelines

Avoid placing the majority of nodes in one availability zone.

If a Redis Enterprise Software cluster consists of three nodes (the recommended minimum), follow these guidelines:

- For high availability, the three nodes must be distributed across three *distinct* racks or zones.

- When using availability zones, all three zones should exist within the same *region* to avoid potential latency issues.

## Set up rack-zone awareness

To enable rack-zone awareness, you need to configure it for the
cluster, nodes, and [databases](#enable-database-rack-zone-awareness).

### New cluster

You can set up rack-zone awareness for the cluster and its nodes during [cluster creation]({{< relref "/operate/rs/clusters/new-cluster-setup" >}}):

1. In the **Cluster** screen's **Configuration** section, enable **Rack zone awareness**.

1. Select **Next** to continue to the **Node** configuration screen.

1. Enter a **Rack-zone ID** for the current node.

1. Finish [cluster setup]({{< relref "/operate/rs/clusters/new-cluster-setup" >}}).

1. For every [node you add to the cluster]({{< relref "/operate/rs/clusters/add-node" >}}), assign a different **Rack-zone ID**.

### Existing cluster

If you did not configure rack-zone awareness during cluster creation, you can configure rack-zone awareness for existing clusters using the [REST API]({{< relref "/operate/rs/references/rest-api" >}}):

1. For each node in the cluster, assign a different rack-zone ID using the REST API to [update the node]({{< relref "/operate/rs/references/rest-api/requests/nodes#put-node" >}}):

    ```sh
    PUT /v1/nodes/<node-ID>
    { "rack_id": "rack-zone-ID" }
    ```

1. [Update the cluster policy]({{< relref "/operate/rs/references/rest-api/requests/cluster/policy#put-cluster-policy" >}}) to enable rack-zone awareness:

    ```sh
    PUT /v1/cluster/policy
    { "rack_aware": true }
    ```

## Set up two-dimensional rack-zone awareness

As of Redis Enterprise Software version 7.22, you can assign a `second_rack_id` to set up two-dimensional rack-zone awareness.

You can use two-dimensional rack-zone awareness to create logical zones within a zone or rack. The primary and replica node placement and failovers within the `second_rack_id` follow the same rules as `rack_id`.

### New clusters

To set up two-dimensional rack-zone awareness during cluster creation, assign a `second_rack_id` to each node in the cluster in addition to the `rack_id` using the [REST API]({{<relref "/operate/rs/references/rest-api">}}) or [rladmin]({{<relref "/operate/rs/references/cli-utilities/rladmin">}}).

#### REST API method

To create a new cluster with two-dimensional rack-zone awareness, you can use [bootstrap REST API requests]({{<relref "/operate/rs/references/rest-api/requests/bootstrap#post-bootstrap">}}):

1. Create the new cluster on the first node, set `rack_aware` to `true`, and assign a `rack_id` and `second_rack_id` to the first node:

    ```sh
    POST /v1/bootstrap/create_cluster
    {
      "action": "create_cluster",
      "cluster": {
        "nodes": [],
        "name": "<cluster.fqdn>"
      },
      "credentials": {
        "username": "<admin-email>",
        "password": "<admin-password>"
      },
      "node": {
        "identity": {
            "rack_id": "<availability-zone-ID>",
            "second_rack_id": "<rack-ID>"
        }
      },
      "policy": {
        "rack_aware": true
      }
    }
    ```

1. Join each new node you want to add to the cluster and assign a different `rack_id` and `second_rack_id` to it:

    ```sh
    POST /v1/bootstrap/join_cluster
    {
      "action": "join_cluster",
      "cluster": {
         "nodes": [],
         "name": "<cluster.fqdn>"
      },
      "credentials": {
        "username": "<admin-email>",
        "password": "<admin-password>"
      },
      "node": {
        "identity": {
            "rack_id": "<availability-zone-ID>",
            "second_rack_id": "<rack-ID>"
        }
      }
    }
    ```

#### Command-line method

To create a new cluster with two-dimensional rack-zone awareness using the command line:

1. Run [`rladmin cluster create`]({{<relref "/operate/rs/references/cli-utilities/rladmin/cluster/create">}}) to create the initial cluster on one node, enable rack-zone awareness, and assign a `rack_id` and `second_rack_id`:

    ```sh
    $ rladmin cluster create name <cluster-name> \
        username <admin-email> \
        password <admin-password> \
        rack_aware \
        rack_id <node-rack-ID> \
        second_rack_id <second-node rack-ID>
    ```

1. Run [`rladmin cluster join`]({{<relref "/operate/rs/references/cli-utilities/rladmin/cluster/join">}}) for each new node you want to add to the cluster and assign a different `rack_id` and `second_rack_id`:

    ```sh
    $ rladmin cluster join nodes <node-IP-address> \
        username <admin-email> \
        password <admin-password> \
        rack_id <node-rack ID> \
        second_rack_id <second-node-rack-ID>
    ```

### Existing clusters

You can configure two-dimensional rack-zone awareness for existing clusters using the [REST API]({{< relref "/operate/rs/references/rest-api" >}}).

For each node in the cluster, assign a different `second_rack_id` using the REST API to [update the node]({{< relref "/operate/rs/references/rest-api/requests/nodes#put-node" >}}):

```sh
PUT /v1/nodes/<node-ID>
{ "second_rack_id": "rack-ID" }
```

## Enable database rack-zone awareness

Before you can enable rack-zone awareness for a database, you must configure rack-zone awareness for the cluster and its nodes. For more information, see [set up rack-zone awareness](#set-up-rack-zone-awareness).

<!--
To enable rack-zone awareness for a database using the Cluster Manager UI:

1. From **databases**, [create a new database]({{< relref "/operate/rs/databases/create" >}}) or edit an existing database's **configuration**.

1. Expand the **High availability & durability** section.

1. Enable [**Replication**]({{< relref "/operate/rs/databases/durability-ha/replication" >}}).

1. Select **Rack-zone awareness**.

    {{<image filename="images/rs/screenshots/databases/config-rack-zone-awareness.png" alt="Select the Rack-zone awareness checkbox to enable rack-zone awareness for the database." >}}

1. **Create** or **Save** your database.

1. [Rearrange database shards](#rearrange-database-shards) to optimize an existing database for rack-zone awareness.

    {{<note>}}
If you enabled rack-zone awareness during database creation, you can ignore this step.
    {{</note>}}
-->

To enable rack-zone awareness for a database, use a [REST API request]({{< relref "/operate/rs/references/rest-api/requests/bdbs#put-bdbs" >}}):

```sh
PUT /v1/bdbs/<database-ID>
{ "rack_aware": true }
```

### Rearrange database shards

After you enable rack-zone awareness for an existing database, you should generate an optimized shard placement blueprint using the [REST API]({{< relref "/operate/rs/references/rest-api" >}}) and use it to rearrange the shards in different racks or zones.

1. [Generate an optimized shard placement blueprint]({{< relref "/operate/rs/references/rest-api/requests/bdbs/actions/optimize_shards_placement#get-bdbs-actions-optimize-shards-placement" >}}):

    1. Send the following `GET` request:

        ```sh
        GET /v1/bdbs/<database-ID>/actions/optimize_shards_placement
        ```

    1. Copy the `cluster-state-id` from the response headers.

    1. Copy the JSON response body, which represents the new shard placement blueprint.

1. [Rearrange the database shards]({{< relref "/operate/rs/references/rest-api/requests/bdbs/actions/optimize_shards_placement#put-bdbs-rearrange-shards" >}}) according to the new shard placement blueprint:

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

Even if a database has rack-zone awareness turned off, the cluster still ensures that primary and replica shards are placed on distinct nodes.
