---
Title: Upgrade Redis database version
alwaysopen: false
categories:
- docs
- operate
- rc
description: Describes when you can upgrade your database to the latest available version for each plan type.
linkTitle: Upgrade database version
weight: 1
aliases:
  - /rc/databases/upgrade-version
---

Database version upgrade options depend on your plan type.

## Redis Cloud Essentials

All new Redis Cloud Essentials databases are on the latest available version of Redis.

For Redis 8+, minor version auto-upgrades are always enabled and occur automatically during maintenance windows when new versions become available. Major version upgrades require customer action.

For Redis 7 and earlier versions, Redis will notify users when new database versions are available, but upgrades must be done manually.

## Redis Cloud Pro

You can upgrade Redis Cloud Pro databases that are not on the latest available version of Redis to a later version at any time.

{{< note >}}
Please keep in mind the following before upgrading your database version:

- We recommend that you [back up your data]({{< relref "/operate/rc/databases/back-up-data" >}}) before upgrading to make it easier to [manually revert the upgrade](#manually-revert-upgrade) if needed.

- We recommend that you upgrade your database during off-peak hours or during application maintenance to minimize reconnections.

- Review the breaking changes for the new database version before upgrading: 
    - [Redis 7.2]({{< relref "/operate/rc/changelog/version-release-notes/7-2" >}}) 
    - [Redis 7.4]({{< relref "/operate/rc/changelog/version-release-notes/7-4" >}}) 

- You must upgrade the target database in an [Active-Passive]({{< relref "/operate/rc/databases/migrate-databases#sync-using-active-passive" >}}) setup before you upgrade the source database to prevent compatibility issues.
{{< /note >}}

### Upgrade Redis Cloud Pro database

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

### Manually revert upgrade

Automatically reverting to a previous Redis version is not supported on Redis Cloud.

If you [backed up your database]({{< relref "/operate/rc/databases/back-up-data" >}}) before you upgraded your version, you can:

1. [Delete your database]({{< relref "/operate/rc/databases/delete-database" >}}) without deleting your subscription.
1. [Create a new database]({{< relref "/operate/rc/databases/create-database/create-pro-database-existing" >}}) in your subscription with the following settings:
    - **Port number**: Use the same port number as the old database.
    - **Version**: Select the original version of Redis.
1. [Import the backup files]({{< relref "/operate/rc/databases/import-data" >}}) into the new database.

This allows you to connect to the database on the previous version without changing your connection details in your application.

If you did not back up your database before upgrading:

1. [Back up your database]({{< relref "/operate/rc/databases/back-up-data" >}}).
1. [Create a new database]({{< relref "/operate/rc/databases/create-database/create-pro-database-existing" >}}) in your subscription and select the original version of Redis.
1. [Import the backup files]({{< relref "/operate/rc/databases/import-data" >}}) into the new database.
1. Change connection details in your application from the old database to the new database.