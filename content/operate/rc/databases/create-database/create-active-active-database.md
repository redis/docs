---
Title: Create an Active-Active database
alwaysopen: false
categories:
- docs
- operate
- rc
description: Shows how to create an Active-Active database
linkTitle: Create Active-Active database
weight: 20
aliases: 
    - /operate/rc/subscriptions/create-active-active-subscription
---

Active-Active databases store data across multiple regions and availability zones.  This improves scalability, performance, and availability, especially when compared to standalone databases. See [Active-Active Redis]({{< relref "/operate/rc/databases/configuration/active-active-redis" >}}) for more information.

To deploy Active-Active databases in Redis Cloud, you need a Redis Cloud Pro plan that enables Active-Active Redis and defines the regions for each copy of your databases.

Active-Active databases consist of multiple copies (also called _instances_) deployed to different regions throughout the world.

This reduces latency for local users and improves availability should a region fail.

Redis Cloud maintains consistency among instances in the background; that is, each copy eventually includes updates from every region.  As a result, memory limit and throughput increase.

## Create an Active-Active database

{{< embed-md "rc-create-db-first-steps.md" >}}

{{< embed-md "rc-create-db-use-cases.md" >}}

4. Select the type of [subscription]({{< relref "/operate/rc/subscriptions" >}}) you need. For this guide, select **Pro**. 

    {{<image filename="images/rc/create-database-subscription-pro-new.png" alt="The Subscription selection panel with Pro selected.">}}

    {{< note >}}
This guide shows how to create an Active-Active database with a new Pro subscription. If you already have an Active-Active subscription and want to add a database to it, see [Create a Pro database in an existing subscription]({{< relref "/operate/rc/databases/create-database/create-pro-database-existing" >}}). 
    {{< /note >}}
    

After you select **Pro**, the **Database settings** section will appear.

{{<image filename="images/rc/create-pro-db-settings-custom.png" alt="The database settings section, with custom settings selected.">}}

For this guide, select **Custom settings**. For an Active-Active database, you will need to: 

1. Set up the deployment options, including cloud vendor and region details for each instance.

2. Define the database size requirements.

3. Review your choices, provide payment details, and then create your databases.

The following sections provide more information.

### Set up deployment details

The **Setup** tab specifies general settings for your Redis deployment.

{{<image filename="images/rc/subscription-new-flexible-tabs-setup.png" width="75%" alt="The Setup tab of the new Pro Database process." >}}

There are three sections on this tab:

