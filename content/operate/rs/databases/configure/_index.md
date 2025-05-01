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
---

You can manage your Redis Enterprise Software databases with several tools:

- [Cluster Manager UI](#edit-database-settings) (the web-based user interface)

- Command-line tools:

    - [`rladmin`]({{< relref "/operate/rs/references/cli-utilities/rladmin" >}}) for standalone database configuration

    - [`crdb-cli`]({{< relref "/operate/rs/references/cli-utilities/crdb-cli" >}}) for Active-Active database configuration

    - [`redis-cli`]({{< relref "/develop/tools/cli" >}}) for Redis Open Source configuration

- [REST API]({{< relref "/operate/rs/references/rest-api/_index.md" >}})

## Edit database settings

You can change the configuration of a Redis Enterprise Software database at any time.<!--more-->

To edit the configuration of a database using the Cluster Manager UI:

1. On the **Databases** screen, select the database you want to edit.

1. From the **Configuration** tab, select **Edit**.

1. Change any [configurable database settings](#config-settings).

    {{< note >}}
For [Active-Active database instances]({{< relref "/operate/rs/databases/active-active" >}}), most database settings only apply to the instance that you are editing.
    {{< /note >}}

1. Select **Save**.

## Configuration settings {#config-settings}

### General

- [**Tags**]({{<relref "/operate/rs/databases/configure/db-tags">}}) - Add custom tags to categorize the database.

- **Database version** - Select the Redis version when you create a database.

- **Database name** - The database name requirements are:

    - Maximum of 63 characters

    - Only letters, numbers, or hyphens (-) are valid characters

    - Must start and end with a letter or digit

    - Case-sensitive

- **Endpoint port number** - You can define the port number that clients use to connect to the database. Otherwise, a port is randomly selected.

    {{< note >}}
You cannot change the [port number]({{< relref "/operate/rs/networking/port-configurations.md" >}})
after the database is created.
    {{< /note >}}

### Capacity

- **Memory limit** - [Database memory limits]({{< relref "/operate/rs/databases/memory-performance/memory-limit.md" >}}) include all database replicas and shards, including replica shards in database replication and database shards in database clustering.

    If the total size of the database in the cluster reaches the memory limit, the memory eviction policy for the database is enforced.

- **RAM limit** - If you create a database with Auto Tiering enabled, you also need to set the RAM-to-Flash ratio. Minimum RAM is 10%. Maximum RAM is 50%.

- [**Memory eviction**]({{<relref "/operate/rs/databases/memory-performance/eviction-policy">}}) - By default, when the total size of the database reaches its memory limit, the database evicts keys according to the least recently used keys out of all keys with an "expire" field set to make room for new keys. You can select a different eviction policy.

### Capabilities

When you create a new in-memory database, you can enable multiple Redis Stack [**Capabilities**]({{<relref "/operate/oss_and_stack/stack-with-enterprise">}}).

For Auto Tiering databases, you can enable capabilities that support Auto Tiering. See [Redis Enterprise and Redis Stack feature compatibility 
]({{< relref "/operate/oss_and_stack/stack-with-enterprise/enterprise-capabilities" >}}) for compatibility details.

{{<note>}}
To use Redis Stack capabilities, enable them when you create a new database.
You cannot enable them after database creation.
{{</note>}}

To add capabilities to the database:

1. In the **Capabilities** section, select one or more capabilities.
    
1. To customize capabilities, click **Parameters** and enter the optional custom configuration.
    
1. Click **Done**.

To change capabilities' parameters for an existing database using the Cluster Manager UI:

  1. In the **Capabilities** section, click **Edit Parameters**.

  1. After you finish editing the module's configuration parameters, click **Done** to close the parameter editor.

### High Availability

- [**Replication**]({{< relref "/operate/rs/databases/durability-ha/replication.md" >}}) - We recommend you use intra-cluster replication to create replica shards for each database for high availability.

    If the cluster is configured to support [rack-zone awareness]({{< relref "/operate/rs/clusters/configure/rack-zone-awareness.md" >}}), you can also enable rack-zone awareness for the database.

- [**Replica high availability**]({{< relref "/operate/rs/databases/configure/replica-ha" >}}) - Automatically migrates replica shards to an available node if a replica node fails or is promoted to primary.

### Clustering

- **Enable sharding** - You can either:

    - Turn on sharding to enable [database clustering]({{< relref "/operate/rs/databases/durability-ha/clustering.md" >}}) and select the number of database shards.

        When database clustering is enabled, databases are subject to limitations on [Multi-key commands]({{< relref "/operate/rs/databases/durability-ha/clustering.md" >}}).
        
        You can increase the number of shards in the database at any time.

    - Turn off sharding to use only one shard so that you can use [Multi-key commands]({{< relref "/operate/rs/databases/durability-ha/clustering.md" >}}) without the limitations.

- [**Shards placement**]({{< relref "/operate/rs/databases/memory-performance/shard-placement-policy" >}}) - Determines how to distribute database shards across nodes in the cluster.

    - _Dense_ places shards on the smallest number of nodes.
    
    - _Sparse_ spreads shards across many nodes.

- [**OSS Cluster API**]({{< relref "/operate/rs/databases/configure/oss-cluster-api.md" >}}) - The OSS Cluster API configuration allows access to multiple endpoints for increased throughput.

    This configuration requires clients to connect to the primary node to retrieve the cluster topology before they can connect directly to proxies on each node.
    
    When you enable the OSS Cluster API, shard placement changes to _Sparse_, and the database proxy policy changes to _All primary shards_ automatically.

    {{<note>}}
You must use a client that supports the cluster API to connect to a database that has the cluster API enabled.
    {{</note>}}

- **Hashing policy** - You can accept the [standard hashing policy]({{<relref "/operate/rs/databases/durability-ha/clustering#standard-hashing-policy">}}), which is compatible with Redis Open Source, or define a [custom hashing policy]({{<relref "/operate/rs/databases/durability-ha/clustering#custom-hashing-policy">}}) to define where keys are located in the clustered database.

- [**Database proxy**]({{< relref "/operate/rs/databases/configure/proxy-policy" >}}) - Determines the number and location of active proxies, which manage incoming database operation requests.

### Durability

- [**Persistence**]({{<relref "/operate/rs/databases/configure/database-persistence">}}) - To protect against loss of data stored in RAM, you can enable data persistence and store a copy of the data on disk with snapshots or an append-only file.

- **Scheduled backup** - You can configure [periodic backups]({{<relref "/operate/rs/databases/import-export/schedule-backups">}}) of the database, including the interval and backup location parameters.

### TLS

You can require [**TLS**]({{< relref "/operate/rs/security/encryption/tls/" >}}) encryption and authentication for all communications, TLS encryption and authentication for Replica Of communication only, and TLS authentication for clients.

### Access control

- **Unauthenticated access** - You can access the database as the default user without providing credentials.

- **Password-only authentication** - When you configure a password for your database's default user, all connections to the database must authenticate with the [AUTH command]({{< relref "/commands/auth" >}}).

    If you also configure an access control list, connections can specify other users for authentication, and requests are allowed according to the Redis ACLs specified for that user.

    Creating a database without ACLs enables a *default* user with full access to the database. You can secure default user access by requiring a password.

- **Access Control List** - You can specify the [user roles]({{< relref "/operate/rs/security/access-control/create-db-roles" >}}) that have access to the database and the [Redis ACLs]({{< relref "/operate/rs/security/access-control/redis-acl-overview" >}}) that apply to those connections.

    To define an access control list for a database:

    1. In **Security > Access Control > Access Control List**, select **+ Add ACL**.

    1. Select a [role]({{< relref "/operate/rs/security/access-control/create-db-roles" >}}) to grant database access.

    1. Associate a [Redis ACL]({{< relref "/operate/rs/security/access-control/create-db-roles" >}}) with the role and database.

    1. Select the check mark to add the ACL.

### Alerts

Select [alerts]({{<relref "/operate/rs/monitoring/v1_monitoring#database-alerts">}}) to show in the database status and configure their thresholds.

You can also choose to [send alerts by email]({{<relref "/operate/rs/monitoring/v1_monitoring#send-alerts-by-email">}}) to relevant users.

### Replica Of

With [**Replica Of**]({{<relref "/operate/rs/databases/import-export/replica-of/create">}}), you can make the database a repository for keys from other databases.

### RESP3 support

[RESP]({{<relref "/develop/reference/protocol-spec">}})  (Redis Serialization Protocol) is the protocol clients use to communicate with Redis databases. If you enable RESP3 support, the database will support the RESP3 protocol in addition to RESP2.

For more information about Redis Software's compatibility with RESP3, see [RESP compatibility with Redis Enterprise]({{<relref "/operate/rs/references/compatibility/resp">}}).

### Internode encryption

Enable **Internode encryption** to encrypt data in transit between nodes for this database. See [Internode encryption]({{< relref "/operate/rs/security/encryption/internode-encryption" >}}) for more information.

