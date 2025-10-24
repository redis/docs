---
Title: Enable a module for a database
alwaysopen: false
categories:
- docs
- operate
- stack
description: null
linkTitle: Enable for a database
toc: 'true'
weight: 30
---

Modules add additional functionality to Redis databases for specific use cases. You can enable modules when you create a database.

## Automatically enabled capabilities in Redis 8

Databases created with or upgraded to Redis version 8 or later automatically enable the capabilities (modules) bundled with Redis Enterprise Software as follows:

{{<embed-md "rs-8-enabled-modules.md">}}

## Create a database with a module

You can only add modules to a database when you first create it. You cannot add modules to an existing database.

### Prerequisites

- [Installed the module on the cluster]({{< relref "/operate/oss_and_stack/stack-with-enterprise/install/add-module-to-cluster" >}})
- [Upgraded the module]({{< relref "/operate/oss_and_stack/stack-with-enterprise/install/upgrade-module" >}}) to the latest version

### Create a database and enable capabilities

In the Redis Enterprise Cluster Manager UI, follow these steps to add modules to a database:

1. From the **Databases** screen, select **Quick database** or **Create database**.

1. In the **Capabilities** section, select one or more capabilities:

    {{<image filename="images/rs/screenshots/databases/quick-db-capabilities-7-8-2.png" alt="Select which capabilities to add to your database.">}}

    {{<note>}}
You cannot use RediSearch 1.x and RediSearch 2.x in the same database.
    {{</note>}}

1. To use custom configuration for capabilities:

    1. Select **Parameters**.
    
    1. Enter the [configuration options](#module-configuration-options).
    
    1. Select **Done**.

1. Configure additional database settings.

    {{<note>}}
Depending on the [features supported by an enabled module]({{< relref "/operate/oss_and_stack/stack-with-enterprise/enterprise-capabilities#module-feature-support" >}}), certain database configuration fields may not be available.
    {{</note>}}

1. Select **Create**.

## Module configuration options

- [RediSearch configuration options]({{< relref "/operate/oss_and_stack/stack-with-enterprise/search/config" >}})

- [RedisTimeSeries configuration options]({{< relref "/operate/oss_and_stack/stack-with-enterprise/timeseries/config" >}})

- [RedisBloom configuration options]({{< relref "/operate/oss_and_stack/stack-with-enterprise/bloom/config" >}})