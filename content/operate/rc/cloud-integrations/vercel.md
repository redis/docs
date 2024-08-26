---
LinkTitle: Vercel Marketplace
Title: Create a Redis Cloud database with the Vercel integration.
alwaysopen: false
categories:
- docs
- operate
- rc
description: Shows how to create a Redis Cloud database with Vercel integration.
hideListLinks: true
weight: 66
---

[Redis Cloud is now integrated with Vercel](https://vercel.com/redis-cloud/~/integrations/products/redis-cloud), allowing you to create a new Redis database from your Vercel account and connect it to your Vercel project(s).

## Create database

1. Log in to your Vercel account (or create a new one).
1. Navigate to the **Storage** tab and select **Create database**.
1. Under **Storage partners**, select **View all partners**
    --add screenshot--
1. Find **Redis Cloud** and select **Continue**
1. In the **Create Database** dialog, select your plan and **Continue**.
    More configuration options are coming soon, such as region selection and multi-zone high availability.
    --add screenshot--
1. Enter your database name or use the leave the automatically generated name.
1. Select **Create**.

## Link database to your project

1. Navigate to the **Storage** tab.
1. Find your new database in the list of your team's databases.
1. Select **Connect Project**.
--add screenshot--
1. Choose your project and environments and select **Connect**.

## Connect to your database

After creation, you will see your database details. After provisioning is complete, the status will change from `Initializing` to `Available` (you may need to refresh your browser).

You can use the connection string shown under **Quickstart** to [connect to your database]({{<relref "">}}).

## Manage your database

From the database details page, you can make edits to your database under **Settings**.

----add screenshot---

More configuration options are coming soon, the plan changes, multi-zone high availability, and region selection.

### Configure from Redis Cloud

Options that don't affect the price are configurable from Redis Cloud. From your database detail page, select **Open in Redis Cloud**.

---add screenshot---

Your Redis Cloud account is linked to your Vercel account. All your team's Redis databases will be listed under **Databases** in Redis Cloud. Select your new database to make configuration changes such as passwords or the eviction policy.

{{<note>}} The [eviction policy]({{<relref "/operate/rc/databases/configuration/data-eviction-policies/">}}) defaults to `no eviction` for new databases.  You can change this by [editing the database details]({{<relref "/operate/rc/databases/view-edit-database/">}}).{{</note>}}
