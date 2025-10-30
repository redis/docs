---
Title: Migrate a database to Active-Active
alwaysopen: false
categories:
- docs
- operate
- rs
description: Use Replica Of to migrate your database to an Active-Active database.
linktitle: Migrate to Active-Active
weight: $weight
---

If you have data in a single-region Redis Enterprise Software database that you want to migrate to an [Active-Active database]({{< relref "/operate/rs/databases/active-active" >}}),
you'll need to create a new Active-Active database and migrate the data into the new database as a [Replica Of]({{< relref "/operate/rs/databases/import-export/replica-of/" >}}) the existing database.
This process will gradually populate the data in the Active-Active database.

Before data migration starts, all data is flushed from the Active-Active database.
The data is migrated to the Active-Active instance where you configured migration, and the data from that instance is copied to the other Active-Active instances.

When data migration is finished, turn off migration and connect your applications to the Active-Active database.

{{<image filename="images/rs/A-A_migration.png" width="75%" alt="Active-Active data migration process" >}}

## Prerequisites

- During the migration, any applications that connect to the Active-Active database must be **read-only** to ensure the dataset is identical to the source database during the migration process. However, you can continue to write to the source database during the migration process.

- If you used the mDNS protocol for the cluster name (FQDN),
the [client mDNS prerequisites]({{< relref "/operate/rs/networking/mdns" >}}) must be met in order to communicate with other clusters.

## Migrate from a Redis Enterprise cluster

You can migrate a Redis Enterprise database from the [same cluster](#migrate-from-the-same-cluster) or a [different cluster](#migrate-from-a-different-cluster).

### Migrate from the same cluster

To migrate a database to Active-Active in the same Redis Enterprise cluster:

1. Create a new Active-Active database. For prerequisites and detailed instructions, see [Create an Active-Active geo-replicated database]({{< relref "/operate/rs/databases/active-active/create" >}}).

1. After the Active-Active database is active, click **Edit** on the **Configuration** screen.

1. Expand the **Migrate to Active-Active** section:

    {{<image filename="images/rs/screenshots/databases/migrate-to-active-active/migrate-to-active-active-section.png" alt="Migrate to Active-Active section.">}}

1. Click **+ Add source database**.

1. In the **Migrate to Active-Active** dialog, select **Current cluster**:

    {{<image filename="images/rs/screenshots/databases/migrate-to-active-active/migrate-to-active-active-dialog-current-cluster.png" alt="Migrate to Active-Active dialog with Current cluster tab selected.">}}

1. Select the source database from the list.

1. Click **Add source**.

1. Click **Save**.

### Migrate from a different cluster

{{< note >}}
For a source database on a different Redis Enterprise Software cluster,
you can [compress the replication data]({{< relref "/operate/rs/databases/import-export/replica-of#data-compression-for-replica-of" >}}) to save bandwidth.
{{< /note >}}

To migrate a database to Active-Active in different Redis Enterprise clusters:

1. Sign in to the Cluster Manager UI of the cluster hosting the source database.

    1. In **Databases**, select the source database and then select the **Configuration** tab.

    1. In the **Replica Of** section, select **Use this database as a source for another database**.

    1. Copy the Replica Of source URL.

        {{<image filename="images/rs/screenshots/databases/config-replica-of-copy-source-url.png" alt="Copy the Replica Of source URL from the Connection link to destination dialog.">}}

        To change the internal password, select **Regenerate password**.

        If you regenerate the password, replication to existing destinations fails until their credentials are updated with the new password.

1. Sign in to the Cluster Manager UI of the destination database’s cluster.

1. Create a new Active-Active database. For prerequisites and detailed instructions, see [Create an Active-Active geo-replicated database]({{< relref "/operate/rs/databases/active-active/create" >}}).

1. After the Active-Active database is active, click **Edit** on the **Configuration** screen.

1. Expand the **Migrate to Active-Active** section:

    {{<image filename="images/rs/screenshots/databases/migrate-to-active-active/migrate-to-active-active-section.png" alt="Migrate to Active-Active section.">}}

1. Click **+ Add source database**.

1. In the **Migrate to Active-Active** dialog, select **External**:

    {{<image filename="images/rs/screenshots/databases/migrate-to-active-active/migrate-to-active-active-dialog-external.png" alt="Migrate to Active-Active dialog with External tab selected.">}}

1. For **Source database URL**, enter the Replica Of source URL you copied in step 1.

1. Click **Add source**.

1. Click **Save**.

## Migrate from Redis Open Source

To migrate a Redis Open Source database to Active-Active:

1. Create a new Active-Active database. For prerequisites and detailed instructions, see [Create an Active-Active geo-replicated database]({{< relref "/operate/rs/databases/active-active/create" >}}).

1. After the Active-Active database is active, click **Edit** on the **Configuration** screen.

1. Expand the **Migrate to Active-Active** section:

    {{<image filename="images/rs/screenshots/databases/migrate-to-active-active/migrate-to-active-active-section.png" alt="Migrate to Active-Active section.">}}

1. Click **+ Add source database**.

1. In the **Migrate to Active-Active** dialog, select **External**:

    {{<image filename="images/rs/screenshots/databases/migrate-to-active-active/migrate-to-active-active-dialog-external.png" alt="Migrate to Active-Active dialog with External tab selected.">}}

1. Enter the **Source database URL**:

    - If the database has a password:

        ```sh
        redis://:<password>@<host>:<port>
        ```

        Where the password is the Redis password represented with URL encoding escape characters.

    - If the database does not have a password:

        ```sh
        redis://<host>:<port>
        ```

1. Click **Add source**.

1. Click **Save**.

## Stop sync after migration

1. Wait until the migration is complete, indicated by the **Status** _Synced_. 

    {{<note>}}
Migration can take minutes to hours to complete depending on the dataset size and network quality.
    {{</note>}}

1. On the Active-Active database's **Configuration** screen, click **Edit**.

1. In the **Migrate to Active-Active** section, click **Stop sync**:

    {{<image filename="images/rs/screenshots/databases/migrate-to-active-active/migrate-to-active-active-synced.png" alt="The Migrate to Active-Active section shows the Active-Active database is synced with the source database.">}}

1. In the **Stop synchronization** dialog, click **Stop** to proceed.

1. Redirect client connections to the Active-Active database after **Status** changes to _Sync stopped_:

    {{<image filename="images/rs/screenshots/databases/migrate-to-active-active/migrate-to-active-active-sync-stopped.png" alt="The Migrate to Active-Active section shows the Active-Active database stopped syncing with the source database.">}}
