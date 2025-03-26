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

### Create Redis Cloud Pro database {#create-rcp}

[Create a new database]({{< relref "/operate/rc/databases/create-database/create-pro-database-new" >}}) with the following specifications:

- Select **Redis Cloud Pro** for your subscription type.
- Select the **Version** that matches the Redis version your Essentials subscriptions use.
- In the [**Sizing tab**]({{< relref "/operate/rc/databases/create-database/create-pro-database-new#sizing-tab" >}}), create your databases with the following specifications:
    - Set the memory limit to comply with [Active-Passive memory requirements]({{< relref "/operate/rc/databases/migrate-databases#active-passive-memory-requirements" >}}) if you want to migrate your database using [Active-Passive]({{< relref "/operate/rc/databases/migrate-databases#sync-using-active-passive" >}}).
    - Select any advanced capabilities that your Essentials database offers. You can find a list of enabled advanced capabilities in the [Configuration tab]({{< relref "/operate/rc/databases/view-edit-database#configuration-details-tab" >}}) of your database.

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

    {{<image filename="images/rc/migrate-data-add-active-passive.png" alt="The Add Active-Passive Redis screen." >}}

1. Select your Redis Cloud Essentials database from the **Source database** list. This will be your source database. You can type in the database's name to find it.

    {{<image filename="images/rc/database-add-account-path-list.png" alt="Select the Source database from the database list." >}}

1. Select **Save Database** to begin updating the database.

    {{<image filename="images/rc/button-database-save.png" alt="Use the **Save Database** button to save your changes, deploy the database, and to start data migration." >}}

    Initially, the database status is __Pending__, which means the update task is still running.  

    {{<image filename="images/rc/icon-database-update-status-pending.png" alt="When the status is 'Pending', your changes are still being deployed.">}}

    The sync process doesn't begin until the database becomes `Active`.  

    {{<image filename="images/rc/icon-database-update-status-active.png" alt="When the status becomes 'Active', data begins to sync." >}}

    When data has fully migrated to the target database, database status reports `Synced`.  

    {{<image filename="images/rc/migrate-data-status-synced.png" alt="When the data is migrated, the target database status displays `Synced`." >}}

    Active-Passive sync lets you migrate data while apps and other connections are using the source database. Once the data is migrated, you should migrate active connections to the target database before you move on.

1. After your data and connections are migrated, turn off **Active-Passive Redis** from the target database.

1. [Delete the source database]({{< relref "/operate/rc/databases/delete-database" >}}).



