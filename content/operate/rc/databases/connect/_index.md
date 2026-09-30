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

After you [create your database](/content/operate/rc/databases/create-database/_index.md), you can connect to it using the public or private endpoint.

## Get connection information

To connect to the database, you need the following information:
- The database endpoint
- Your database username and password

### Database endpoints

The database endpoints are listed in the **Configuration** tab for your database: in the **Access** section for Essentials databases, or the **General** section for Pro databases.

{{<image filename="images/rc/databases-configuration-general-endpoints.png" alt="The General section of the Configuration tab of the Pro database details page." >}}

{{<image filename="images/rc/database-details-configuration-tab-access-essentials.png" alt="The Access section for an Essentials database." width=50%" >}}

Redis Cloud Pro and Redis Cloud Essentials databases have a public endpoint, which you can access from the public internet. Redis Cloud Pro databases also have a private endpoint. You can connect to the private endpoint from a private network. Before you can connect to the private endpoint, you must set up a private connectivity method, such as:
- [VPC peering](/content/operate/rc/security/vpc-peering.md)
- [Google Cloud Private Service Connect](/content/operate/rc/security/private-service-connect.md) (Google Cloud only)
- [AWS Transit Gateway](/content/operate/rc/security/aws-transit-gateway.md) or [AWS PrivateLink](/content/operate/rc/security/aws-privatelink.md) (AWS only)

Redis Cloud Pro users can block the public endpoint for their databases. For more information, see [Block public endpoints](/content/operate/rc/security/database-security/block-public-endpoints.md).

#### Static and dynamic endpoints

{{< embed-md "rc-endpoint-description.md" >}}

You can redirect the dynamic endpoints to a different database at any time, but you cannot redirect the static endpoints. We recommend using the dynamic endpoints for your application so that you can migrate your database endpoints to a different database in the future without any code changes. See [Redirect dynamic endpoints](/content/operate/rc/databases/redirect-endpoints.md) for more information.

### Database username and password

By default, your database is protected by a [**Default user**](/content/operate/rc/security/access-control/data-access-control/default-user.md) with the username `default` and a masked **Default user password**. For Essentials databases, select **Default user > Configure** and then select the eye icon to view your password. 

For Pro databases, you can see the default user password in the **Security** section of the **Configuration** details for your database. Select the eye icon to show or hide the password.    

If you've turned on [Role-based access control](/content/operate/rc/security/access-control/data-access-control/role-based-access-control.md) for your database and [turned off the default User](/content/operate/rc/security/access-control/data-access-control/default-user.md#turn-off-default-user), use the username and password for your data access role.

## Connect to your database with connection wizard

Select **Connect** to open the connection wizard.

{{< image filename="/images/rc/button-connect.png#no-click" alt="Connect button." >}}

> [!NOTE]
> For [Active-Active databases](/content/operate/rc/databases/active-active/_index.md), you connect to one of the database instances. Choose the region you want to connect to from the region selection to access the connection information for that instance.

The connection wizard provides the following database connection methods:

- [Redis Insight](#using-redisinsight)

- [`redis-cli`](#using-rediscli) utility

- [Redis client](#using-redis-client) for your preferred programming language

{{<image filename="images/rc/connection-wizard.png" alt="The connection wizard." width=500px >}}

### Redis Insight {#using-redisinsight}

[Redis Insight](/content/develop/tools/insight/_index.md) is a free Redis GUI that lets you visualize your Redis data and learn more about Redis.

You can connect to your database with Redis Insight in two ways:

1. [Open your database in Redis Insight in your browser](#ri-browser).

1. [Download and Install Redis Insight](#ri-app) on Windows, macOS, and Linux.

#### Open in your browser {#ri-browser}

> [!NOTE]
> Opening your database with Redis Insight in your browser is only available for Essentials databases. For all other databases, [Download and install Redis Insight](#ri-app) on your computer.

If Redis Insight on Redis Cloud is available for your database, select **Launch Redis Insight web** from the connection wizard to open it.

{{<image filename="images/rc/rc-ri-wizard-launch.png" alt="Launch Redis Insight web from the Connection Wizard." width=500px >}}

You can also select **Launch** from the database page under **View and manage data with Redis Insight** to open Redis Insight in your browser.

{{<image filename="images/rc/rc-ri-open.png" alt="Launch Redis Insight web from the database page." width=500px >}}

Redis Insight will open in a new tab. 

This browser-based version of Redis Insight has a subset of the features of Redis Insight. For more information, see [Open with Redis Insight on Redis Cloud](/content/operate/rc/databases/connect/insight-cloud.md).

#### Install and open on your computer {#ri-app}

1. If you haven't downloaded Redis Insight, select **Download** under **Redis Insight** in the Connection wizard to download it. 

1. [Install Redis Insight](/content/develop/tools/insight/_index.md).

1. Once installed, select **Open with Redis Insight**.

1. A pop-up asks if you wish to open the link with Redis Insight. Select **Open Redis Insight** to connect to your database with Redis Insight.

If you get an error when connecting with Redis Insight, [manually connect to your database](/content/develop/tools/insight/_index.md) from Redis Insight.

You can use Redis Insight to view your data, run Redis commands, and analyze database performance. See the [Redis Insight docs](/content/develop/tools/insight/_index.md) for more info.

### Redis client {#using-redis-client}

A Redis client is a software library or tool that enables applications to interact with a Redis server. Each client has its own syntax and installation process. For help with a specific client, see the client's documentation.

The connection wizard provides code snippets to connect to your database with the following programming languages:

- .NET using [StackExchange.Redis/NRedisStack](/content/develop/clients/dotnet/_index.md)
- node.js using [node-redis](/content/develop/clients/nodejs/_index.md)
- Python using [redis-py](/content/develop/clients/redis-py/_index.md)
- Java using [Jedis](/content/develop/clients/jedis/_index.md) and [Lettuce](/content/develop/clients/lettuce/_index.md)
- Go using [go-redis](/content/develop/clients/go/_index.md)
- PHP using [Predis](/content/develop/clients/php/_index.md)

{{<image filename="images/rc/connection-wizard-clients.png" alt="The connection wizard clients." width=500px >}}

If the username and password are not already filled in, replace `<username>` and `<password>` with your username and password.

See [Clients](/content/develop/clients/_index.md) to learn how to connect with the official Redis clients.

> [!NOTE]
> We recommend using the [dynamic endpoints](#static-and-dynamic-endpoints) for your application so that you can migrate your database endpoints to a different database in the future without any code changes.  See [Redirect dynamic endpoints](/content/operate/rc/databases/redirect-endpoints.md) for more information.

#### redis-cli {#using-rediscli}

The [`redis-cli`](/content/develop/tools/cli.md) utility is installed when you install Redis.  It provides a command-line interface that lets you work with your database using core [Redis commands](/content/commands).

To run `redis-cli`, [install Redis](/content/operate/oss_and_stack/install/install-stack/_index.md) on your machine. After it's installed, copy the `redis-cli` command under **Redis CLI** in the connection wizard and enter it into your terminal. If the username and password are not already filled in, replace `<username>` and `<password>` with your username and password.

If you only need the Redis CLI (`redis-cli`) and not the full Redis Open Source distribution, you can [install the standalone `redis-cli` binary](/content/operate/oss_and_stack/install/install-stack/install-redis-cli.md) on Linux or macOS.

See [Redis CLI](/content/develop/tools/cli.md) to learn how to use `redis-cli`.

## More info

- [Connect your application](/content/develop/clients/_index.md)
- [Connect with TLS](/content/operate/rc/security/database-security/tls-ssl.md#connect-over-tls)
- [Default user](/content/operate/rc/security/access-control/data-access-control/default-user.md)
- [Role-based access control](/content/operate/rc/security/access-control/data-access-control/role-based-access-control.md)