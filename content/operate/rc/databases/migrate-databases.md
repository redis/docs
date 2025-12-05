---
Title: Migrate data between Redis Cloud databases
alwaysopen: false
categories:
- docs
- operate
- rc
description: Shows two ways to migrate data from one Redis Cloud database to another.
linkTitle: Migrate databases
weight: 30
---
There are times when you need to migrate data from one Redis Cloud database to another.  

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

If your target database is hosted on Redis Cloud Pro, you can use Active-Passive to sync the source database to the target database.  The source database can be hosted on Redis Cloud Pro or Redis Cloud Essentials.

The source database remains active while the data migrates.

The following sections describe Active-Passive syncing processes.

### General Active-Passive syncing process

To migrate data using Active-Passive syncing, specify the target database as an Active-Passive replica of the source database:

1.  Get the source database's public endpoint from the **General** section of the database's **Configuration** tab.
2.  Activate the target database as an Active-Passive replica for the source.
3.  Stop all writes to the source database and wait for the data to sync.
4.  Turn off Active-Passive for the target database.
5.  Switch apps and other connections to the target database.

{{< note >}}
Before you use Active-Passive, be aware of the following limitations:

- An error will appear when syncing the two databases if the source and target databases are hosted on different Redis Cloud accounts. [Contact support](https://redis.io/support/) if you want to migrate a database between accounts using Active-Passive.

- As long as Active-Passive is enabled, data in the target database will not expire and will not be evicted regardless of the set [data eviction policy]({{< relref "/operate/rc/databases/configuration/data-eviction-policies.md" >}}). **Do not write to the target database while Active-Passive is enabled.** We recommend that you turn off Active-Passive after the databases are synced. 

- Turning on Active-Passive will flush the target database. Make sure that your target database has no important data before you turn on Active-Passive.
{{< /note >}}

### Detailed Active-Passive syncing process {#sync-using-active-passive}

Follow these detailed steps to migrate data using Active-Passive syncing:

1.  Select **Databases** from the [Redis Cloud console](https://cloud.redis.io/) menu and select the target database in the list.

    {{<image filename="images/rc/migrate-database-select-source.png" alt="Select the target database from the database list." >}}

1.  From the **Configuration** tab of the target database, select **Edit**.

    {{<image filename="images/rc/migrate-data-target-edit.png" alt="Use the **Edit Database** button to change the configuration of the target database." >}}

1.  In the **Durability** section, enable **Active-Passive Redis** and then select **Add Source**.

    {{<image filename="images/rc/migrate-data-active-passive-enable.png" alt="Active-Passive settings are located in the **Durability** section of the database **Configuration** tab." >}}

    {{<image filename="images/rc/button-database-uri-add.png" alt="Use the **Add Source** button to specify the source of the Active-Passive replica." width="150px">}}

1. This will open the **Add Active-Passive Redis** screen. Select where the source database is located.

    {{<image filename="images/rc/migrate-data-add-active-passive.png" alt="The Add Active-Passive Redis screen." width=70% >}}

    - Select **Current account** if the source database is located in this Redis Cloud account. 
    
        Select the source database from the **Source database** list. You can type in the database's name to find it.

        {{<image filename="images/rc/database-add-account-path-list.png" alt="Select the Source database from the database list." width=70% >}}

    - If the source database is hosted externally, select **External**.

        1.  In the **Enter the source URI** field, type `redis://` and then paste in the public endpoint details. 

            {{<image filename="images/rc/migrate-data-specify-source-uri.png" alt="The source URI must be specified using the 'redis://' protocol." width=70% >}}

        1. Select if the source database requires Transport Layer Security (TLS).
        
            - If the source database requires TLS, select **TLS** and enter the public server certificate in the **Server Certificate** field.

            {{<image filename="images/rc/migrate-data-tls-server-cert.png" alt="The Server Certificate field." width=70% >}}

            - If the source database requires client authentication, select **Mutual TLS**.

                1. Enter the public server certificate in the **Server Certificate** field.

                    {{<image filename="images/rc/migrate-data-tls-server-cert.png" alt="The Server Certificate field." width=70% >}}

                1. Select **Download** to download the client certificate. 

                    {{<image filename="images/rc/migrate-data-tls-client-cert.png" alt="The Client Certificate field. Select Download to download the client certificate." width=70% >}}

                1. Configure the source database to accept the client certificate.

1. Select **Save Active-Passive** to save your Active-Passive settings.

    {{<image filename="images/rc/icon-database-save-active-passive.png" alt="The **Save Active-Passive** button saves the active-passive settings." width="150px">}}

    For an external database, we'll verify the endpoint at this step. If the endpoint can't be verified, make sure that you've copied the details directly from the source database and that the value you entered starts with `redis://`.

1.  Select **Save Database** to begin updating the database.

    {{<image filename="images/rc/button-database-save.png" alt="Use the **Save Database** button to save your changes, deploy the database, and to start data migration." width="150px" >}}

    Initially, the database status is __Pending__, which means the update task is still running.  

    {{<image filename="images/rc/icon-database-update-status-pending.png" alt="When the status is 'Pending', your changes are still being deployed.">}}

    The sync process doesn't begin until the database becomes `Active`.  

    {{<image filename="images/rc/icon-database-status-active.png" alt="When the status becomes 'Active', data begins to sync." >}}

    When data has fully migrated to the target database, database status reports `Synced`.  

    {{<image filename="images/rc/migrate-data-status-synced.png" alt="When the data is migrated, the target database status displays `Synced`." width=100px >}}

Active-Passive sync lets you migrate data while apps and other connections are using the source database.  Once the data is migrated, you should migrate active connections to the target database.

{{< warning >}}
Do not write to the target database until turning off Active-Passive. Writing to the target database of an Active-Passive setup can cause data consistency issues and replication failures. See [Active-Passive replication considerations]({{< relref "/operate/rc/databases/configuration/data-eviction-policies.md#active-passive-replication-considerations" >}}) for more information.
{{< /warning >}}

## Active-Passive memory requirements

Active-Passive sync requires more memory than data import.  On average, you need an extra 25% memory on top of other requirements, though specific requirements depend on the data types and other factors.  

To illustrate, suppose you want to migrate a 1&nbsp;GB source database without replication to a target database with replication enabled.  Here, the target database memory limit should be at least 2.5&nbsp;GB to avoid data loss.

Once the databases are synced, you can disable Active-Passive for the target database.  Before doing so, however, verify that apps and other connections have switched to the target database; otherwise, you may lose data.

