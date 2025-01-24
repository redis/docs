---
Title: Create a Pro database in an existing subscription
alwaysopen: false
categories:
- docs
- operate
- rc
description: Shows how to create a Pro database in an existing subscription
linkTitle: Create Pro database (existing subscription)
weight: 15
tocEmbedHeaders: true
---

{{< embed-md "rc-create-db-first-steps.md" >}}

{{< embed-md "rc-create-db-use-cases.md" >}}

{{< note >}}See [Use case settings](#use-case-settings) to view the default settings for each use case.{{< /note >}}

4. Select the type of [subscription]({{< relref "/operate/rc/subscriptions" >}}) you need. For this guide, select **Pro**, select **Existing subscription**, and then select your existing pro subscription from the list.

    {{<image filename="images/rc/create-database-subscription-pro-existing.png" alt="The Subscription selection panel with Pro selected and an existing subscription selected.">}}

    {{< note >}}
This guide shows how to create a Pro database in an existing subscription.
- If you don't yet have a Pro subscription, see [Create a Pro database with a new subscription]({{< relref "/operate/rc/databases/create-database/create-pro-database-new" >}}).
- If you'd rather create an Essentials database, see [Create an Essentials database]({{< relref "/operate/rc/databases/create-database/create-essentials-database" >}}).
    {{< /note >}}

After you select **Pro** and select your existing subscription from the list, select **Continue** to go to the **New database** page. 

The **New database** page is divided into sections, each dedicated to a specific category of settings. The following sections provide more details.

When you've configured your new database, click the **Activate database** button to create and activate it.

{{<image filename="images/rc/button-database-activate.png" alt="Use the Activate database button to create and activate your database." width="150px">}}

## General section

The **General** section defines basic properties about your database.

{{<image filename="images/rc/database-new-flexible.png" alt="The general section of the New Database screen.">}}

The available settings vary according to your subscription plan:

| Setting name              | Description                                                                                                                                                                                                                                                                                                       |
|:--------------------------|:------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Subscription**          | Read-only description of your Pro subscription, including cloud provider and region                                                                                                                                                                                                                              |
| **Active-Active Redis**   | Checked when the subscription supports Active-Active databases                                                                                                                                                                                         |
| **Auto Tiering**          | Checked when the subscription supports Auto Tiering                                                                                                                                                                                     |
| **Database name**         | A name for your database (_required_)                                                                                                                                                                                                                                                                             |
| **Database port**         | Automatically or manually assigns a database port (range: 10000-19999).  You cannot assign a port that is reserved or already in use.                                                                                                                                                                                      |
| **Type**                  | Controls advanced database capabilities and protocol.  Supported values include _Redis_ and _Memcached_                                                                       |
| **Advanced capabilities** | Advanced data types used by the database. Choose from [Search and query]({{< relref "/operate/oss_and_stack/stack-with-enterprise/search" >}}), [JSON]({{< relref "/operate/oss_and_stack/stack-with-enterprise/json" >}}), [Time series]({{< relref "/operate/oss_and_stack/stack-with-enterprise/timeseries" >}}), or [Probabilistic]({{< relref "/operate/oss_and_stack/stack-with-enterprise/bloom" >}}). <br/> Databases with Search and query have specific sizing requirements, see [Search and query sizing]({{< relref "/operate/rc/databases/configuration/advanced-capabilities#search-and-query-sizing" >}}) for more information. |
| **Query performance factor** | *(Search and query databases on Redis 7.2 or later only)* Adds additional compute power to process your query and vector search workloads and boost your queries per second. See [Search and query sizing]({{< relref "/operate/rc/databases/configuration/advanced-capabilities#search-and-query-sizing" >}}) for more information. |
| **Supported Protocol(s)** | Choose between RESP2 and RESP3 _(Redis 7.2 only)_. See [Redis serialization protocol]({{< relref "/develop/reference/protocol-spec" >}}#resp-versions) for details                                                                                                                                                   |

## Performance section

The **Performance** section lets you manage the maximum size, throughput, and hashing policy for a database.

{{<image filename="images/rc/database-new-flexible-scalability.png" alt="Use the Performance section to control the size, throughput, and hashing policy for a database." >}}

| Setting name        | Description                                                                                                                                                                                                                                                                                                                                   |
|:--------------------|:----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Dataset size**    | Maximum size (in GB) for your dataset. See [Dataset size]({{< relref "/operate/rc/databases/configuration/sizing#dataset-size" >}}) for sizing considerations. <br/> Databases with Search and query have specific size requirements, see [Search and query sizing]({{< relref "/operate/rc/databases/configuration/advanced-capabilities#search-and-query-sizing" >}}) for more information. |
| **Throughput**      | Defines throughput in terms of maximum operations per second for the database. See [Throughput]({{< relref "/operate/rc/databases/configuration/sizing#throughput" >}}) for more info. <br/> Databases with Search and query have specific throughput requirements, see [Search and query sizing]({{< relref "/operate/rc/databases/configuration/advanced-capabilities#search-and-query-sizing" >}}) for more information. |
| **High availability**    | Replicates your data across multiple nodes, as allowed by your subscription plan. See [High availability]({{< relref "/operate/rc/databases/configuration/high-availability" >}}) for more info|
| **Hashing policy**  | Defines the [hashing policy]({{< relref "/operate/rc/databases/configuration/clustering#manage-the-hashing-policy" >}}).  |
| **OSS Cluster API** | Enables the [Cluster API]({{< relref "/operate/rc/databases/configuration/clustering#oss-cluster-api" >}}) for a database<br/><br/>When this option is enabled, you cannot define a custom hashing policy.  |

To learn more about these settings and when to use them, see [Database clustering]({{< relref "/operate/rc/databases/configuration/clustering" >}}).

## Durability section

The **Durability** section helps you keep your database (and your data) available when problems occur.

{{<image filename="images/rc/database-new-flexible-durability.png" alt="Use the Durability settings to keep your database (and data) available when problems occur." >}}


| Setting name             | Description                                                                                                                                                                |
|:-------------------------|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Data persistence**     | Defines whether (and how) data is saved to disk; [available options]({{< relref "/operate/rc/databases/configuration/data-persistence.md" >}}) depending on your plan type            |
| **Data eviction policy** | Configures which [policy]({{< relref "/operate/rc/databases/configuration/data-eviction-policies.md" >}}) is applied when your database reaches its memory limit              |
| **Remote backup**        | When enabled, identifies a location and interval for [data backups]({{< relref "/operate/rc/databases/back-up-data" >}}) |
| **Active-Passive Redis** | When enabled, identifies a path to the linked database. See [Migrate data]({{< relref "/operate/rc/databases/migrate-databases" >}}) for more information.           |

## Tags section

The **Tags** section lets you add [tags]({{< relref "/operate/rc/databases/tag-database" >}}) to the database.

{{<image filename="images/rc/database-new-tags.png" alt="Use the Tag settings to add tags to the database." >}}

Select **Add tag** to add a tag.

{{<image filename="images/rc/tags-button-add-tag.png" alt="The Add tag button." width=100px >}}

{{< embed-md "rc-tags-tag-module.md" >}}

## Security section

The **Security** section helps you control access to your database.

{{<image filename="images/rc/database-new-flexible-security.png" alt="Use the Security settings to control access to your database." >}}


| Setting name                       | Description                                                                                                                                                                           |
|:-----------------------------------|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Default user**                   | When enabled, permits access using a simple password                                                                                                                                  |
| **Redis password**                 | Password assigned to the database when created                                                                                                                                        |  
| **CIDR allow list**                | [Allow list]({{< relref "/operate/rc/security/cidr-whitelist.md" >}}) of IP addresses/security groups permitted to access the database |
| **Transport layer security (TLS)** | Enables [transport layer security]({{< relref "/operate/rc/security/database-security/tls-ssl.md" >}}) (TLS) encryption for database access          |


## Alerts section

The **Alerts** section defines notification emails sent to your account and the conditions that trigger them.

{{<image filename="images/rc/database-new-flexible-alerts.png" alt="The Alerts section defines the notification emails and their triggering conditions." >}}

The available alerts vary according to the subscription type.

|Setting name| Description                                                                                                                                              |
|:-----------|:---------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Dataset size has reached** | When enabled, sends an an email when the database reaches the defined memory limit                                 |
| **Latency is higher than** | When enabled, sends an an email when the latency exceeds the defined limit                                  |
| **Replica Of - database unable to sync with source** | When enabled, sends email when the replica database cannot sync with the primary (source) database                      |
| **Replica Of - sync lag is higher than** | When enabled, sends email when the sync lag exceeds the defined threshold                                              |
| **Throughput is higher than** | When enabled, sends an email when the operations per second exceed the defined threshold                   |
| **Throughput is lower than** | When enabled, sends an email when the operations per second falls below the defined threshold             |

{{< embed-md "rc-pro-use-cases-billing-units.md" >}}