---
alwaysopen: false
categories:
- docs
- operate
- rs
description: Configure settings specific to each database.
hideListLinks: true
linktitle: Configure
title: Configure database settings
toc: 'true'
weight: 20
url: '/operate/rs/7.4/databases/configure/'
---

You can manage your Redis Enterprise Software databases with several tools:

- [Cluster Manager UI](#edit-database-settings) (the web-based user interface)

- Command-line tools:

    - [`rladmin`](/content/operate/rs/7.4/references/cli-utilities/rladmin/_index.md) for standalone database configuration

    - [`crdb-cli`](/content/operate/rs/7.4/references/cli-utilities/crdb-cli/_index.md) for Active-Active database configuration

    - [`redis-cli`](/content/develop/tools/cli.md) for Redis Open Source configuration

- [REST API](/content/operate/rs/7.4/references/rest-api/_index.md)

## Edit database settings

You can change the configuration of a Redis Enterprise Software database at any time.<!--more-->

To edit the configuration of a database using the Cluster Manager UI:

1. On the **Databases** screen, select the database you want to edit.

1. From the **Configuration** tab, select **Edit**.

1. Change any [configurable database settings](#config-settings).

    > [!NOTE]
    > For [Active-Active database instances](/content/operate/rs/7.4/databases/active-active/_index.md), most database settings only apply to the instance that you are editing.
    >

1. Select **Save**.

## Configuration settings {#config-settings}

- **Database version** - Select the Redis version when you create a database.

- **Name** - The database name requirements are:

    - Maximum of 63 characters

    - Only letters, numbers, or hyphens (-) are valid characters

    - Must start and end with a letter or digit

    - Case-sensitive

- **Endpoint port number** - You can define the port number that clients use to connect to the database. Otherwise, a port is randomly selected.

    > [!NOTE]
    > You cannot change the [port number](/content/operate/rs/7.4/networking/port-configurations.md)
    > after the database is created.
    >

- **Memory limit** - [Database memory limits](/content/operate/rs/7.4/databases/memory-performance/memory-limit.md) include all database replicas and shards, including replica shards in database replication and database shards in database clustering.

    If the total size of the database in the cluster reaches the memory limit, the data eviction policy for the database is enforced.

    > [!NOTE]
    > If you create a database with Auto Tiering enabled, you also need to set the RAM-to-Flash ratio
    > for this database. Minimum RAM is 10%. Maximum RAM is 50%.
    >

- [**Capabilities**](/content/operate/oss_and_stack/stack-with-enterprise/_index.md) (previously **Modules**) - When you create a new in-memory database, you can enable multiple Redis Stack capabilities in the database. For Auto Tiering databases, you can enable capabilities that support Auto Tiering. See [Redis Enterprise and Redis Stack feature compatibility 
](/content/operate/oss_and_stack/stack-with-enterprise/enterprise-capabilities.md) for compatibility details.
        
    > [!NOTE]
    > To use Redis Stack capabilities, enable them when you create a new database.
    > You cannot enable them after database creation.
    >
        
    To add capabilities to the database:

    1. In the **Capabilities** section, select one or more capabilities.
    
    1. To customize capabilities, select **Parameters** and enter the optional custom configuration.
    
    1. Select **Done**.

### High availability & durability

- [**Replication**](/content/operate/rs/7.4/databases/durability-ha/replication.md) - We recommend you use intra-cluster replication to create replica shards for each database for high availability.

    If the cluster is configured to support [rack-zone awareness](/content/operate/rs/7.4/clusters/configure/rack-zone-awareness.md), you can also enable rack-zone awareness for the database.

- [**Replica high availability**](/content/operate/rs/7.4/databases/configure/replica-ha.md) - Automatically migrates replica shards to an available node if a replica node fails or is promoted to primary.

- [**Persistence**](/content/operate/rs/7.4/databases/configure/database-persistence.md) - To protect against loss of data stored in RAM, you can enable data persistence and store a copy of the data on disk with snapshots or an Append Only File.

- [**Data eviction policy**](/content/operate/rs/7.4/databases/memory-performance/eviction-policy.md) - By default, when the total size of the database reaches its memory limit the database evicts keys according to the least recently used keys out of all keys with an "expire" field set in order to make room for new keys. You can select a different data eviction policy.

### Clustering

- **Sharding** - You can either:
    - Turn on **Sharding** to enable [database clustering](/content/operate/rs/7.4/databases/durability-ha/clustering.md) and select the number of database shards.

        When database clustering is enabled, databases are subject to limitations on [Multi-key commands](/content/operate/rs/7.4/databases/durability-ha/clustering.md).
        
        You can increase the number of shards in the database at any time.

        You can accept the [standard hashing policy](/content/operate/rs/7.4/databases/durability-ha/clustering.md#standard-hashing-policy), which is compatible with Redis Open Source, or define a [custom hashing policy](/content/operate/rs/7.4/databases/durability-ha/clustering.md#custom-hashing-policy) to define where keys are located in the clustered database.

    - Turn off **Sharding** to use only one shard so that you can use [Multi-key commands](/content/operate/rs/7.4/databases/durability-ha/clustering.md) without the limitations.

- [**OSS Cluster API**](/content/operate/rs/7.4/databases/configure/oss-cluster-api.md) - The OSS Cluster API configuration allows access to multiple endpoints for increased throughput.

    This configuration requires clients to connect to the primary node to retrieve the cluster topology before they can connect directly to proxies on each node.
    
    When you enable the OSS Cluster API, shard placement changes to _Sparse_, and the database proxy policy changes to _All primary shards_ automatically.

    > [!NOTE]
    > You must use a client that supports the cluster API to connect to a database that has the cluster API enabled.
    >

- [**Shards placement**](/content/operate/rs/7.4/databases/memory-performance/shard-placement-policy.md) - Determines how to distribute database shards across nodes in the cluster.

    - _Dense_ places shards on the smallest number of nodes.
    
    - _Sparse_ spreads shards across many nodes.

- [**Database proxy**](/content/operate/rs/7.4/databases/configure/proxy-policy.md) - Determines the number and location of active proxies, which manage incoming database operation requests.

### Replica Of

With [**Replica Of**](/content/operate/rs/7.4/databases/import-export/replica-of/create.md), you can make the database a repository for keys from other databases.

### Scheduled backup

You can configure [periodic backups](/content/operate/rs/7.4/databases/import-export/schedule-backups.md) of the database, including the interval and backup location parameters.

### Alerts

Select [alerts](/content/operate/rs/7.4/clusters/monitoring/_index.md#database-alerts) to show in the database status and configure their thresholds.

You can also choose to [send alerts by email](/content/operate/rs/7.4/clusters/monitoring/_index.md#send-alerts-by-email) to relevant users.

### TLS

You can require [**TLS**](/content/operate/rs/7.4/security/encryption/tls/_index.md) encryption and authentication for all communications, TLS encryption and authentication for Replica Of communication only, and TLS authentication for clients.

### Access control

- **Unauthenticated access** - You can access the database as the default user without providing credentials.

- **Password-only authentication** - When you configure a password for your database's default user, all connections to the database must authenticate with the [AUTH command](/content/commands/auth.md).

    If you also configure an access control list, connections can specify other users for authentication, and requests are allowed according to the Redis ACLs specified for that user.

    Creating a database without ACLs enables a *default* user with full access to the database. You can secure default user access by requiring a password.

- **Access Control List** - You can specify the [user roles](/content/operate/rs/7.4/security/access-control/create-db-roles.md) that have access to the database and the [Redis ACLs](/content/operate/rs/7.4/security/access-control/redis-acl-overview.md) that apply to those connections.

    To define an access control list for a database:

    1. In **Security > Access Control > Access Control List**, select **+ Add ACL**.

    1. Select a [role](/content/operate/rs/7.4/security/access-control/create-db-roles.md) to grant database access.

    1. Associate a [Redis ACL](/content/operate/rs/7.4/security/access-control/create-db-roles.md) with the role and database.

    1. Select the check mark to add the ACL.

### Internode encryption

Enable **Internode encryption** to encrypt data in transit between nodes for this database. See [Internode encryption](/content/operate/rs/7.4/security/encryption/internode-encryption.md) for more information.

