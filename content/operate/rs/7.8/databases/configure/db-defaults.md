---
Title: Configure database defaults
alwaysopen: false
categories:
- docs
- operate
- rs
description: Cluster-wide policies that determine default settings when creating new
  databases.
linkTitle: Database defaults
toc: 'true'
weight: 10
url: '/operate/rs/7.8/databases/configure/db-defaults/'
---

Database defaults are cluster-wide policies that determine default settings when creating new databases.

## Edit database defaults

To edit default database configuration using the Cluster Manager UI:

1. On the **Databases** screen, select {{< image filename="/images/rs/buttons/button-toggle-actions-vertical.png#no-click" alt="Toggle actions button" width="22px" class="inline" >}} to open a list of additional actions.

1. Select **Database defaults**.

1. Configure [database defaults](#db-defaults).

    {{<image filename="images/rs/screenshots/databases/db-defaults.png" alt="Database defaults configuration panel.">}}

1. Select **Save**.

## Database defaults {#db-defaults}

### Endpoint configuration

You can choose a predefined endpoint configuration to use the recommended database proxy and shards placement policies for your use case. If you want to set these policies manually instead, select **Custom** endpoint configuration.

| Endpoint configuration | Database proxy | Shards placement | Description |
|-----------|------------|----------------|------------------|------------|
| Enterprise clustering | Single | Dense | Sets up a single endpoint that uses DNS to automatically reflect IP address updates after failover or topology changes. |
| Using a load balancer | All nodes | Sparse | Configure Redis with a load balancer like HAProxy or Nginx for environments without DNS. |
| Multiple endpoints | All primary shards | Sparse | To set up multiple endpoints, enable **OSS Cluster API** in the database settings and ensure client support. Clients initially connect to the primary node to retrieve the cluster topology, which allows direct connections to individual Redis proxies on each node. |
| Custom | Single, all primary shards, or all nodes | Dense or sparse | Manually choose default database proxy and shards placement policies. |

### Database proxy

Redis Enterprise Software uses [proxies]({{< relref "/operate/rs/references/terminology#proxy" >}}) to manage and optimize access to database shards. Each node in the cluster runs a single proxy process, which can be active (receives incoming traffic) or passive (waits for failovers).

You can configure default [proxy policies]({{< relref "/operate/rs/databases/configure/proxy-policy" >}}) to determine which nodes' proxies are active and bound to new databases by default.

To configure the default database proxy policy using the Cluster Manager UI:

1. [**Edit database defaults**](#edit-database-defaults). 

1. Select a predefined [**Endpoint Configuration**](#endpoint-configuration) to use a recommended database proxy policy, or choose **Custom** to set the policy manually. Changing the database proxy default in the Cluster Manager UI affects both sharded and non-sharded proxy policies.

    {{<image filename="images/rs/screenshots/databases/db-defaults-endpoint-config-custom.png" alt="The Database defaults panel lets you select Database proxy and Shards placement if Endpoint Configuration is set to Custom.">}}

#### Non-sharded proxy policy

To configure the default proxy policy for non-sharded databases, use one of the following methods:

- [rladmin tune cluster]({{< relref "/operate/rs/references/cli-utilities/rladmin/tune#tune-cluster" >}}): 
    
    ```sh
    rladmin tune cluster default_non_sharded_proxy_policy { single | all-master-shards | all-nodes }
    ```

- [Update cluster policy]({{< relref "/operate/rs/references/rest-api/requests/cluster/policy#put-cluster-policy" >}}) REST API request:

    ```sh
    PUT /v1/cluster/policy 
    { "default_non_sharded_proxy_policy": "single | all-master-shards | all-nodes" }
    ```

#### Sharded proxy policy

To configure the default proxy policy for sharded databases, use one of the following methods:

- [rladmin tune cluster]({{< relref "/operate/rs/references/cli-utilities/rladmin/tune#tune-cluster" >}}): 
    
    ```sh
    rladmin tune cluster default_sharded_proxy_policy { single | all-master-shards | all-nodes }
    ```

- [Update cluster policy]({{< relref "/operate/rs/references/rest-api/requests/cluster/policy#put-cluster-policy" >}}) REST API request:

    ```sh
    PUT /v1/cluster/policy 
    { "default_sharded_proxy_policy": "single | all-master-shards | all-nodes" }
    ```

### Shards placement

The default [shard placement policy]({{< relref "/operate/rs/databases/memory-performance/shard-placement-policy" >}}) determines the distribution of database shards across nodes in the cluster.

Shard placement policies include:

- `dense`: places shards on the smallest number of nodes.

- `sparse`: spreads shards across many nodes.

To configure default shard placement, use one of the following methods:

- Cluster Manager UI:

    1. [**Edit database defaults**](#edit-database-defaults). 

    1. Select a predefined [**Endpoint Configuration**](#endpoint-configuration) to use a recommended shards placement policy, or choose **Custom** to set the policy manually.

        {{<image filename="images/rs/screenshots/databases/db-defaults-endpoint-config-custom.png" alt="The Database defaults panel lets you select Database proxy and Shards placement if Endpoint Configuration is set to Custom.">}}

- [rladmin tune cluster]({{< relref "/operate/rs/references/cli-utilities/rladmin/tune#tune-cluster" >}}): 
    
    ```sh
    rladmin tune cluster default_shards_placement { dense | sparse }
    ```

- [Update cluster policy]({{< relref "/operate/rs/references/rest-api/requests/cluster/policy#put-cluster-policy" >}}) REST API request:

    ```sh
    PUT /v1/cluster/policy 
    { "default_shards_placement": "dense | sparse" }
    ```

### Database version

New databases use the default Redis database version unless you select a different **Database version** when you [create a database]({{<relref "/operate/rs/databases/create">}}) in the Cluster Manager UI or specify the `redis_version` in a [create database REST API request]({{< relref "/operate/rs/references/rest-api/requests/bdbs" >}}).

To configure the Redis database version, use one of the following methods:

- Cluster Manager UI: Edit **Database version** in [**Database defaults**](#edit-database-defaults)


- [rladmin tune cluster]({{< relref "/operate/rs/references/cli-utilities/rladmin/tune#tune-cluster" >}}): 
    
    ```sh
    rladmin tune cluster default_redis_version <x.y>
    ```

- [Update cluster policy]({{< relref "/operate/rs/references/rest-api/requests/cluster/policy#put-cluster-policy" >}}) REST API request:

    ```sh
    PUT /v1/cluster/policy 
    { "default_provisioned_redis_version": "x.y" }
    ```

### Internode encryption

Enable [internode encryption]({{< relref "/operate/rs/security/encryption/internode-encryption" >}}) to encrypt data in transit between nodes for new databases by default.

To enable or turn off internode encryption by default, use one of the following methods:

- Cluster Manager UI: Edit **Internode Encryption** in [**Database defaults**](#edit-database-defaults)

- [rladmin tune cluster]({{< relref "/operate/rs/references/cli-utilities/rladmin/tune#tune-cluster" >}}): 
    
    ```sh
    rladmin tune cluster data_internode_encryption { enabled | disabled }
    ```

- [Update cluster policy]({{< relref "/operate/rs/references/rest-api/requests/cluster/policy#put-cluster-policy" >}}) REST API request:

    ```sh
    PUT /v1/cluster/policy 
    { "data_internode_encryption": <boolean> }
    ```
