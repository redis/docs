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

1. Navigate to the **Storage** tab. Under **Marketplace Database Providers**, find **Redis** and select **Create**.
    {{<image filename="/images/rc/vercel-storage-create-database-button.png" alt="The Redis database provider in the Vercel Storage tab.">}}

1. In the **Install integration** dialog under **Configuration and plan**, select your region and [high availability]({{< relref "/operate/rc/databases/configuration/high-availability" >}}) settings.

    {{<image filename="/images/rc/vercel-create-db-select-plan.png" alt="Vercel Region and high availability settings">}}

1. Choose a plan and select **Continue**.

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

You can also edit some configuration options on the Redis Cloud console.

From the database detail page, select **Open in Redis**.

{{<image filename="/images/rc/vercel-open-in-redis-cloud.png" alt="Open in Redis">}}

Your Redis Cloud account is linked to your Vercel account. All your team's Redis databases will be listed under **Databases** in Redis Cloud.

{{< warning >}}
Anybody on your team that has a [Vercel access role](https://vercel.com/docs/rbac/access-roles) other than **Pro Viewer**, **Enterprise Viewer**, or **Billing**, can make changes to your database configuration on the Redis Cloud console as if they were an **Owner** on Redis Cloud. See [Team management roles]({{< relref "/operate/rc/security/access-control/access-management#team-management-roles" >}}) for more information.
{{</ warning >}}

Select your new database to make configuration changes such as passwords or the eviction policy.

{{<note>}} The [eviction policy]({{<relref "/operate/rc/databases/configuration/data-eviction-policies">}}) defaults to `no eviction` for new databases.  You can change this by [editing the database details]({{<relref "/operate/rc/databases/view-edit-database">}}).{{</note>}}
