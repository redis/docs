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

1. After you enter your information, you should receive an activation email from Redis. Select **Activate account** to go to the **Create your database** page in the [Redis Cloud console](https://cloud.redis.io).

1. You'll go to the [create database]({{< relref "/operate/rc/databases/create-database" >}}) page with the **Free** plan selected.

    {{<image filename="images/rc/create-database-subscription-free.png" alt="The Subscription selection panel with Free selected.">}}

    {{< note >}}
If you want to create a different type of database, see the following guides:
- [Create a Redis Flex database]({{< relref "/operate/rc/databases/create-database/create-flex-database" >}})
- [Create an Essentials database]({{< relref "/operate/rc/databases/create-database/create-essentials-database" >}})
- [Create a Pro database]({{< relref "/operate/rc/databases/create-database/create-pro-database-new" >}})
    {{</note>}}

1. Redis will generate a database name for you. If you want to change it, you can do so in the **Database name** field. 

    {{<image filename="images/rc/create-database-free-settings.png" alt="The database name, cloud vendor, and region settings.">}}

1. Select the **Database version** you want to use.

1. Choose your **Cloud vendor** and **Region**. You can choose between **Amazon Web Services (AWS)**, **Google Cloud**, and **Microsoft Azure** for the Cloud Vendor. 

    See [Supported regions]({{< relref "/operate/rc/supported-regions" >}}) for a list of supported regions by cloud vendor.

1. Select **Create database**.

    {{<image filename="images/rc/button-create-db.png" width="140px" alt="Select the Create database button to create your new database." >}}

    When you create your database, there's a brief pause while your request is processed and then the **Database details** page appears.

1.  In the upper corner, an icon shows the current status of the database.  If the icon shows an orange clock, this means your database is still being created and its status is _pending_.

    {{< image filename="/images/rc/icon-database-update-status-pending.png#no-click" alt="Pending database status" class="inline" width="30px" >}} {{< image filename="/images/rc/icon-database-status-active.png#no-click" alt="Active database status" class="inline" width="30px">}}</nobr>

    Once the database has been created, it becomes _active_ and the status indicator switches to a green circle containing a checkmark.  

    When your new database becomes active, you're ready to connect to it.

## Connect to a database

At this point, you're viewing the **Configuration** details for your new database. Go to the **Security** section of the page.

To connect to your database, you need your username and password. Each database is protected by a **Default user** called `default` and a masked **Default user password**. Select the eye icon to show or hide the password.    

{{<image filename="images/rc/database-fixed-configuration-security.png" width="75%" alt="The Security section of the Configuration tab of the database details page." >}}

Once you have the username and password, select **Connect** to open the connection wizard.

{{< image filename="/images/rc/button-connect.png#no-click" alt="Connect button." >}}

The connection wizard provides the following database connection methods:

- [Redis Insight](#using-redisinsight)

- [`redis-cli`](#using-rediscli) utility

- [Redis client](#using-redis-client) for your preferred programming language


{{<image filename="images/rc/connection-wizard.png" alt="The connection wizard." width=500px >}}

### Redis Insight{#using-redisinsight}

[Redis Insight]({{< relref "/develop/tools/insight" >}}) is a free Redis GUI that lets you visualize your Redis data and learn more about Redis.

You can connect to your database with Redis Insight in two ways:

1. [Open your database in Redis Insight in your browser](#ri-browser).

1. [Download and Install Redis Insight](#ri-app) on Windows, macOS, and Linux.

#### Open in your browser {#ri-browser}

{{< note >}}
Opening your database with Redis Insight in your browser is only available for Essentials databases. For all other databases, [Download and install Redis Insight](#ri-app) on your computer.
{{< /note >}}

Select **Launch Redis Insight web** from the connection wizard to open it.

{{<image filename="images/rc/rc-ri-wizard-launch.png" alt="Launch Redis Insight web from the Connection Wizard." width=500px >}}

You can also select **Launch** from the database page under **View and manage data with Redis Insight** to open Redis Insight in your browser.

{{<image filename="images/rc/rc-ri-open.png" alt="Launch Redis Insight web from the database page." width=500px >}}

Redis Insight will open in a new tab. 

From there, you can:

- Select **Load sample data** to add sample data into your database.
    {{<image filename="images/rc/rc-ri-load-data.png" alt="Load Sample Data button" width=300px >}}
- Select **Insights** to learn how to use Redis.
    {{<image filename="images/rc/rc-ri-explore-icon.png" alt="The Insights icon" >}}

For more information on how to use Redis Insight in your browser, see [Open with Redis Insight on Redis Cloud]({{< relref "/operate/rc/databases/connect/insight-cloud" >}}).

#### Install and open on your computer {#ri-app}

1. In the connection wizard, under **Redis Insight**, select **Download** to download Redis Insight.

1. [Install Redis Insight]({{< relref "/develop/tools/insight" >}}).

1. Once installed, select **Open in desktop**.

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

{{<image filename="images/rc/connection-wizard-clients.png" alt="The connection wizard clients." width=500px >}}

See [Clients]({{< relref "/develop/clients" >}}) to learn how to connect with the official Redis clients.

See the following guides to get started with different Redis use cases:
- [Data structure store]({{< relref "/develop/get-started/data-store" >}})
- [Document database]({{< relref "/develop/get-started/document-database" >}})
- [Vector database]({{< relref "/develop/get-started/vector-database" >}})
- [RAG with Redis]({{< relref "/develop/get-started/rag" >}})
- [Redis for AI]({{< relref "/develop/ai" >}})

### redis-cli {#using-rediscli}

The [`redis-cli`]({{< relref "/develop/tools/cli" >}}) utility is installed when you install Redis.  It provides a command-line interface that lets you work with your database using core [Redis commands]({{< relref "/commands" >}}).

To run `redis-cli`, [install Redis]({{< relref "/operate/oss_and_stack/install/install-stack/" >}}) on your machine.

See [Redis CLI]({{< relref "/develop/tools/cli" >}}) to learn how to use `redis-cli`.

## More info

- [Connect your application]({{< relref "/develop/clients" >}})
- [Import data]({{< relref "/operate/rc/databases/import-data.md" >}})
- [Manage databases]({{< relref "/operate/rc/databases" >}})
- [Data persistence]({{< relref "/operate/rc/databases/configuration/data-persistence.md" >}})
- [Secure your Redis Cloud database]({{< relref "/operate/rc/security/" >}})
- [Back-up databases]({{< relref "/operate/rc/databases/back-up-data.md" >}})
- [Monitor Redis Cloud performance]({{< relref "/operate/rc/databases/monitor-performance.md" >}})

## Continue learning with Redis University

{{< university-links >}}
