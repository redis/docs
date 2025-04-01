---
Title: Create an Active-Active geo-replicated database
alwaysopen: false
categories:
- docs
- operate
- rs
description: How to create an Active-Active database and things to consider when setting
  it up.
linkTitle: Create
weight: 25
url: '/operate/rs/7.8/databases/active-active/create/'
---
[Active-Active geo-replicated databases]({{< relref "/operate/rs/databases/active-active" >}}) (formerly known as CRDBs) give applications write access
to replicas of the dataset in different geographical locations.

The participating Redis Enterprise Software clusters that host the instances can be distributed in different geographic locations.
Every instance of an Active-Active database can receive write operations, and all operations are [synchronized]({{< relref "/operate/rs/databases/active-active/develop#example-of-synchronization" >}}) to all instances without conflict.

## Steps to create an Active-Active database

1. **Create a service account** - On each participating cluster, create a dedicated user account with the Admin role.
1. **Confirm connectivity** - Confirm network connectivity between the participating clusters.
1. **Create Active-Active database** - Connect to one of your clusters and create a new Active-Active database.
1. **Add participating clusters** - Add the participating clusters to the Active-Active database with the user credentials for the service account.
1. **Verify creation** - Log in to each of the participating clusters and verify your Active-Active database was created on them.
1. **Confirm Active-Active database synchronization** - Test writing to one cluster and reading from a different cluster.

## Prerequisites

- Two or more machines with the same version of Redis Enterprise Software installed
- Network connectivity and cluster FQDN name resolution between all participating clusters
- [Network time service]({{< relref "/operate/rs/databases/active-active#network-time-service-ntp-or-chrony" >}}) listener (ntpd) configured and running on each node in all clusters

## Create an Active-Active database

1. Create service accounts on each participating cluster:

    1. In a browser, open the Cluster Manager UI for the participating cluster.

        The default address is: `https://<RS_address>:8443`

    1. Go to the **Access Control > Users** tab:

        {{<image filename="images/rs/access-control-user-panel.png" alt="Add role with name" >}}
    
    1. Click **+ Add user**.

    1. Enter the username, email, and password for the user.
    
    1. Select the **Admin** role.
    
    1. Click **Save**.

1. To verify network connectivity between participating clusters,
    run the following `telnet` command from each participating cluster to all other participating clusters:

    ```sh
    telnet <target FQDN> 9443
    ```

1. In a browser, open the Cluster Manager UI of the cluster where you want to create the Active-Active database.

    The default address is: `https://<RS_address>:8443`

1. Open the **Create database** menu with one of the following methods:

    - Click the **+** button next to **Databases** in the navigation menu:

        {{<image filename="images/rs/screenshots/databases/create-db-plus-drop-down.png" width="350px" alt="Create database menu has two options: Single Region and Active-Active database.">}}
        
    - Go to the **Databases** screen and select **Create database**:

        {{<image filename="images/rs/screenshots/databases/create-db-button-drop-down.png" width="350px" alt="Create database menu has two options: Single Region and Active-Active database.">}}

1. Select **Active-Active database**.

1. Enter the cluster's local admin credentials, then click **Save**:

    {{<image filename="images/rs/screenshots/databases/active-active-databases/enter-local-admin-credentials.png" alt="Enter the cluster's admin username and password.">}}
    
1. Add participating clusters that will host instances of the Active-Active database:

    1. In the **Participating clusters** section, go to **Other participating clusters** and click **+ Add cluster**.

    1. In the **Add cluster** configuration panel, enter the new cluster's URL, port number, and the admin username and password for the new participating cluster:

        {{<image filename="images/rs/screenshots/databases/active-active-databases/create-db-add-participating-clusters.png" alt="Add cluster panel.">}}

        {{<note>}}
If an Active-Active database [runs on flash memory]({{<relref "/operate/rs/databases/auto-tiering">}}), you cannot add participating clusters that run on RAM only.
        {{</note>}}

    1. Click **Join cluster** to add the cluster to the list of participating clusters. 

1. Enter a **Database name**.

1. If your cluster supports [Auto Tiering]({{< relref "/operate/rs/databases/auto-tiering/" >}}), in **Runs on** you can select **Flash** so that your database uses Flash memory. We recommend that you use AOF every 1 sec for the best performance during the initial Active-Active database sync of a new replica.

