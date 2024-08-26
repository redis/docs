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

Redis Cloud is now integrated with Vercel, allowing you to connect a new Redis database to your Vercel project(s).

## Create database

1. Log in to your Vercel account (or create a new one).
1. Navigate to the **Storage** tab and select **Create database**.
1. Under **Storage partners**, selcet **View all partners** and find **Redis Cloud**.
1. In the **Create databse** dialog, select your plan.
    More configuration options are coming soon, such as region selection, and multi-zone high availability.
1. Enter your database name or use the leave the automatically generated name.
1. Select **Create**.

## Link database to your project

1. Navigate to the **TBD** tab.
1. Find your new database in the list of your team's databases.
1. Select **Link Project** and link your project(s).

## Connect to your database

After creation, you will see your database overview screen **??**.

## Manage your database

From the ***TBD** screen, you can make edits to your database configuration, like the database name.

More configuration options are coming soon, such as switching to a different plan, enabling multi-zone high availability, and region selection.

### Configure from Redis Cloud

Options that don't affect the price are configurable from Redis Cloud.From your **database overview tab??** select **Open in Redis Cloud** or navigate to **Integration** > **Manage** > **Open in Redis**.

Your Redis Cloud account is linked to your Vercel account. All your team's Redis databases will be listed under **Databases**. Select your new database to make configuration changes such as passwords or the eviction policy.

{{<note>}} The [eviction policy]({{<relref "/operate/rc/databases/configuration/data-eviction-policies/">}}) defaults to `no eviction` for new databases.  You can change this by [editing the database details]({{<relref "/operate/rc/databases/view-edit-database/">}}).{{</note>}}








