---
LinkTitle: Upgrade from Essentials to Pro
Title: Upgrade database from Redis Cloud Essentials to Redis Cloud Pro
alwaysopen: false
categories:
- docs
- operate
- rc
description: Upgrade your Redis Cloud Essentials subscription to a Redis Cloud Pro
  subscription.
weight: 45
---

Redis Cloud Essentials supports low throughput workflows. It supports a range of availability, persistence, and backup options, and can be great for testing and prototyping. However, if your databases need higher throughput, or you're missing features that are not available with Redis Cloud Essentials, you may want to upgrade Redis Cloud Essentials to Redis Cloud Pro.

For more information about the different subscription plans, see [Subscription plans]({{< relref "/operate/rc/subscriptions#subscription-plans" >}}).

To upgrade your Essentials plan, see [Upgrade subscription plan]({{< relref "/operate/rc/subscriptions/view-essentials-subscription#upgrade-plan" >}}).

## Upgrade Essentials subscription to Pro

To follow the steps in this guide, you must have a database with [Redis Cloud Essentials]({{< relref "/operate/rc/subscriptions/view-essentials-subscription" >}}) that you want to upgrade to Redis Cloud Pro.

To upgrade your Essentials database to Redis Cloud Pro:

1. [Create a new database in Redis Cloud Pro](#create-rcp) with the right specifications to be able to migrate your database.

1. [Migrate your Essentials database](#migrate-database) to your new Redis Cloud Pro database.

1. [Migrate your endpoints](#migrate-endpoints) to your new Redis Cloud Pro database.

### Create Redis Cloud Pro database {#create-rcp}

[Create a new database]({{< relref "/operate/rc/databases/create-database/create-pro-database-new" >}}) with the following specifications:

- Select **Redis Cloud Pro** for your subscription type.
- Select the **Version** that matches the Redis version your Essentials subscriptions use.
- In the [**Sizing tab**]({{< relref "/operate/rc/databases/create-database/create-pro-database-new#sizing-tab" >}}), create your databases with the following specifications:
    - Set the memory limit to comply with [Active-Passive memory requirements]({{< relref "/operate/rc/databases/migrate-databases#active-passive-memory-requirements" >}}) if you want to migrate your database using [Active-Passive]({{< relref "/operate/rc/databases/migrate-databases#sync-using-active-passive" >}}).
    - Select any advanced capabilities that your Essentials database offers. You can find a list of enabled advanced capabilities in the [Configuration tab]({{< relref "/operate/rc/databases/view-edit-database#configuration-details-tab" >}}) of your database.
    - In **More options**, set the **Port** to **Manually assign**, and enter the port of your Essentials database. You must set the port number to match the port of your Essentials database if you want to migrate your database endpoints.

### Migrate database

You can migrate your Redis Cloud Essentials database to your new Redis Cloud Pro subscription using any method in the [Migrate databases]({{< relref "/operate/rc/databases/migrate-databases" >}}) guide. This guide uses [Active-Passive]({{< relref "/operate/rc/databases/migrate-databases#sync-using-active-passive" >}}) to migrate databases between subscriptions in the same account.

{{< note >}}
Before you follow this guide, be aware of the following limitations:

- This guide is for migrating databases between subscriptions in the same Redis Cloud console account. [Contact support](https://redis.io/support/) if you want to migrate a database between accounts using Active-Passive.

- As long as Active-Passive is enabled, data in the target database will not expire and will not be evicted regardless of the set [data eviction policy]({{< relref "/operate/rc/databases/configuration/data-eviction-policies.md" >}}). We recommend that you turn off Active-Passive after the databases are synced. 
{{< /note >}}

1. Select the database you want to migrate your data to. This will be your target database.

1. From the **Configuration** tab of the target database, select **Edit**.

    {{<image filename="images/rc/button-database-edit.png" alt="The Edit database button lets you change selected database properties." width=100px >}}

1. In the **Durability** section, enable **Active-Passive Redis** and then select **Add Source**.

    {{<image filename="images/rc/migrate-data-active-passive-enable.png" alt="Active-Passive settings are located in the **Durability** section of the database **Configuration** tab." >}}

    {{<image filename="images/rc/button-database-uri-add.png" alt="Use the **Add Source** button to specify the source of the Active-Passive replica." width="150px">}}

1. This will open the **Add Active-Passive Redis** screen. Select **Current account** to connect a database in your current account.

    {{<image filename="images/rc/migrate-data-add-active-passive.png" alt="The Add Active-Passive Redis screen." width=70% >}}

1. Select your Redis Cloud Essentials database from the **Source database** list. This will be your source database. You can type in the database's name to find it.

    {{<image filename="images/rc/database-add-account-path-list.png" alt="Select the Source database from the database list." width=70% >}}

1. Select **Save Database** to begin updating the database.

    {{<image filename="images/rc/button-database-save.png" alt="Use the **Save Database** button to save your changes, deploy the database, and to start data migration." width="150px" >}}

    Initially, the database status is __Pending__, which means the update task is still running.  

    {{<image filename="images/rc/icon-database-update-status-pending.png" alt="When the status is 'Pending', your changes are still being deployed.">}}

    The sync process doesn't begin until the database becomes `Active`.  

    {{<image filename="images/rc/icon-database-status-active.png" alt="When the status becomes 'Active', data begins to sync." >}}

    When data has fully migrated to the target database, database status reports `Synced`.  

    {{<image filename="images/rc/migrate-data-status-synced.png" alt="When the data is migrated, the target database status displays `Synced`." width=100px >}}

    Active-Passive sync lets you migrate data while apps and other connections are using the source database. Once the data is migrated, you should migrate active connections to the target database before you move on.

### Migrate database endpoints

Migrating your database endpoints after migrating your data lets you direct connections to your new database without any code changes.

{{< note >}}
Be aware of the following limitations to database endpoint migration:
- The following steps migrate the **database endpoints only**. They do not migrate the data in the database.
- The target database must have the same port number and default user settings as the source database.
- Databases created before {{RELEASE DATE}} have both dynamic and static endpoints. You can only migrate the dynamic endpoints to point to a new database. If your application uses the static endpoints, it will connect to the source database instead of the target database. You must update your application to use the dynamic endpoints before you can migrate the endpoints.
{{< /note >}}

To migrate your database endpoints:

1. From the Redis Cloud console, select **Databases** from the menu and select the source database in the list.

1. In the **General** section of the **Configuration** tab, select **Redirect endpoints**.

    {{<image filename="images/rc/databases-configuration-redirect-endpoints.png" alt="Use the **Redirect endpoints** button to change the target database for the source database endpoints." >}}

1. Select the target Redis Cloud Pro database from the **Target database** list. You can type in the database's name to find it.

    You can choose whether to map the original endpoint to the **Public** or the **Private** endpoint.

    {{<image filename="images/rc/migrate-data-redirect-essentials-endpoints.png" alt="Choose whether to map the original endpoint to the Public or Private endpoint." >}}

1. If you want to assign the same [Role-based Access Control (RBAC) roles]({{< relref "/operate/rc/security/access-control/data-access-control/role-based-access-control" >}}) to the target database that are assigned to the source database, select **Assign the same ACLs to the target database**.

    {{<image filename="images/rc/migrate-data-redirect-assign-acls.png" alt="Select **Assign the same ACLs to the target database** to assign the same roles to the target database." >}}

1. Select **I acknowledge this action will redirect my database endpoints** to confirm that you understand that this action will redirect your database endpoints. Then select **Redirect endpoints**.

    {{<image filename="images/rc/migrate-data-redirect-acknowledge.png" alt="The **Redirect endpoints** button redirects the source database endpoints to the target database." >}}

After you redirect your database endpoints, you can go to the **Configuration** tab of the target database to verify that the endpoints now point to the target database. 

You can revert endpoint migration within 24 hours to restore the original endpoints. Select **Revert** to revert endpoint migration.

{{<image filename="images/rc/migrate-data-redirect-revert.png" alt="The **Revert** button reverts endpoint migration." >}}

After the 24-hour window, you can no longer revert to the original endpoints.

### Delete Essentials database

After your data and connections are migrated, turn off **Active-Passive Redis** from the target database, and then [delete the source database]({{< relref "/operate/rc/databases/delete-database" >}}).
