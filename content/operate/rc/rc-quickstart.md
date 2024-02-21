---
Title: Redis Cloud quick start
alwaysopen: false
categories:
- docs
- operate
- rc
description: null
linktitle: Quick start
weight: 10
---

If you're new to Redis Cloud, this quick start helps you get up and running.  

You'll learn how to:

1.  Create an account, a free subscription, and a database

1.  Connect to your database

If you already have an account, see [Create a Fixed subscription]({{< relref "/operate/rc/subscriptions/create-fixed-subscription" >}}) to create a Free 30MB subscription. Free plans are a tier of fixed plans; this provides an easy upgrade path when you need it.

If you already have a subscription, see [Manage subscriptions]({{< relref "/operate/rc/subscriptions/" >}}) and [Manage databases]({{< relref "/operate/rc/databases/" >}}).

## Create an account

To create a new account with a free subscription and database:

1. Go to the [Sign up](https://redis.com/try-free/) page.

1. There are two options available to get started with Redis Cloud:
   * Enter your information in the form and select **Get Started**.
   * Sign up with **Google** or **Github**.

1. After you enter your information, you should receive an activation email from Redis. Select **Activate account** to go to the **Get Started** page in the [Redis Cloud console](https://app.redislabs.com).

    {{<image filename="images/rc/quickstart-get-started.png" width="75%" alt="Dialog to create your free subscription." >}}

    1. Choose your role from the **Role** drop-down.
    1. Choose your company size from the **myself/company** drop-down. If you are working on a personal project, select **myself**.
    1. Select your Redis use case from the **use case** drop-down.
     1. Choose your client language from the **client** drop-down.

    Click **Create Free Database** to move on.

1. Select your preferred cloud vendor and region.

   {{<image filename="images/rc/quickstart-create-free-database.png" width="75%" alt="Dialog to create your free subscription." >}}

1. Select **Let's start free** to create your subscription and database.

    {{< note >}}
If you would rather customize your subscription and database, select **Create a custom database** to go to the **New subscription** page. From there, you can [create a fixed subscription]({{< relref "/operate/rc/subscriptions/create-fixed-subscription" >}}) or [create a flexible subscription]({{< relref "/operate/rc/subscriptions/create-flexible-subscription" >}}).
    {{< /note >}}

    You're taken to the **Overview tab** for your new subscription.

    {{<image filename="images/rc/quickstart-subscription-overview.png" width="75%" alt="Overview tab showing your new subscription and database." >}}

1.  Select the database name to view the **Configuration** tab for your new database.

    {{<image filename="images/rc/quickstart-database-overview.png" width="75%" alt="Configuration tab showing details of your new database." >}}

1.  In the upper corner, an icon shows the current status of the database.  If the icon shows an orange clock, this means your database is still being created and its status is _pending_.

       {{< image filename="/images/rc/icon-database-update-status-pending.png#no-click" alt="Pending database status" class="inline" >}} &nbsp; {{< image filename="/images/rc/icon-database-update-status-active.png#no-click" alt="Active database status" class="inline" >}}

       Once the database has been created, it becomes _active_ and the status indicator switches to a green circle containing a checkmark.  

    Admin console operations are asynchronous; they operate [in the background]({{< relref "/operate/rc/api/get-started/process-lifecycle.md" >}}).  You can continue to use the admin console for other tasks, but pending resources aren't available until they're active.

    When your new database becomes active, you're ready to connect to it.

## Connect to a database

At this point, you're viewing the **Configuration** details for your new database. Go to the **Security** section of the page.

To connect to your database, you need your username and password. Each database is protected by a **Default user** called `default` and a masked **Default user password**. Select the eye icon to show or hide the password.    

{{<image filename="images/rc/database-fixed-configuration-security.png" width="75%" alt="The Security section of the Configuration tab of the database details page." >}}

Once you have the username and password, select **Connect** to open the connection wizard.

{{< image filename="/images/rc/connection-wizard-button.png#no-click" alt="Connect button." >}}

The connection wizard provides the following database connection methods:

- [RedisInsight](https://redis.com/redis-enterprise/redis-insight/)

- [`redis-cli`]({{< relref "/operate/rs/references/cli-utilities/redis-cli/" >}}) utility

- [Redis client](https://redis.io/clients) for your preferred programming language


{{<image filename="images/rc/connection-wizard.png" alt="The connection wizard." >}}

### RedisInsight{#using-redisinsight}

RedisInsight is a free Redis GUI that is available for MacOS, Windows, and Linux.

1. In the connection wizard, under **RedisInsight**, select your operating system from the **Download RedisInsight** menu.

1. Select **Download** to download RedisInsight.

1. [Install RedisInsight](https://redis.io/docs/connect/insight/).

1. Once installed, select **Open with RedisInsight**.

1. A pop-up asks if you wish to open the link with RedisInsight. Select **Open RedisInsight** to connect to your database with RedisInsight.


See the [RedisInsight documentation](https://redis.io/docs/connect/insight/) for more information.

### Redis client{#using-redis-client}

A Redis client is a software library or tool that enables applications to interact with a Redis server. Each client has its own syntax and installation process. For help with a specific client, see the client's documentation.

The connection wizard provides code snippets to connect to your database with the following programming languages:

- node.js using [node-redis](https://github.com/redis/node-redis/blob/master/README.md)
- .NET using [StackExchange.Redis](https://stackexchange.github.io/StackExchange.Redis/)
- Python using [redis-py](https://github.com/redis/redis-py#redis-py)
- Java using [Jedis](https://github.com/redis/jedis#jedis)

{{<image filename="images/rc/connection-wizard-clients.png" alt="The connection wizard clients." >}}

See [Clients](https://redis.io/docs/connect/clients/) to learn how to connect with the official Redis clients, or see the [Client list](https://redis.io/resources/clients/) to view all community-run clients by language.

### redis-cli {#using-rediscli}

The [`redis-cli`]({{< relref "/operate/rs/references/cli-utilities/redis-cli/" >}}) utility is installed when you install Redis.  It provides a command-line interface that lets you work with your database using core [Redis commands](https://redis.io/commands/).

To run `redis-cli`, [install Redis Stack](https://redis.io/docs/install/install-stack/) on your machine.

See [Redis CLI](https://redis.io/docs/connect/cli/) to learn how to use `redis-cli`.

## More info

- [Connect your application](https://redis.io/docs/connect/clients/)
- [Import data]({{< relref "/operate/rc/databases/import-data.md" >}})
- [Manage databases]({{< relref "/operate/rc/databases" >}})
- [Data persistence]({{< relref "/operate/rc/databases/configuration/data-persistence.md" >}})
- [Secure your Redis Cloud database]({{< relref "/operate/rc/security/" >}})
- [Back-up Flexible databases]({{< relref "/operate/rc/databases/back-up-data.md" >}})
- [Monitor Redis Cloud performance]({{< relref "/operate/rc/databases/monitor-performance.md" >}}).
