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
---

Database defaults are cluster-wide policies that determine default settings when creating new databases.

## Edit database defaults

To edit default database configuration using the Cluster Manager UI:

1. On the **Databases** screen, select {{< image filename="/images/rs/buttons/button-toggle-actions-vertical.png#no-click" alt="Toggle actions button" width="22px" >}} to open a list of additional actions.

1. Select **Database defaults**.

1. Configure [database defaults](#db-defaults).

1. Select **Save**.

## Database defaults {#db-defaults}

### Replica high availability

If [replica high availability]({{< relref "/operate/rs/databases/configure/replica-ha" >}}) is enabled, the cluster automatically migrates replica shards to an available node if a replica node fails or is promoted after a primary (master) node fails.

To enable or turn off replica high availability by default, use one of the following methods:

- Cluster Manager UI – Edit **Replica High Availability** in [**Database defaults**](#edit-database-defaults)

- [rladmin tune cluster]({{< relref "/operate/rs/references/cli-utilities/rladmin/tune#tune-cluster" >}}): 
    
    ```sh
    rladmin tune cluster slave_ha { enabled | disabled }
    ```

- [Update cluster policy]({{< relref "/operate/rs/references/rest-api/requests/cluster/policy#put-cluster-policy" >}}) REST API request:

    ```sh
    PUT /v1/cluster/policy 
    { "slave_ha": <boolean> }
    ```

### Database version

When you upgrade an existing database or create a new one, it uses the default Redis version (**Database version**) unless you specify the database version explicitly with `redis_version` in the [REST API]({{< relref "/operate/rs/references/rest-api/requests/bdbs" >}}) or [`rladmin upgrade db`]({{< relref "/operate/rs/references/cli-utilities/rladmin/upgrade#upgrade-db" >}}).

To configure the Redis database version, use one of the following methods:

- Cluster Manager UI – Edit **Database version** in [**Database defaults**](#edit-database-defaults)


- [rladmin tune cluster]({{< relref "/operate/rs/references/cli-utilities/rladmin/tune#tune-cluster" >}}): 
    
    ```sh
    rladmin tune cluster default_redis_version <x.y>
    ```

- [Update cluster policy]({{< relref "/operate/rs/references/rest-api/requests/cluster/policy#put-cluster-policy" >}}) REST API request:

    ```sh
    PUT /v1/cluster/policy 
    { "default_provisioned_redis_version": "x.y" }
    ```

### S3 URL

The S3 URL is the default S3 host for [importing and exporting data]({{< relref "/operate/rs/databases/import-export" >}}).

To configure the default S3 URL, use one of the following methods:

- Cluster Manager UI – Edit **S3 URL** in [**Database defaults**](#edit-database-defaults)

- [rladmin cluster config]({{< relref "/operate/rs/references/cli-utilities/rladmin/cluster/config" >}}): 
    
    ```sh
    rladmin cluster config s3_url <URL>
    ```

- [Update cluster settings]({{< relref "/operate/rs/references/rest-api/requests/cluster#put-cluster" >}}) REST API request:

    ```sh
    PUT /v1/cluster
    { "s3_url": "<URL>" }
    ```

### Internode encryption

Enable [internode encryption]({{< relref "/operate/rs/security/encryption/internode-encryption" >}}) to encrypt data in transit between nodes for new databases by default.

To enable or turn off internode encryption by default, use one of the following methods:

- Cluster Manager UI – Edit **Internode Encryption** in [**Database defaults**](#edit-database-defaults)

- [rladmin tune cluster]({{< relref "/operate/rs/references/cli-utilities/rladmin/tune#tune-cluster" >}}): 
    
    ```sh
    rladmin tune cluster data_internode_encryption { enabled | disabled }
    ```

- [Update cluster policy]({{< relref "/operate/rs/references/rest-api/requests/cluster/policy#put-cluster-policy" >}}) REST API request:

    ```sh
    PUT /v1/cluster/policy 
    { "data_internode_encryption": <boolean> }
    ```

### Shard placement

The default [shard placement policy]({{< relref "/operate/rs/databases/memory-performance/shard-placement-policy" >}}) determines the distribution of database shards across nodes in the cluster.

To configure default shard placement, use one of the following methods:

- [rladmin tune cluster]({{< relref "/operate/rs/references/cli-utilities/rladmin/tune#tune-cluster" >}}): 
    
    ```sh
    rladmin tune cluster default_shards_placement { dense | sparse }
    ```

- [Update cluster policy]({{< relref "/operate/rs/references/rest-api/requests/cluster/policy#put-cluster-policy" >}}) REST API request:

    ```sh
    PUT /v1/cluster/policy 
    { "default_shards_placement": "dense | sparse" }
    ```

### Proxy policies

Redis Enterprise Software uses [proxies]({{< relref "/operate/rs/references/terminology#proxy" >}}) to manage and optimize access to database shards. Each node in the cluster runs a single proxy process, which can be active (receives incoming traffic) or passive (waits for failovers).

Configure the following default [proxy policies]({{< relref "/operate/rs/databases/configure/proxy-policy" >}}) to determine which nodes' proxies are active and bound to new databases by default.

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
