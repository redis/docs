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

You can upgrade databases that are not on the latest available version of Redis to a later version at any time.

{{< note >}}
Please keep in mind the following before upgrading your database version:

- We recommend that you [back up your data]({{< relref "/operate/rc/databases/back-up-data" >}}) before upgrading to make it easier to [manually revert the upgrade](#manually-revert-upgrade) if needed.

- We recommend that you upgrade your database during off-peak hours or during application maintenance to minimize reconnections.

- Review the breaking changes for the new database version before upgrading: 
    - [Redis 7.2]({{< relref "/operate/rc/changelog/version-release-notes/7-2" >}}) 
    - [Redis 7.4]({{< relref "/operate/rc/changelog/version-release-notes/7-4" >}})
    - [Redis 8.0]({{< relref "/operate/rc/changelog/version-release-notes/8-0" >}})
    - [Redis 8.2]({{< relref "/operate/rc/changelog/version-release-notes/8-2" >}})

- You must upgrade the target database in an [Active-Passive]({{< relref "/operate/rc/databases/migrate-databases#sync-using-active-passive" >}}) setup before you upgrade the source database to prevent compatibility issues.
{{< /note >}}

## Upgrade database

{{< multitabs id="upgrade-database" 
tab1="Single-region database"
tab2="Active-Active database" >}}

To upgrade a single-region Redis Cloud database: 

1. Choose your database from the **Databases** list to open your database page. Select **More actions > Version upgrade**.

    <img src="../../../../../static/images/rc/databases-more-actions-menu.png" alt="The More Actions menu on the Database page." width=40% >
    
    You can also select **More actions > Version upgrade** from the database list.

1. Select the target version from the **Select version** list.

    <img src="../../../../../static/images/rc/database-version-upgrade.png" alt="The Redis version upgrade screen." width=80% >

    If your database has not been backed up before, we recommend that you back up your database. Select **Go to backup** to go to the [backup settings]({{< relref "/operate/rc/databases/back-up-data" >}}).

1. Select **Upgrade Now** to start the upgrade.

    <img src="../../../../../static/images/rc/button-upgrade-now.png" alt="The upgrade button." width=100px >

The database will start upgrading to the selected version immediately. The upgrade may take a few minutes. 

You can continue to use the Redis Cloud console for other tasks during the upgrade.

-tab-sep-

To request to upgrade all databases in an [Active-Active]({{< relref "/operate/rc/databases/active-active" >}}) subscription:

1. Choose your Active-Active subscription from the **Subscriptions** list to open your subscription page. Select **Version upgrade**.

    <img src="../../../../../static/images/rc/button-version-upgrade.png" width=150px alt="Version upgrade button." >

1. Select the version to upgrade your databases from the list and select **Upgrade** to submit the upgrade request.

    <img src="../../../../../static/images/rc/version-upgrade-request.png" width=80% alt="Version upgrade request list with version 8.2 selected." >

The upgrade will start in 1-3 weeks from your request, according to your subscription's [maintenance windows]({{< relref "/operate/rc/subscriptions/maintenance/set-maintenance-windows" >}}). All databases in the subscription will be upgraded to the same version.

{{< /multitabs >}}

## Manually revert upgrade

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