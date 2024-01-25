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

If you have data in a single-region Redis Enterprise Software database that you want to migrate to an [Active-Active databases]({{< relref "/operate/rs/databases/active-active/_index.md" >}}),
you'll need to create a new Active-Active database and migrate the data into the new database as a [Replica Of]({{< relref "/operate/rs/databases/import-export/replica-of/" >}}) the existing database.
This process will gradually populate the data in the Active-Active database.

Before data migration starts, all data is flushed from the Active-Active database.
The data is migrated to the Active-Active instance where you enabled Replica Of, and the data from that instance is copied to the other Active-Active instances.
When data migration is finished, disable Replica Of and connect your applications to the Active-Active database.

{{<image filename="images/rs/A-A_migration.png" width="75%" alt="Active-Active data migration process" >}}


{{< note >}}
During the migration, make sure that any applications that connect to the Active-Active database are **read-only**
to make sure the dataset is identical to the source database during the migration process. You may continue to write to the source database during the migration process.
{{< /note >}}

To migrate a Redis Enterprise Software database to Active-Active:

1. If you are using the new Cluster Manager UI, switch to the legacy admin console.

    {{<image filename="images/rs/screenshots/switch-to-legacy-ui.png"  width="300px" alt="Select switch to legacy admin console from the dropdown.">}}

1. Create a new [Active-Active database]({{< relref "/operate/rs/databases/active-active/create.md" >}}).

    After the Active-Active database is activated, you see the database's configuration.

1. Click **Edit** at the bottom of the database configuration.
1. Enable **Migration using Replica Of**.
1. Click **Continue** to confirm that you want to flush the data from the Active-Active database.
1. Enter the URL of the source database endpoint (the order has no impact on replication).

    <!-- Shared in create-active-passive.md -->

    - For a source database in the same RS cluster - When you click on the box,
    the available databases are shown in the correct format for the URL of the source endpoint:

        ```sh
        <database name>: redis://admin:<database_password>@<database_endpoint>:<database_port>
        ```

        You can select the database that you want to use as the source.

    - For a source database in a different RS cluster:
        1. Log in to the Web UI of the cluster that hosts the source database.
        1. In **databases**, click on the database and go to **configuration**.
        1. Under **Endpoint**, click on **Get Replica Of source URL**.

            ![Replica Of source URL](/images/rs/replicaof-source-url.png)

        1. Click **Copy to Clipboard** to copy the URL of the source endpoint.

            If you want a different internal password, you can click **Regenerate Password**.

            {{< warning >}}
If you regenerate the password, replication to existing destinations fails until you update their configuration with the new password.
            {{< /warning >}}

        1. In the destination database, paste the URL of the source endpoint in the **Replica Of** box, and click ![Save](/images/rs/icon_save.png#no-click "Save").

        {{< note >}}
For a source database on a different Redis Enterprise Software cluster,
you can [compress the replication data]({{< relref "/operate/rs/databases/import-export/replica-of#data-compression-for-replica-of" >}}) to save bandwidth.
        {{< /note >}}

    - For a source database in an OSS Redis cluster - Enter the URL of the source endpoint in the format:

        - If the database has a password -

            ```sh
            redis://:<redis_password>@<hostname>:<database_port>
            ```

            Where the password is the Redis password represented with URL encoding escape characters.

        - If the database has no password -

            ```sh
            redis://<hostname>:<database_port>
            ```

    {{< note >}}
If you used the mDNS protocol for the cluster name (FQDN),
the [client mDNS prerequisites]({{< relref "/operate/rs/networking/mdns.md" >}}) must be met in order to communicate with other clusters.
    {{< /note >}}

1. Click **Update** at the bottom of the page.
1. When the synchronization icon turns green ![Synchronization complete](/images/rs/icon_sync_green.png#no-click "Synchronization complete"), the migration is complete. Note that migration can take minutes to hours to complete depending on the dataset size and network quality.
1. Edit the configuration of the Active-Active database and select the **Stop** button to disable **Migration using Replica Of**.
{{<image filename="images/rs/Migration_using_Replica_Of_complete.png" alt="disable migration using replica of" >}}
1. Redirect your database connections to the Active-Active database.
