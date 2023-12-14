---
Title: Create a database
alwaysopen: false
categories:
- docs
- operate
- rc
description: null
linkTitle: Create database
weight: 10
---
Before creating a Redis Cloud database, you need to [create an account]({{< relref "/operate/rc/rc-quickstart.md" >}}) and [create a subscription]({{< relref "/operate/rc/subscriptions#common-tasks" >}}).

To create a database in your Redis Cloud [subscription]({{< relref "/operate/rc/subscriptions/" >}}):

1. Sign in to the [Redis Cloud console](https://app.redislabs.com).

2. If you have more than one subscription, select the target subscription from the list.  This displays the **Databases** tab for the selected subscription.

    {{<image filename="images/rc/subscription-flexible-databases-tab-update.png" alt="The Databases tab summarizes databases created for a given subscription." >}}{{< /image >}}

3. Select the **New database** button.

    {{<image filename="images/rc/button-database-new.png" alt="The New Database button creates a new database for your subscription." width="120px">}}{{< /image >}}

This displays the **New database** screen, which varies according to your subscription plan.

{{<image filename="images/rc/database-new-flexible.png" alt="Use the New Database screen to create a new database for your subscription." >}}{{< /image >}}

The **New database** screen is divided into sections, each dedicated to a specific category of settings.  Note that not every section or setting is available to every [subscription plan]({{< relref "/operate/rc/subscriptions/" >}}).

When you've configured your new database, use the **Activate database** button to create and activate it.

{{<image filename="images/rc/button-database-activate.png" alt="Use the Activate database button to create and activate your database." width="150px">}}{{< /image >}}

## General section

The **General** section defines basic properties about your database.

The available settings vary according to your subscription plan:

| Setting name              | Description                                                                                                                                                                                                                                                                                                       |
|:--------------------------|:------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Subscription**          | Read-only description of your subscription plan, including cloud provider and region                                                                                                                                                                                                                              |
| **Active-Active Redis**   | Checked when the subscription supports Active-Active databases (_coming soon; Flexible or Annual subscriptions only_)                                                                                                                                                                                             |
| **Auto Tiering**          | Checked when the subscription supports Auto Tiering (_Flexible or Annual subscriptions only_)                                                                                                                                                                                                                     |
| **Database name**         | A name for your database (_required_)                                                                                                                                                                                                                                                                             |
| **Database port**         | Automatically or manually assigns a database port (range: 10000-19999) (_Flexible or Annual subscriptions only_)                                                                                                                                                                                                  |
| **Type**                  | Controls advanced database capabilities and protocol.  Supported values include _[Redis Stack](https://redis.io/docs/stack/)_ (available only for Fixed and Free), _Redis_ (default for Flexible and Annual subscriptions), and _Memcached_                                                                       |
| **Advanced capabilities** | Extend core Redis functionality using [advanced capabilities]({{< relref "/operate/oss_and_stack/stack-with-enterprise" >}}).  Redis Cloud supports selected advanced capabilities; for details, see [Redis Enterprise and Redis Stack feature compatibility]({{< relref "/operate/oss_and_stack/stack-with-enterprise/enterprise-capabilities#redis-enterprise-module-support" >}})   |
| **Supported Protocol(s)** | Choose between RESP2 and RESP3 _(Redis 7.2 only)_. See [Redis serialization protocol](https://redis.io/docs/reference/protocol-spec/#resp-versions) for details                                                                                                                                                   |

### Database port

All subscriptions automatically assign a database port by default.

Flexible (and Annual) subscriptions let you choose between two options:

- **Auto assign** automatically assigns a port number during database creation.
- **Manually assign** lets you enter a custom port number between 10000 and 19999. You cannot assign a port that is reserved or already in use.

### Advanced capabilities {#modules}

Advanced capabilities extend Redis database functionality by adding new data types and options.  

Available options depend on your subscription and your database **Type**.

#### Fixed (and Free) advanced capability options {#fixed-and-free-module-options}

Fixed and Free subscriptions support [Redis Stack](https://redis.io/docs/stack/), which enables the most frequently used capabilities.

{{<image filename="images/rc/new-database-general-type-free-stack.png" alt="For Fixed and Free subscriptions, the Type setting in the General section includes an option for Redis Stack." width="75%">}}{{< /image >}}

When the database **Type** is set to _Redis Stack_, the Advanced capabilities section of the database details page displays the advanced capabilities included with the database and their versions.

{{<image filename="images/rc/database-details-modules-stack-free.png" alt="For Fixed and Free subscriptions, the Database details page lists the capabilities and versions added by Redis Stack." width="75%">}}{{< /image >}}

Redis Cloud is updated on a regular basis, which includes the advanced capabilities supported by the service. Versions displayed by the admin console may vary from those shown above.  For the latest details of any capability, see [Redis Stack and Redis Enterprise]({{< relref "/operate/oss_and_stack/stack-with-enterprise" >}}). 

Redis Stack is available only for Fixed and Free subscriptions.

#### Flexible and Annual advanced capability options {#flexible-and-annual-module-options}

Flexible and Annual subscriptions let you choose advanced capabilities for each database.

{{<image filename="images/rc/database-details-redis-module-select-flexible.png" alt="For Flexible and Annual subscriptions, you can select the capabilites included in your database." width="75%">}}{{< /image >}}

You can select more than one advanced capability for a database, though there are limits:

- The following advanced capabilities can be combined in Flexible and Annual subscriptions:

    - Search and query
    - JSON
    - Time series
    - Probabilistic

- Graph cannot be combined with other capabilities.

You don't have to combine capabilities.  To remove a selected capability, either clear the checkbox in the menu or select its **Delete** icon.  

<nobr>{{<image filename="images/rc/icon-checkbox-clear.png" alt="To remove a selected capability, clear the checkbox in the menu." width="30px">}}{{< /image >}}&nbsp;{{<image filename="images/rc/icon-module-delete.png" alt="You can also use the delete icon to remove a capability." width="30px">}}{{< /image >}}</nobr>

To learn more, see [Redis Stack](https://redis.io/docs/stack/) and [Redis Stack and Redis Enterprise]({{< relref "/operate/oss_and_stack/stack-with-enterprise" >}}).

## Scalability section

The **Scalability** section lets you manage the maximum size, throughput, and hashing policy for a database.

{{<image filename="images/rc/database-new-flexible-scalability.png" alt="Use the Scalability section to control the size, throughput, and hashing policy for a database." >}}{{< /image >}}

The **Scalability** section is available only for Flexible and Annual plans.

| Setting name        | Description                                                                                                                                                                                                                                                                                                                                   |
|:--------------------|:----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Memory limit**    | Maximum size (in GB) for your database                                                                                                                                                                                                                                                                                                        |
| **Throughput**      | Defines throughput in terms of maximum operations per second for the database <br/><br/>Databases with search and query enabled use the number of shards to determine throughput. To determine how many shards you need for your database, use the [sizing calculator](https://redis.com/modules/redis-search/redisearch-sizing-calculator/). |
| **Hashing policy**  | Defines the [hashing policy]({{< relref "/operate/rs/databases/durability-ha/clustering#supported-hashing-policies" >}})                                                                                                                                                                                                                              |
| **OSS Cluster API** | Enables the [OSS Cluster API]({{< relref "/operate/rs/databases/configure/oss-cluster-api.md" >}}) for a database<br/><br/>When this option is enabled, you cannot define a custom hashing policy                                                                                                                                                     |

To learn more about these settings and when to use them, see [Database clustering]({{< relref "/operate/rs/databases/durability-ha/clustering.md" >}}).

### Memory limit

Memory limit represents the maximum amount of memory for the database, which includes data values, keys, module data, and overhead for specific features.  High availability features, such as replication and Active-Active, dramatically increase memory consumption.  

Here are some general guidelines:

- Memory limit represents an upper limit.  You cannot store more data than the memory limit.  Depending on your other selections, available memory for data may be much less than expected.

- Replication doubles memory consumption; that is, 512MB of data requires at least 1GB of memory limit when replication is enabled.

- Active-Active also doubles memory consumption and the effect is cumulative with replication's impact. Since Active-Active requires replication to be turned on, the memory limit impact can be as large as four times (4x) the original data size.

- Advanced capabilities also consume memory.

Memory limits in Redis Cloud are subject to the same considerations as Redis Enterprise Software; to learn more, see [Database memory limits]({{< relref "/operate/rs/databases/memory-performance/memory-limit.md" >}})

## Durability section

The **Durability** section helps you keep your database (and your data) available when problems occur.

{{<image filename="images/rc/database-new-flexible-durability.png" alt="Use the Durability settings to keep your database (and data) available when problems occur." >}}{{< /image >}}


| Setting name             | Description                                                                                                                                                                |
|:-------------------------|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **High availability**    | Replicates your data across multiple nodes, as allowed by your subscription plan                                                                                           |
| **Data persistence**     | Defines whether (and how) data is saved to disk; [available options]({{< relref "/operate/rc/databases/configuration/data-persistence.md" >}}) depend on your plan type            |
| **Data eviction policy** | Configures which [policy]({{< relref "/operate/rc/databases/configuration/data-eviction-policies.md" >}}) is applied when your database reaches its memory limit              |
| **Remote backup**        | (_paid Fixed, Flexible, or Annual subscriptions only_) When enabled, identifies a location and interval for [data backups]({{< relref "/operate/rc/databases/back-up-data.md" >}}) |
| **Active-Passive Redis** | (_Flexible or Annual subscriptions only_) When enabled, identifies a path to the linked database                                                                           |

## Security section

The **Security** section helps you control access to your database.

{{<image filename="images/rc/database-new-flexible-security.png" alt="Use the Security settings to control access to your database." >}}{{< /image >}}


| Setting name                       | Description                                                                                                                                                                           |
|:-----------------------------------|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Default user**                   | When enabled, permits access using a simple password                                                                                                                                  |
| **Redis password**                 | Password assigned to the database when created                                                                                                                                        |  
| **CIDR allow list**                | (_paid Fixed, Flexible, or Annual subscriptions only_) [Allow list]({{< relref "/operate/rc/security/cidr-whitelist.md" >}}) of IP addresses/security groups permitted to access the database |
| **Transport layer security (TLS)** | (_Flexible or Annual subscriptions only_) Enables [transport security layer]({{< relref "/operate/rc/security/database-security/tls-ssl.md" >}})(TLS) encryption for database access          |


## Alerts section

The **Alerts** section defines notification emails sent to your account and the conditions that trigger them.

{{<image filename="images/rc/database-new-flexible-alerts.png" alt="The Alerts section defines the notification emails and their triggering conditions." >}}{{< /image >}}

The available alerts vary according to the subscription type.

|Setting name| Description                                                                                                                                              |
|:-----------|:---------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Dataset size has reached** | When enabled, sends an an email when the database reaches the defined memory limit _(Flexible, or Annual plans only_)                                    |
| **Latency is higher than** | When enabled, sends an an email when the latency exceeds the defined limit _(paid Fixed, Flexible or Annual plans only_)                                 |
| **Number of connections** | When enabled, sends an email when the connections exceeds the defined limit.  _(Free and Fixed plans only)_                                              |
| **Replica Of - database unable to sync with source** | When enabled, sends email when the replica database cannot sync with the primary (source) database _(Flexible or Annual plans only_)                     |
| **Replica Of - sync lag is higher than** | When enabled, sends email when the sync lag exceeds the defined threshold _(Flexible or Annual plans only_)                                              |
| **Throughput is higher than** | When enabled, sends an email when the operations per second exceed the defined threshold _(paid Fixed, Flexible, or Annual plans only_)                  |
| **Throughput is lower than** | When enabled, sends an email when the operations per second falls below the defined threshold _(paid Fixed, Flexible, or Annual plans only_)             |
| **Total size of datasets under this plan reached** | When enabled, sends an an email when the combined total size of databases in the subscription reaches the defined memory limit _(paid Fixed plans only_) |
