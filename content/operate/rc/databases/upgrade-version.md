---
Title: Upgrade Redis database version
alwaysopen: false
categories:
- docs
- operate
- rc
description: Describes when you can upgrade your database to the latest available version for each plan type.
linkTitle: Upgrade database version
weight: 37
---

Database version upgrade options depend on your plan type.

## Redis Cloud Essentials

All new Redis Cloud Essentials databases are on the latest available version of Redis. Redis will notify Redis Cloud Essentials users when a new database version is available. 

## Redis Cloud Pro

Redis Cloud Pro databases that are not on the latest available version of Redis can be upgraded to a later version at any time.

{{< note >}}
Reverting to a previous Redis version is not supported on Redis Cloud. 

Before upgrading your Redis version, we recommend that you [back up your data]({{< relref "/operate/rc/databases/back-up-data" >}}). If you need to revert back to a previous database version, you can either:
- [Create a new database in the same subscription]({{< relref "/operate/rc/databases/create-database/create-pro-database-existing" >}}) with your desired version and the same port number, and [import]({{< relref "/operate/rc/databases/import-data" >}}) the backup to the new database, OR
- [Create a new database]({{< relref "/operate/rc/databases/create-database/create-pro-database-existing" >}}) with your desired version, and [migrate data]({{< relref "/operate/rc/databases/migrate-databases" >}}) and connections from the old database to the new one.

Review the breaking changes for the new database version before updating: 
- [Redis 7.2]({{< relref "/operate/rc/changelog/2023/june-2023#redis-72-breaking-changes" >}}) 
- [Redis 7.4]({{< relref "/operate/rc/changelog/july-2024#redis-74-breaking-changes" >}}) 
{{< /note >}}

### Upgrade Redis Cloud Pro database

{{< note >}}
Upgrading a single Redis Cloud Pro database is available for selected accounts and will be rolled out gradually to other accounts in the future. If you don't see **Version upgrade** in the **More actions** menu for your database and your database version is not the latest available version, you can request to upgrade all of the databases in your subscription from the [subscription page]({{< relref "/operate/rc/subscriptions/view-pro-subscription" >}}).
{{< /note >}}

To upgrade a Redis Cloud Pro database: 

1. Choose your database from the **Databases** list to open your database page. Select **More actions > Version upgrade**.

    {{<image filename="images/rc/databases-more-actions-menu.png" alt="The More Actions menu on the Database page." width=40% >}}
    
    You can also select **More actions > Version upgrade** from the database list.

1. Select the target version from the **Select version** list.

    {{<image filename="images/rc/database-version-upgrade.png" alt="The Redis version upgrade screen." width=80% >}}

    If your database has not been backed up before, we recommend that you back up your database. Select **Go to backup** to go to the [backup settings]({{< relref "/operate/rc/databases/back-up-data" >}}).

1. Select **Upgrade** to start the upgrade.

    {{<image filename="images/rc/button-upgrade.png" alt="The upgrade button." width=100px >}}

The database will start upgrading to the selected version immediately. The upgrade may take a few minutes. 

You can continue to use the Redis Cloud console for other tasks during the upgrade.





