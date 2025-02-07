---
LinkTitle: Vercel Marketplace
Title: Create a Redis Cloud database with the Vercel integration
alwaysopen: false
categories:
- docs
- operate
- rc
description: Shows how to create a Redis Cloud database with Vercel integration.
hideListLinks: true
weight: 66
---

The [Redis Cloud Vercel integration](https://vercel.com/marketplace/redis-cloud) lets you create a new Redis database from your Vercel account and connect it to your Vercel project(s).

## Create database

1. Log in to your Vercel account (or create a new one).

1. Navigate to the **Storage** tab and select **Create database**.
    {{<image filename="/images/rc/vercel-storage-create-database-button.png" alt="Storage - Create Database">}}

1. Under **Storage partners**, select **View all partners**.
    {{<image filename="/images/rc/vercel-redis-cloud-partners.png" alt="Browse storage" width=400px >}}

1. Find **Redis Cloud** and select **Continue**.

1. In the **Create Database** dialog, select your plan and **Continue**.

    {{<image filename="/images/rc/vercel-create-db-select-plan.png" alt="Create database">}}

    More configuration options are coming soon, such as region selection and multi-zone high availability.

1. Enter your database name or use the automatically generated name.

1. Select **Create**.

## Connect to your database

After creation, you will see your database details. After provisioning is complete, the status will change from `Initializing` to `Available` (you may need to refresh your browser).

{{<image filename="/images/rc/vercel-status-available.png" alt="Vercel database details">}}

You can use the connection string shown under **Quickstart** to [connect to your database]({{<relref "operate/rc/databases/connect">}}).

## Link database to your project

1. Navigate to the **Storage** tab.
1. Find your new database in the list of your team's databases.
1. Select **Connect Project**.
    {{<image filename="/images/rc/vercel-connect-project-button.png" alt="Connect Project button">}}
1. Choose your project and environments and select **Connect**.
    {{<image filename="/images/rc/vercel-connect-project.png" alt="Connect project">}}

## Manage your database

From the database details page, you can make edits to your database under **Settings**.

More configuration options are coming soon, including plan changes, multi-zone high availability, and region selection.

### Configure from Redis Cloud

You can also edit some configuration options in Redis Cloud.

From the database detail page, select **Open in Redis Cloud**.

{{<image filename="/images/rc/vercel-open-in-redis-cloud.png" alt="Open in Redis">}}

Your Redis Cloud account is linked to your Vercel account. All your team's Redis databases will be listed under **Databases** in Redis Cloud.

Select your new database to make configuration changes such as passwords or the eviction policy.

{{<note>}} The [eviction policy]({{<relref "/operate/rc/databases/configuration/data-eviction-policies">}}) defaults to `no eviction` for new databases.  You can change this by [editing the database details]({{<relref "/operate/rc/databases/view-edit-database">}}).{{</note>}}