- [General settings](#general-settings) include the cloud provider details and specific configuration options.
- [Version](#version) lets you choose the Redis version of your databases.
- [Advanced options](#advanced-options) define settings for high availability and security. Configurable settings vary according to cloud provider.

#### General settings {#general-settings}

Select **Active-Active (Multi-region)** to turn on Active-Active. 

{{<image filename="images/rc/create-flexible-sub-active-active-on.png" width="75%" alt="When you enable Active-Actve, you need to specify the regions for each database instance." >}}

When you enable Active-Active Redis, two regions are selected by default. Select the drop-down arrow to display a list of provider regions that support Active-Active databases.

{{<image filename="images/rc/create-sub-active-active-regions.png" width="50%" alt="Use the Region drop-down to select the regions for your Active-Active database." >}}

Use the checkboxes in the list to select or remove regions.  The Search box lets you locate specific regions.

You can use a region's Remove button to remove it from the list.

{{<image filename="images/rc/icon-region-delete.png" width="30px" alt="Select the Delete button to remove a region from the list." >}}

#### Version {#version}

{{<image filename="images/rc/subscription-new-flexible-version-section.png" width="75%" alt="Version selection between Redis 6.2 and 7.2" >}}

The **Version** section lets you choose the Redis version of your databases. Choose **Redis 7.2** if you want to use the latest advanced features of Redis.

#### Advanced options {#advanced-options}

{{<image filename="images/rc/create-sub-active-active-cidr.png" width="75%" alt="Each region needs a unique CIDR address block to communicate securely with other instances." >}}

In the **Advanced options** section, you can:
    
- Define CIDR addresses for each region in the **VPC configuration** section.

    Every CIDR should be unique to properly route network traffic between each Active-Active database instance and your consumer VPCs. The CIDR block regions should _not_ overlap between the Redis server and your app consumer VPCs. In addition, CIDR blocks should not overlap between cluster instances. 

    When all **Deployment CIDR** regions display a green checkmark, you're ready to continue.  

    {{<image filename="images/rc/icon-cidr-address-ok.png" width="30px" alt="Greem chackmarks indicate valid CIDR address values." >}}

    Red exclamation marks indicate error conditions; the tooltip provides additional details.

    {{<image filename="images/rc/icon-cidr-address-error.png" width="30px" alt="Red exclamation points indicate CIDR address problems." >}} 

- Set your [maintenance]({{< relref "/operate/rc/subscriptions/maintenance" >}}) settings in the **Maintenance windows** section. Select **Manual** if you want to set [manual maintenance windows]({{< relref "/operate/rc/subscriptions/maintenance/set-maintenance-windows" >}}).

When finished, choose **Continue** to determine your size requirements.

{{<image filename="images/rc/button-subscription-continue.png" width="100px" alt="Select the Continue button to continue to the next step." >}}

### Sizing tab

The **Sizing** tab helps you specify the database, memory, and throughput requirements for your subscription.

{{<image filename="images/rc/subscription-new-flexible-sizing-tab.png" width="75%" alt="The Sizing tab when creating a new Pro subscription." >}}

When you first visit the **Sizing** tab, there are no databases defined.  Select the **Add** button to create one.

{{<image filename="images/rc/icon-add-database.png" width="30px" alt="Use the Add button to define a new database for your subscription." >}}

This opens the **New Database** dialog, which lets you define the requirements for your new database.

{{<image filename="images/rc/create-database-active-active.png" width="75%" alt="New database dialog for Active-Active database." >}}

By default, you're shown basic settings, which include:

- **Name**: A custom name for your database.
- **Advanced Capabilities**: Advanced data types or capabilities used by the database. Active-Active databases support the [JSON]({{< relref "/operate/oss_and_stack/stack-with-enterprise/json" >}}) data type and [Search and query]({{< relref "/operate/oss_and_stack/stack-with-enterprise/search" >}}) capabilities.

    {{<image filename="images/rc/active-active-json-detail.png" width="75%" alt="When you create an Active-Active database, you can select the JSON and Search and query advanced capabilities." >}}  

    We select both capabilities for you automatically. You can remove a capability by selecting it. Selected capabilities will be available in all regions, including those added in the future.

    See [Search and query Active-Active databases]({{< relref "/operate/oss_and_stack/stack-with-enterprise/search/search-active-active" >}}) to learn how to use Search and query on Active-Active databases.

- **Dataset size**: The amount of data needed for your dataset in GB. 

    For Search and query databases, use the [Sizing calculator](https://redis.io/redisearch-sizing-calculator/) to estimate your index size and throughput requirements. When you're entering the dataset size for your database, add the estimated index size from the Sizing calculator to your expected dataset size.

- **Throughput**: When you create an Active-Active database, you define the throughput for each instance. The total operations per second combines the total read ops/sec and applies the write ops/sec for each region across every region. 

    {{<image filename="images/rc/active-active-throughput-detail.png" width="75%" alt="When you create an Active-Active database, you define throughput for each region." >}}
    
    Because each instance needs the ability to write to every other instance, write operations significantly affect the total, as shown in the following table:

    | Number of regions | Read operations | Write operations | Total operations |
    |:-----------------:|:---------------:|:----------------:|:----------------:|
    | Two | 1,000 each | 1,000 each | 6,000<br/>(2,000 reads; 4,000 writes) |
    | Two | 1,500 each | 1,000 each | 7,000<br/>(3,000 reads; 4,000 writes) |
    | Two | 1,000 each | 1,500 each | 8,000<br/>(2,000 reads; 6,000 writes) |
    | Three | 1,000 each | 1,000 each | 12,000<br/>(3,000 reads; 9,000 writes) |

    For Search and query databases, the estimated throughput from the [Sizing calculator](https://redis.io/redisearch-sizing-calculator/) is the total amount of throughput you need. When setting throughput for your Active-Active database, use the total amount for each region and divide it depending on your read (query) and write (update) needs for each region. For example, if the total amount of throughput needed is 50000 ops/sec, you could set each region to have 20000 ops/sec for reads (queries) and 30000 ops/sec for writes (updates).

- **Data Persistence**: Defines the data persistence policy, if any. See [Database persistence]({{< relref "/operate/rs/databases/configure/database-persistence.md" >}}).
- **Supported Protocol(s)**: Choose between RESP2 and RESP3 _(Redis 7.2 only)_. See [Redis serialization protocol]({{< relref "/develop/reference/protocol-spec" >}}#resp-versions) for details.
- **Quantity**: Number of databases to create with these settings. 

When finished, select **Save configuration** to save your database configuration.

{{<image filename="images/rc/button-configuration-save.png" width="140px" alt="Select the Save configuration button to define your new database." >}}

Use the **Add database** button to define additional databases or select the **Continue button** to display the **Review and create** tab.

Hover over a database to see the **Edit** and **Delete** icons. You can use the **Edit** icon to change a database or the **Delete** icon to remove a database from the list.

{{<image filename="images/rc/icon-database-edit.png#no-click" width="30px" alt="Use the Edit button to change database settings." class="inline" >}}&nbsp;{{<image filename="images/rc/icon-database-delete.png#no-click" width="30px" alt="Use the Delete button to remove a database." class="inline">}}


### Review and Create tab

The **Review and Create** tab provides a cost estimate for your Redis Cloud Pro plan:

{{<image filename="images/rc/create-pro-aa-review.png" width="75%" alt="The Review & Create tab of the New Flexible subscription screen." >}}

Redis breaks down your databases to Redis Billing Units (RBUs), each with their own size and throughput requirements. For more info, see [Billing unit types]({{< relref "/operate/rc/databases/create-database/create-pro-database-new" >}}#billing-unit-types).

Select **Back to Sizing** to make changes or **Confirm & Pay** to create your databases.

{{<image filename="images/rc/button-create-db-confirm-pay.png" width="140px" alt="Select Confirm & pay to create your database." >}}

Note that databases are created in the background.  While they are provisioning, you aren't allowed to make changes. This process generally takes 10-15 minutes.

Use the **Database list** to check the status of your databases.

## More info

- [Create a Pro database with a new subscription]({{< relref "/operate/rc/databases/create-database/create-pro-database-new" >}})
- [Active-Active Redis]({{< relref "/operate/rc/databases/configuration/active-active-redis" >}})
- [Develop applications with Active-Active databases]({{< relref "/operate/rs/databases/active-active/develop/_index.md" >}})
- Database [memory limit]({{< relref "/operate/rc/databases/configuration/sizing#dataset-size" >}})
- Redis Cloud [subscription plans]({{< relref "/operate/rc/subscriptions/" >}})
- [Redis Cloud pricing](https://redis.io/pricing/#monthly)

