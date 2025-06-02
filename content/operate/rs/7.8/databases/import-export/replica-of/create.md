---
Title: Create a database with Replica Of
alwaysopen: false
categories:
- docs
- operate
- rs
description: Create Replica Of database
linkTitle: Create Replica Of database
weight: 10
url: '/operate/rs/7.8/databases/import-export/replica-of/create/'
---
Replica databases copy data from source databases (previously known as _master_), which enable read-only connections from apps and clients located in different geographic locations.

To create a replica connection, you define a database as a replica of a source database.  Replica Of databases (also known as _Active-Passive databases_) synchronize in the background.

Sources databases can be:

- Located in the same Redis Enterprise Software cluster
- Located in a different Redis Enterprise cluster
- Hosted by a different deployment, e.g. Redis Cloud
- Redis Open Source databases

Your apps can connect to the source database to read and write data; they can also use any replica for read-only access.

Replica Of can model a variety of data relationships, including:

- One-to-many relationships, where multiple replicas copy a single source database.
- Many-to-one relationships, where a single replica collects data from multiple source databases.

When you change the replica status of a database by adding, removing, or changing sources, the replica database is synchronized to the new sources.  

## Configure Replica Of

You can configure a database as a Replica Of, where the source database is in one of the following clusters:

- [Same Redis Enterprise cluster](#same-cluster)

- [Different Redis Enterprise cluster](#different-cluster)

- [Redis Open Source cluster](#source-available-cluster)

The order of the multiple Replica Of sources has no material impact on replication.

For best results when using the [Multicast DNS](https://en.wikipedia.org/wiki/Multicast_DNS) (mDNS) protocol to resolve the fully-qualified domain name (FQDN) of the cluster, verify that your client connections meet the [client mDNS prerequisites]({{< relref "/operate/rs/7.8/networking/mdns.md" >}}).

{{< note >}}
As long as Replica Of is enabled, data in the target database will not expire and will not be evicted regardless of the set [data eviction policy]({{< relref "/operate/rs/7.8/databases/memory-performance/eviction-policy.md" >}}).
{{< /note >}}

### Same Redis Enterprise cluster {#same-cluster}

To configure a Replica Of database in the same Redis Enterprise cluster as the source database:

1. [Create a new database]({{< relref "/operate/rs/7.8/databases/create" >}}) or select an existing database from the **Databases** screen.

1. For an existing database, select **Edit** from the **Configuration** tab.

1. Expand the **Replica Of** section.

1. Select **+ Add source database**.

1. In the **Connect a Replica Of source database** dialog, select **Current cluster**.

1. Select the source database from the list.

1. Select **Add source**.

1. Select **Save**.

### Different Redis Enterprise cluster {#different-cluster}

To configure a Replica Of database in a different Redis Enterprise cluster from the source database:

1. Ensure the source database's port is allowed through firewalls between the clusters and can be accessed by the destination cluster's nodes.

    {{<note>}}
Ports 10000-19999 are reserved for database traffic. See [Network port configurations]({{<relref "/operate/rs/networking/port-configurations">}}) for more information about ports.
    {{</note>}}

1. Sign in to the Cluster Manager UI of the cluster hosting the source database.

    1. In **Databases**, select the source database and then select the **Configuration** tab.

    1. In the **Replica Of** section, select **Use this database as a source for another database**.

    1. Copy the Replica Of source URL.

        {{<image filename="images/rs/screenshots/databases/config-replica-of-copy-source-url.png" alt="Copy the Replica Of source URL from the Connection link to destination dialog.">}}

        To change the internal password, select **Regenerate password**.

        If you regenerate the password, replication to existing destinations fails until their credentials are updated with the new password.

1. Sign in to the Cluster Manager UI of the destination database's cluster.

1. [Create a new database]({{< relref "/operate/rs/7.8/databases/create" >}}) or select an existing database from the **Databases** screen.

1. For an existing database, select **Edit** from the **Configuration** tab.

1. Expand the **Replica Of** section.

1. Select **+ Add source database**.

1. In the **Connect a Replica Of source database** dialog, select **External**.

1. Enter the URL of the source database endpoint.

1. Select **Add source**.

1. Select **Save**.

For source databases on different clusters, you can [compress replication data]({{< relref "/operate/rs/7.8/databases/import-export/replica-of/#data-compression-for-replica-of" >}}) to save bandwidth.
        
### Redis Open Source cluster {#source-available-cluster}

To use a database from a Redis Open Source cluster as a Replica Of source:

1. [Create a new database]({{< relref "/operate/rs/7.8/databases/create" >}}) or select an existing database from the **Databases** screen.

1. For an existing database, select **Edit** from the **Configuration** tab.

1. Expand the **Replica Of** section.

1. Select **+ Add source database**.

1. In the **Connect a Replica Of source database** dialog, select **External**.

1. Enter the URL of the source endpoint in one of the following formats:

    - For databases with passwords:

        ```sh
        redis://:<password>@<host>:<port>
        ```

        Where the password is the Redis password represented with URL encoding escape characters.

    - For databases without passwords:

        ```sh
        redis://<host>:<port>
        ```

1. Select **Add source**.

1. Select **Save**.

## Configure TLS for Replica Of

When you enable TLS for Replica Of, the Replica Of synchronization traffic uses TLS certificates to authenticate the communication between the source and destination clusters.

To encrypt Replica Of synchronization traffic, configure encryption for the [source database](#encrypt-source-database-traffic) and the destination [replica database](#encrypt-replica-database-traffic).

### Encrypt source database traffic

{{<embed-md "replica-of-tls-config.md">}}

### Encrypt replica database traffic

To enable TLS for Replica Of in the destination database:

1. From the Cluster Manager UI of the cluster hosting the source database:

    1. Go to **Cluster > Security > Certificates**.

    1. Expand the **Server authentication (Proxy certificate)** section.

        {{<image filename="images/rs/screenshots/cluster/security-proxy-cert.png" alt="Proxy certificate for server authentication.">}}

     1. Download or copy the proxy certificate.

1. From the **Configuration** tab of the Replica Of destination database, select **Edit**.

1. Expand the **Replica Of** section.

1. Point to the source database entry and select {{< image filename="/images/rs/buttons/edit-button.png#no-click" alt="The Edit button" width="25px" class="inline" >}} to edit it.

1. Paste or upload the source proxy certificate, then select **Done**.

1. Select **Save**.