1. To configure additional database settings, expand each relevant section to make changes.

    See [Configuration settings](#configuration-settings) for more information about each setting.

1. Click **Create**.

## Configuration settings

- **Database version** - The Redis version used by your database.

- **Database name** - The database name requirements are:

    - Maximum of 63 characters

    - Only letters, numbers, or hyphens (-) are valid characters

    - Must start and end with a letter or digit

    - Case-sensitive

- **Port** - You can define the port number that clients use to connect to the database. Otherwise, a port is randomly selected.

    {{< note >}}
You cannot change the [port number]({{< relref "/operate/rs/networking/port-configurations.md" >}})
after the database is created.
    {{< /note >}}

- **Memory limit** - [Database memory limits]({{< relref "/operate/rs/databases/memory-performance/memory-limit.md" >}}) include all database replicas and shards, including replica shards in database replication and database shards in database clustering.

    If the total size of the database in the cluster reaches the memory limit, the data eviction policy for the database is enforced.

    {{< note >}}
If you create a database with Auto Tiering enabled, you also need to set the RAM-to-Flash ratio
for this database. Minimum RAM is 10%. Maximum RAM is 50%.
    {{< /note >}}

- **Memory eviction** - The default [eviction policy]({{<relref "/operate/rs/databases/memory-performance/eviction-policy">}}) for Active-Active databases is `noeviction`. Redis Enterprise versions 6.0.20 and later support all eviction policies for Active-Active databases, unless [Auto Tiering]({{<relref "/operate/rs/databases/auto-tiering">}}) is enabled.

- [**Capabilities**]({{< relref "/operate/oss_and_stack/stack-with-enterprise" >}}) (previously **Modules**) - When you create a new in-memory database, you can enable multiple Redis Stack capabilities in the database. For Auto Tiering databases, you can enable capabilities that support Auto Tiering. See [Redis Enterprise and Redis Stack feature compatibility 
]({{< relref "/operate/oss_and_stack/stack-with-enterprise/enterprise-capabilities" >}}) for compatibility details.
        
    {{<note>}}
To use Redis Stack capabilities, enable them when you create a new database.
You cannot enable them after database creation.
    {{</note>}} 
        
    To add capabilities to the database:

    1. In the **Capabilities** section, select one or more capabilities.
    
    1. To customize capabilities, select **Parameters** and enter the optional custom configuration.
    
    1. Select **Done**.

### TLS

If you enable TLS when you create the Active-Active database, the nodes use the TLS mode **Require TLS for CRDB communication only** to require TLS authentication and encryption for communications between participating clusters.
        
After you create the Active-Active database, you can set the TLS mode to **Require TLS for all communications** so client communication from applications are also authenticated and encryption.

### High availability

- [**Replication**]({{< relref "/operate/rs/databases/durability-ha/replication" >}}) - We recommend that all Active-Active database use replication for best intercluster synchronization performance.
    
    When replication is enabled, every Active-Active database master shard is replicated to a corresponding replica shard. The replica shards are then used to synchronize data between the instances, and the master shards are dedicated to handling client requests.
    
- [**Replica high availability**]({{< relref "/operate/rs/databases/configure/replica-ha" >}}) - We also recommend that you enable replica high availability to ensure replica shards are highly-available for this synchronization.

### Clustering

- In the [**Clustering**]({{<relref "/operate/rs/databases/durability-ha/clustering">}}) section, you can either:

    - **Enable sharding** and select the number of shards you want to have in the database. When database clustering is enabled, databases have limitations for [multi-key operations]({{<relref "/operate/rs/databases/durability-ha/clustering#multikey-operations">}}).
    
        You can increase the number of shards in the database at any time.
        
    - Clear the **Enable sharding** option to use only one shard, which allows you to use [multi-key operations]({{<relref "/operate/rs/databases/durability-ha/clustering#multikey-operations">}}) without the limitations.

    {{<note>}}
You cannot enable or turn off database clustering after the Active-Active database is created.
    {{</note>}}

- [**OSS Cluster API**]({{< relref "/operate/rs/databases/configure/oss-cluster-api.md" >}}) - The OSS Cluster API configuration allows access to multiple endpoints for increased throughput. The OSS Cluster API setting applies to all instances of the Active-Active database across participating clusters.

    This configuration requires clients to connect to the primary node to retrieve the cluster topology before they can connect directly to proxies on each node.
    
    When you enable the OSS Cluster API, shard placement changes to _Sparse_, and the database proxy policy changes to _All primary shards_ automatically.

### Durability

To protect against loss of data stored in RAM, you can enable [**Persistence**]({{<relref "/operate/rs/databases/configure/database-persistence">}}) to store a copy of the data on disk.
        
Active-Active databases support append-only file (AOF) persistence only. Snapshot persistence is not supported for Active-Active databases.

### Access control

- **Unauthenticated access** - You can access the database as the default user without providing credentials.

- **Password-only authentication** - When you configure a password for your database's default user, all connections to the database must authenticate with the [AUTH command]({{< relref "/commands/auth" >}}.

    If you also configure an access control list, connections can specify other users for authentication, and requests are allowed according to the Redis ACLs specified for that user.

    Creating a database without ACLs enables a *default* user with full access to the database. You can secure default user access by requiring a password.

- **Access Control List** - You can specify the [user roles]({{< relref "/operate/rs/security/access-control/create-db-roles" >}}) that have access to the database and the [Redis ACLs]({{< relref "/operate/rs/security/access-control/redis-acl-overview" >}}) that apply to those connections.

    You can only configure access control after the Active-Active database is created. In each participating cluster, add ACLs after database creation.

    To define an access control list for a database:

    1. In **Security > Access Control > Access Control List**, select **+ Add ACL**.

    1. Select a [role]({{< relref "/operate/rs/security/access-control/create-db-roles" >}}) to grant database access.

    1. Associate a [Redis ACL]({{< relref "/operate/rs/security/access-control/create-db-roles" >}}) with the role and database.

    1. Select the check mark to add the ACL.

### Causal consistency

[**Causal consistency**]({{< relref "/operate/rs/databases/active-active/causal-consistency" >}}) in an Active-Active database guarantees that the order of operations on a specific key is maintained across all instances of an Active-Active database.
    
To enable causal consistency for an existing Active-Active database, use the REST API.

<!-- Also in getting-started-crdbs.md -->
## Test Active-Active database connections

With the Redis database created, you are ready to connect to your database. See [Connect to Active-Active databases]({{< relref "/operate/rs/databases/active-active/connect.md" >}}) for tutorials and examples of multiple connection methods.
