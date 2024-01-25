---
Title: Migrate data to new subscription
alwaysopen: false
categories:
- docs
- operate
- rc
description: Shows two ways to migrate data to a database in a new subscription.
linkTitle: Migrate databases
weight: 35
---
There are times when you need to migrate data from one database to another.  

Here are two common ways to do this.

Each approach is suitable for different situations and the steps can vary according to your needs.

## Transfer via import 

The most common way to transfer data to a new database is to import a copy of the data into it.

Here's how it works:

1.  [Select an export storage destination]({{< relref "/operate/rc/databases/back-up-data#set-up-backup-storage-locations" >}}) and verify that it's ready for use and has sufficient space.

1.  [Export]({{< relref "/operate/rc/databases/back-up-data.md" >}}) the data from the original database to the storage location.

1.  [Import]({{< relref "/operate/rc/databases/import-data.md" >}}) the exported data into the target database, the one hosted by the new subscription.

The migrated data reflects the state of the data at the time it was originally exported.  

If you have apps or other connections actively using the source database, consider scheduling downtime for the migration to avoid loss.

This approach also lets you transfer data between databases hosted by different services. 

## Sync using Active-Passive

If your target database is hosted on a Flexible (or Annual) subscription, you can use Active-Passive to sync (synchronize) the source database to the target database.  (The source database can be hosted on a Fixed, Flexible, or Annual subscription.)

The source database remains active while the data migrates.

The following sections describe Active-Passive syncing processes.

### General Active-Passive syncing process

To migrate data using Active-Passive syncing, specify the target database as an Active-Passive replica of the source database:

1.  Get the source database's public endpoint from the **General** section of the database's **Configuration** tab.
2.  Enable the target database as an Active-Passive replica for the source.
3.  Wait for the data to sync.
4.  Switch apps and other connections to the target database.
5.  Disable Active-Passive for the target database.

{{< note >}}
An error will appear when syncing the two databases if the source database has [Transport Layer Security (TLS)]({{< relref "/operate/rc/security/database-security/tls-ssl" >}}) enabled. [Contact support](https://redis.com/company/support/) if you want to migrate a TLS-enabled database using Active-Passive.
{{< /note >}}

{{< note >}}
An error will appear when syncing the two databases if the source and target databases are hosted on different Redis Cloud accounts. [Contact support](https://redis.com/company/support/) if you want to migrate a database between accounts using Active-Passive.
{{< /note >}}

### Detailed Active-Passive syncing process

If the databases belong to the same Redis Cloud account, follow these detailed steps to migrate data using Active-Passive syncing:

1.  Select **Databases** from the [Redis Cloud console](https://app.redislabs.com/) menu and select the source database in the list.

    {{<image filename="images/rc/migrate-database-select-source.png" alt="Select the source database from the database list." >}}

2.  Select the **Copy** button next to the **Public endpoint** details for the source database to copy the endpoint details to the Clipboard.

    {{<image filename="images/rc/database-public-endpoint-copy.png" alt="The Copy button copies the public endpoint details to the Clipboard." >}}

3.  Use the database list drop-down to select the target database.

    {{<image filename="images/rc/migrate-data-select-target-list.png" alt="Use the database list drop-down to select the target database." width="50%">}}

4.  From the **Configuration** tab of the target database, select **Edit database**.

    {{<image filename="images/rc/migrate-data-target-edit.png" alt="Use the **Edit Database** button to change the configuration of the target database." >}}

5.  In the **Durability** section, enable **Active-Passive Redis** and then select **Add URI**.

    {{<image filename="images/rc/migrate-data-active-passive-enable.png" alt="Active-Passive settings are located in the **Durability** section of the database **Configuration** tab." >}}

    {{<image filename="images/rc/button-database-uri-add.png" alt="Use the **Add URI** button to specify the source of the Active-Passive replica." >}}

6.  In the text box, type `redis://` and then paste in the public endpoint details. 

    {{<image filename="images/rc/migrate-data-specify-source-uri.png" alt="The source URI must be specified using the 'redis://' protocol." >}}

    Select **Save** to make sure you've specified the source URI correctly.

    {{<image filename="images/rc/icon-database-save.png" alt="The **Save** button verifies the Source URI and you can't save until it validates." >}}

    If the endpoint cannot be verified, make sure that you've copied the details directly from the source database and that the value you entered starts with `redis://`.

7.  Select **Save Database** to begin updating the database.

    {{<image filename="images/rc/button-database-save.png" alt="Use the **Save Database** button to save your changes, deploy the database, and to start data migration." >}}

    Initially, the database status is __Pending__, which means the update task is still running.  

    {{<image filename="images/rc/icon-database-update-status-pending.png" alt="When the status is 'Pending', your changes are still being deployed.">}}

    The sync process doesn't begin until the database becomes `Active`.  

    {{<image filename="images/rc/icon-database-update-status-active.png" alt="When the status becomes 'Active', data begins to sync." >}}

    When data has fully migrated to the target database, database status reports `Synced`.  

    {{<image filename="images/rc/migrate-data-status-synced.png" alt="When the data is migrated, the target database status displays `Synced`." >}}

Active-Passive sync lets you migrate data while apps and other connections are using the source database.  Once the data is migrated, you should migrate active connections to the target database.  

## Active-Passive memory requirements

Active-Passive sync requires more memory than data import.  On average, you need an extra 25% memory on top of other requirements, though specific requirements depend on the data types and other factors.  

To illustrate, suppose you want to migrate a 1&nbsp;GB source database without replication to a target database with replication enabled.  Here, the target database memory limit should be at least 2.5&nbsp;GB to avoid data loss.

Once the databases are synced, you can disable Active-Passive for the target database.  Before doing so, however, verify that apps and other connections have switched to the target database; otherwise, you may lose data.

