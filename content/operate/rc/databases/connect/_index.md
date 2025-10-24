---
Title: Connect to a Redis Cloud database
alwaysopen: false
categories:
- docs
- operate
- rc
description: null
hideListLinks: true
linkTitle: Connect
weight: 12
---

After you [create your database]({{< relref "/operate/rc/databases/create-database" >}}), you can connect to it.

To connect to the database, you need your username and password. By default, your database is protected by a [**Default user**]({{< relref "/operate/rc/security/access-control/data-access-control/default-user" >}}) called `default` and a masked **Default user password**. You can see the default user password in the **Security** section of the **Configuration** details for your database. Select the eye icon to show or hide the password.    

{{<image filename="images/rc/database-fixed-configuration-security.png" width="75%" alt="The Security section of the Configuration tab of the database details page." >}}

If you've turned on [Role-based access control]({{< relref "/operate/rc/security/access-control/data-access-control/role-based-access-control" >}}) for your database and [turned off the default User]({{< relref "/operate/rc/security/access-control/data-access-control/default-user#turn-off-default-user" >}}), use the username and password for your data access role.

Once you have the username and password, select **Connect** to open the connection wizard.

{{< image filename="/images/rc/button-connect.png#no-click" alt="Connect button." >}}

The connection wizard provides the following database connection methods:

- [Redis Insight](#using-redisinsight)

- [`redis-cli`](#using-rediscli) utility

- [Redis client](#using-redis-client) for your preferred programming language

{{<image filename="images/rc/connection-wizard.png" alt="The connection wizard." width=500px >}}

## Redis Insight {#using-redisinsight}

[Redis Insight]({{< relref "/develop/tools/insight" >}}) is a free Redis GUI that lets you visualize your Redis data and learn more about Redis.

You can connect to your database with Redis Insight in two ways:

1. [Open your database in Redis Insight in your browser](#ri-browser).

1. [Download and Install Redis Insight](#ri-app) on Windows, macOS, and Linux.

### Open in your browser {#ri-browser}

{{< note >}}
Opening your database with Redis Insight in your browser is only available for Essentials databases. For all other databases, [Download and install Redis Insight](#ri-app) on your computer.
{{< /note >}}

If Redis Insight on Redis Cloud is available for your database, select **Launch Redis Insight web** from the connection wizard to open it.

{{<image filename="images/rc/rc-ri-wizard-launch.png" alt="Launch Redis Insight web from the Connection Wizard." width=500px >}}

You can also select **Launch** from the database page under **View and manage data with Redis Insight** to open Redis Insight in your browser.

{{<image filename="images/rc/rc-ri-open.png" alt="Launch Redis Insight web from the database page." width=500px >}}

Redis Insight will open in a new tab. 

This browser-based version of Redis Insight has a subset of the features of Redis Insight. For more information, see [Open with Redis Insight on Redis Cloud]({{< relref "/operate/rc/databases/connect/insight-cloud" >}}).

### Install and open on your computer {#ri-app}

1. If you haven't downloaded Redis Insight, select **Download** under **Redis Insight** in the Connection wizard to download it. 

1. [Install Redis Insight]({{< relref "/develop/tools/insight" >}}).

1. Once installed, select **Open with Redis Insight**.

1. A pop-up asks if you wish to open the link with Redis Insight. Select **Open Redis Insight** to connect to your database with Redis Insight.

If you get an error when connecting with Redis Insight, [manually connect to your database]({{< relref "/develop/tools/insight" >}}) from Redis Insight.

You can use Redis Insight to view your data, run Redis commands, and analyze database performance. See the [Redis Insight docs]({{< relref "/develop/tools/insight" >}}) for more info.

## Redis client {#using-redis-client}

A Redis client is a software library or tool that enables applications to interact with a Redis server. Each client has its own syntax and installation process. For help with a specific client, see the client's documentation.

The connection wizard provides code snippets to connect to your database with the following programming languages:

- .NET using [NRedisStack]({{< relref "/develop/clients/dotnet" >}})
- node.js using [node-redis]({{< relref "/develop/clients/nodejs" >}})
- Python using [redis-py]({{< relref "/develop/clients/redis-py" >}})
- Java using [Jedis]({{< relref "/develop/clients/jedis" >}}) and [Lettuce]({{< relref "/develop/clients/lettuce" >}})
- Go using [go-redis]({{< relref "/develop/clients/go" >}})
- PHP using [Predis]({{< relref "/develop/clients/php" >}})

{{<image filename="images/rc/connection-wizard-clients.png" alt="The connection wizard clients." width=500px >}}

If the username and password are not already filled in, replace `<username>` and `<password>` with your username and password.

See [Clients]({{< relref "/develop/clients" >}}) to learn how to connect with the official Redis clients.

### redis-cli {#using-rediscli}

The [`redis-cli`]({{< relref "/develop/tools/cli" >}}) utility is installed when you install Redis.  It provides a command-line interface that lets you work with your database using core [Redis commands]({{< relref "/commands" >}}).

To run `redis-cli`, [install Redis]({{< relref "/operate/oss_and_stack/install/install-stack/" >}}) on your machine. After it's installed, copy the `redis-cli` command under **Redis CLI** in the connection wizard and enter it into your terminal. If the username and password are not already filled in, replace `<username>` and `<password>` with your username and password.

See [Redis CLI]({{< relref "/develop/tools/cli" >}}) to learn how to use `redis-cli`.

## More info

- [Connect your application]({{< relref "/develop/clients" >}})
- [Connect with TLS]({{< relref "/operate/rc/security/database-security/tls-ssl#connect-over-tls" >}})
- [Default user]({{< relref "/operate/rc/security/access-control/data-access-control/default-user" >}})
- [Role-based access control]({{< relref "/operate/rc/security/access-control/data-access-control/role-based-access-control" >}})