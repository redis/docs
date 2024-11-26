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

1.  Create an account and a free database

1.  Connect to your database

If you already have an account, see [Create an Essentials database]({{< relref "/operate/rc/databases/create-database/create-essentials-database" >}}) to create a Free 30 MB Essentials database. Free plans are a type of Essentials plans; this provides an easy upgrade path when you need it.

If you already have a database, see [Manage databases]({{< relref "/operate/rc/databases/" >}}).

## Create an account

To create a new account with a free database:

1. Go to the [Sign up](https://redis.io/try-free/) page.

1. There are two options available to get started with Redis Cloud:
   * Enter your information in the form and select **Get Started**.
   * Sign up with **Google** or **Github**.

1. After you enter your information, you should receive an activation email from Redis. Select **Activate account** to go to the **Get Started** page in the [Redis Cloud console](https://cloud.redis.io).

    {{<image filename="images/rc/quickstart-get-started.png" width="75%" alt="Dialog to create your free database." >}}

    1. Choose your role from the **Role** drop-down.
    1. Choose your company size from the **myself/company** drop-down. If you are working on a personal project, select **myself**.
    1. Select your Redis use case from the **use case** drop-down.
     1. Choose your client language from the **client** drop-down.

    Click **Create Free Database** to move on.

1. Select your preferred cloud vendor and region.

   {{<image filename="images/rc/quickstart-create-free-database.png" width="75%" alt="Dialog to create your free database." >}}

1. Select **Let's start free** to create your database.

    {{< note >}}
If you would rather customize your database, select **Create a custom database** to go to the **New database** page. From there, you can [Create a database]({{< relref "/operate/rc/databases/create-database" >}}).
    {{< /note >}}

    The **Database list** appears with your new database in the list.

    {{<image filename="images/rc/quickstart-database-list.png" width="75%" alt="The database list showing your new Database." >}}

1.  Select the database name to view the **Configuration** tab for your new database.

    {{<image filename="images/rc/quickstart-database-overview.png" width="75%" alt="Configuration tab showing details of your new database." >}}

1.  In the upper corner, an icon shows the current status of the database.  If the icon shows an orange clock, this means your database is still being created and its status is _pending_.

       {{< image filename="/images/rc/icon-database-update-status-pending.png#no-click" alt="Pending database status" >}} &nbsp; {{< image filename="/images/rc/icon-database-update-status-active.png#no-click" alt="Active database status" >}}

       Once the database has been created, it becomes _active_ and the status indicator switches to a green circle containing a checkmark.  

    Redis Cloud console operations are asynchronous; they operate [in the background]({{< relref "/operate/rc/api/get-started/process-lifecycle.md" >}}).  You can continue to use the Redis Cloud console for other tasks, but pending resources aren't available until they're active.

    When your new database becomes active, you're ready to connect to it.

## Connect to a database

At this point, you're viewing the **Configuration** details for your new database. Go to the **Security** section of the page.

To connect to your database, you need your username and password. Each database is protected by a **Default user** called `default` and a masked **Default user password**. Select the eye icon to show or hide the password.    

{{<image filename="images/rc/database-fixed-configuration-security.png" width="75%" alt="The Security section of the Configuration tab of the database details page." >}}

Once you have the username and password, select **Connect** to open the connection wizard.

{{< image filename="/images/rc/connection-wizard-button.png#no-click" alt="Connect button." >}}

The connection wizard provides the following database connection methods:

- [Redis Insight](#using-redisinsight)

- [`redis-cli`](#using-rediscli) utility

- [Redis client](#using-redis-client) for your preferred programming language


{{<image filename="images/rc/connection-wizard.png" alt="The connection wizard." >}}

### Redis Insight{#using-redisinsight}

[Redis Insight]({{< relref "/develop/tools/insight" >}}) is a free Redis GUI that is available for macOS, Windows, and Linux.

1. In the connection wizard, under **Redis Insight**, select **Download** to download Redis Insight.

1. [Install Redis Insight]({{< relref "/develop/tools/insight" >}}).

1. Once installed, select **Open with Redis Insight**.

1. A pop-up asks if you wish to open the link with Redis Insight. Select **Open Redis Insight** to connect to your database with Redis Insight.


See the [Redis Insight docs]({{< relref "/develop/tools/insight" >}}) for more info.

### Redis client{#using-redis-client}

A Redis client is a software library or tool that enables applications to interact with a Redis server. Each client has its own syntax and installation process. For help with a specific client, see the client's documentation.

The connection wizard provides code snippets to connect to your database with the following programming languages:

- .NET using [NRedisStack]({{< relref "/develop/clients/dotnet" >}})
- node.js using [node-redis]({{< relref "/develop/clients/nodejs" >}})
- Python using [redis-py]({{< relref "/develop/clients/redis-py" >}})
- Java using [Jedis]({{< relref "/develop/clients/jedis" >}}) and [Lettuce]({{< relref "/develop/clients/lettuce" >}})
- Go using [go-redis]({{< relref "/develop/clients/go" >}})
- PHP using [Predis]({{< relref "/develop/clients/php" >}})

{{<image filename="images/rc/connection-wizard-clients.png" alt="The connection wizard clients." >}}

See [Clients]({{< relref "/develop/clients" >}}) to learn how to connect with the official Redis clients.

### redis-cli {#using-rediscli}

The [`redis-cli`]({{< relref "/develop/tools/cli" >}}) utility is installed when you install Redis.  It provides a command-line interface that lets you work with your database using core [Redis commands]({{< relref "/commands" >}}).

To run `redis-cli`, [install Redis Stack]({{< relref "/operate/oss_and_stack/install/install-stack/" >}}) on your machine.

See [Redis CLI]({{< relref "/develop/tools/cli" >}}) to learn how to use `redis-cli`.

## More info

- [Connect your application]({{< relref "/develop/clients" >}})
- [Import data]({{< relref "/operate/rc/databases/import-data.md" >}})
- [Manage databases]({{< relref "/operate/rc/databases" >}})
- [Data persistence]({{< relref "/operate/rc/databases/configuration/data-persistence.md" >}})
- [Secure your Redis Cloud database]({{< relref "/operate/rc/security/" >}})
- [Back-up databases]({{< relref "/operate/rc/databases/back-up-data.md" >}})
- [Monitor Redis Cloud performance]({{< relref "/operate/rc/databases/monitor-performance.md" >}})
