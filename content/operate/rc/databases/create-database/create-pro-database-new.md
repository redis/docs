---
Title: Create a Pro database with a new subscription
alwaysopen: false
categories:
- docs
- operate
- rc
description: Shows how to create a Pro database with a new subscription
linkTitle: Create Pro database (new subscription)
weight: 10
tocEmbedHeaders: true
---

Redis Cloud Pro supports more databases, larger databases, greater throughput, and unlimited connections compared to Redis Cloud Essentials. Redis Cloud Pro databases are perfect for teams building mission-critical systems in the cloud.

{{< embed-md "rc-create-db-first-steps.md" >}}

3. Select the type of [subscription]({{< relref "/operate/rc/subscriptions" >}}) you need. For this guide, select **Pro**. 

    {{<image filename="images/rc/create-database-subscription-pro-new.png" alt="The Subscription selection panel with Pro selected.">}}

    {{< note >}}
This guide shows how to create a Pro database with a new subscription.
- If you already have a Pro subscription and want to add a database to it, see [Create a Pro database in an existing subscription]({{< relref "/operate/rc/databases/create-database/create-pro-database-existing" >}}).
- If you'd rather create an Essentials database, see [Create an Essentials database]({{< relref "/operate/rc/databases/create-database/create-essentials-database" >}}).
    {{< /note >}}
    

After you select **Pro**, the **Database settings** section will appear.

{{<image filename="images/rc/create-pro-db-settings.png" alt="The database settings section.">}}

You can choose to create your database in one of two ways:

- [**Easy create**](#easy-create) selects the optimal settings for you to get started faster.
- [**Custom settings**](#custom-settings) lets you select all of the configuration options for your new database.

## Create database with Easy create {#easy-create}

If you choose to create your database with Easy create:

{{<image filename="images/rc/pro-easy-create-vendor.png" alt="The database name, cloud vendor and region settings.">}}

1. Redis will generate a database name for you. If you want to change it, you can do so in the **Database name** field.  

1. Choose a **Cloud Provider** and a **Region**.

1. Enter the following settings for your database:

    {{<image filename="images/rc/pro-easy-create-size-throughput.png" alt="The Dataset size, throughput, and High availability settings.">}}

    | Database&nbsp;setting | Description |
    |:---------|:-----------|
    | **Dataset size (GB)** | The amount of data for your dataset. Specify small sizes as decimals of 1.0&nbsp;GB; example: `0.1` GB (minimum). We calculate the total memory limit for you based on the other settings you choose for your database. <br/> Databases with Search and query have specific sizing requirements, see [Search and query sizing]({{< relref "/operate/rc/databases/configuration/advanced-capabilities#search-and-query-sizing" >}}) for more information. |
    | **Throughput** | Identifies maximum throughput for the database, which is specified in terms of operations per second (**Ops/sec**). See [Throughput]({{< relref "/operate/rc/databases/configuration/sizing#throughput" >}}) for more information. <br/> Databases with Search and query have specific throughput requirements, see [Search and query sizing]({{< relref "/operate/rc/databases/configuration/advanced-capabilities#search-and-query-sizing" >}}) for more information. |
    | **High Availability** | Indicates whether a replica copy of the database is maintained in case the primary database becomes unavailable.  (Warning: doubles memory consumption). See [High Availability]({{< relref "/operate/rc/databases/configuration/high-availability" >}}).  |

1. Select **View all settings** to review the database settings that we selected for you.

    {{<image filename="images/rc/pro-easy-create-optimal-settings.png" alt="The optimal database settings.">}}

    If you want to change these settings, select [**Switch to custom settings**](#custom-settings).

1. Enter your payment details.

    If you haven't previously entered a payment method, use the **Add Credit Card** button to add one.

    {{<image filename="images/rc/icon-add.png" width="30px" alt="The Add credit card icon." >}}

    {{< embed-md "rc-credit-card-add.md" >}}

 Select **Confirm & pay** to create your database.

{{<image filename="images/rc/button-create-db-confirm-pay.png" width="140px" alt="Select Confirm & Pay to create your new database." >}}

Note that databases are created in the background.  While they are provisioning, you aren't allowed to make changes. This process generally takes 10-15 minutes.

Use the **Database list** to check the status of your databases.

## Create database with Custom settings {#custom-settings}

{{<image filename="images/rc/create-pro-db-settings-custom.png" alt="The database settings section, with custom settings selected.">}}

If you choose to create your database with custom settings, you need to:

1. Set up the deployment options, including cloud vendor details, high availability settings, and advanced options.

2. Define the database size requirements.

3. Review your choices, provide payment details, and then create your databases.

The following sections provide more information.

### Set up deployment details

The **Setup** tab specifies general settings for your Redis deployment.

{{<image filename="images/rc/subscription-new-flexible-tabs-setup.png" width="75%" alt="The Setup tab of the new Pro Database process." >}}

There are two sections on this tab:

- [General settings](#general-settings) include the cloud provider details and specific configuration options.
- [Advanced options](#advanced-options) define settings for high availability and security. Configurable settings vary according to cloud provider.

#### General settings {#general-settings}

{{<image filename="images/rc/subscription-new-flexible-setup-general.png" width="75%" alt="The General settings of the Setup tab." >}}

In the **General settings** of the **Setup** tab, you need to:

1. Select the public **Cloud vendor** to deploy your databases.

1. Select the **Region** where you want to deploy your database. 

    {{< note >}}
This guide is for single region database deployment. If you want to create a multi-region Active-Active database, see [Create an Active-Active database]({{< relref "/operate/rc/databases/create-database/create-active-active-database" >}}) for specific steps and configuration options exclusive to Active-Active.
    {{< /note >}}

#### Advanced options {#advanced-options}

{{<image filename="images/rc/subscription-new-flexible-setup-advanced.png" width="75%" alt="The Advanced settings of the Setup tab." >}}

The following settings are defined in the **Advanced options** of the **Setup** tab:

| Advanced option | Description |
|---|---|
| **Multi-AZ** | Determines if replication spans multiple Availability Zones, which provides automatic failover when problems occur. See [High Availability]({{< relref "/operate/rc/databases/configuration/high-availability" >}}). |
| **Allowed Availability Zones** | The availability zones for your selected region.<br/><br/>If you choose **Manual selection**, you must select at least one zone ID from the **Zone IDs** list.  For more information, see [Availability zones]({{< relref "/operate/rc/databases/configuration/high-availability#availability-zones" >}}). |
| **Cloud account** | To deploy these databases to an existing cloud account, select it here.  Use the **Add** button to add a new cloud account.<br/><br/>(Available only if [Redis Cloud Bring your own Cloud]({{< relref "/operate/rc/subscriptions/bring-your-own-cloud" >}}) is enabled) |
| **Public endpoint access** | Select whether or not to [block public endpoints]({{< relref "/operate/rc/security/database-security/block-public-endpoints" >}}) for all databases in the subscription.  |
| **Persistent storage encryption** | Select whether to encrypt persistent storage with a Cloud-provider managed key or a [self-managed encryption key]({{< relref "/operate/rc/security/manage-encryption-keys" >}}). If you select **Customer managed key**, you'll get clear instructions to provide access to your self-managed key after you set up your database(s). See [Grant key permissions]({{< relref "/operate/rc/security/manage-encryption-keys#grant-key-permissions" >}}) for more information. |
| **VPC configuration** | Select **In a new VPC** to deploy to a new [virtual private cloud](https://en.wikipedia.org/wiki/Virtual_private_cloud) (VPC).<br/><br/>To deploy these databases to an existing virtual private cloud, select **In existing VPC** and then set VPC ID to the appropriate ID value.<br/><br/>(Available only if [Redis Cloud Bring your own Cloud]({{< relref "/operate/rc/subscriptions/bring-your-own-cloud" >}}) is enabled) |
| **Deployment CIDR** | The [CIDR](https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing) range of IP addresses for your deployment. Redis creates a new [subnet](https://en.wikipedia.org/wiki/Subnetwork) for the **Deployment CIDR** in your [virtual private cloud](https://en.wikipedia.org/wiki/Virtual_private_cloud) (VPC). It cannot overlap with the CIDR ranges of other subnets used by your account.<br/><br/>For deployments in an existing VPC, the **Deployment CIDR** must be within your VPC's **primary** CIDR range (secondary CIDRs are not supported). |
| **Auto Tiering**| Determines if your databases are stored only in memory (RAM) or are split between memory and Flash storage (RAM+Flash).  See [Auto Tiering]({{< relref "/operate/rs/databases/auto-tiering/" >}})|
| **Maintenance windows** | Determines when Redis can perform [maintenance]({{< relref "/operate/rc/subscriptions/maintenance" >}}) on your databases. Select **Manual** if you want to set [manual maintenance windows]({{< relref "/operate/rc/subscriptions/maintenance/set-maintenance-windows" >}}). |

When finished, choose **Continue** to determine your size requirements.

{{<image filename="images/rc/button-subscription-continue.png" width="100px" alt="Select the Continue button to continue to the next step." >}}

### Sizing tab

The **Sizing** tab helps you specify the database, memory, and throughput requirements for your subscription.

{{<image filename="images/rc/subscription-new-flexible-sizing-tab.png" width="75%" alt="The Sizing tab when creating a new Pro subscription." >}}

When you first visit the **Sizing** tab, there are no databases defined.  Select the **Add** button to create one.

{{<image filename="images/rc/icon-add.png" width="30px" alt="Use the Add button to define a new database for your subscription." >}}

This opens the **New Database** dialog, which lets you define the requirements for your new database.

{{<image filename="images/rc/flexible-add-database-basic.png" width="75%" alt="The New Database dialog with basic settings." >}}

By default, you're shown basic settings, which include:

| Database&nbsp;setting | Description |
|:---------|:-----------|
| **Name** | A custom name for your database (_required_) |
| **Version** | The Redis version for your database. We recommend you choose the latest available version. |
| **Dataset size (GB)** | The amount of data for your dataset. Specify small sizes as decimals of 1.0&nbsp;GB; example: `0.1` GB (minimum). We calculate the total memory limit for you based on the other settings you choose for your database. <br/> Databases with Search and query have specific sizing requirements, see [Search and query sizing]({{< relref "/operate/rc/databases/configuration/advanced-capabilities#search-and-query-sizing" >}}) for more information. |
| **High Availability** | Indicates whether a replica copy of the database is maintained in case the primary database becomes unavailable.  (Warning: Doubles memory consumption). See [High Availability]({{< relref "/operate/rc/databases/configuration/high-availability" >}}).  |
| **Throughput** | Identifies maximum throughput for the database, which is specified in terms of operations per second (**Ops/sec**). See [Throughput]({{< relref "/operate/rc/databases/configuration/sizing#throughput" >}}) for more information. <br/> Databases with Search and query have specific throughput requirements. See [Search and query sizing]({{< relref "/operate/rc/databases/configuration/advanced-capabilities#search-and-query-sizing" >}}) for more information. |
| **Hashing policy** | Determines how data is distributed across multiple Redis processes of a database. Available options depend on your account creation date. See [Clustering]({{< relref "/operate/rc/databases/configuration/clustering#manage-the-hashing-policy" >}}) for more information.  |
| **Query performance factor** | *(Search and query databases on Redis 7.2 or later only)* Adds additional compute power to process your query and vector search workloads and boost your queries per second. See [Search and query sizing]({{< relref "/operate/rc/databases/configuration/advanced-capabilities#search-and-query-sizing" >}}) for more information. |
| **Data Persistence** | Defines the data persistence policy, if any. See [Data persistence]({{< relref "/operate/rc/databases/configuration/data-persistence.md" >}}). |

Select **More options** to specify values for the following settings.

{{<image filename="images/rc/flexible-add-database-advanced.png" width="75%" alt="The New Database dialog with advanced settings." >}}

| Database&nbsp;option | Description                                                                                                                                                     |
|:---------|:----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Advanced Capabilities** | [Advanced features and data types]({{< relref "/operate/rc/databases/configuration/advanced-capabilities" >}}) used by the database. Choose from [Search and query]({{< relref "/operate/oss_and_stack/stack-with-enterprise/search" >}}), [JSON]({{< relref "/operate/oss_and_stack/stack-with-enterprise/json" >}}), [Time series]({{< relref "/operate/oss_and_stack/stack-with-enterprise/timeseries" >}}), or [Probabilistic]({{< relref "/operate/oss_and_stack/stack-with-enterprise/bloom" >}}). <br/> Databases with Search and query have specific sizing requirements, see [Search and query sizing]({{< relref "/operate/rc/databases/configuration/advanced-capabilities#search-and-query-sizing" >}}) for more information. |
| **OSS Cluster API** | Enable to use the [Redis Cluster API]({{< relref "/operate/rc/databases/configuration/clustering#oss-cluster-api" >}}).                                                                                                                |
| **Type** | Set to **Redis**, otherwise **Memcached** database for legacy database support.                                                                                     |
| **Supported Protocol(s)** | Choose between RESP2 and RESP3 _(Redis 7.2 only)_. See [Redis serialization protocol]({{< relref "/develop/reference/protocol-spec" >}}#resp-versions) for details |
| **Quantity** | Number of databases to create with these settings.                                                                                                              |

When finished, select **Save configuration** to save your database configuration.

{{<image filename="images/rc/button-configuration-save.png" width="140px" alt="Select the Save configuration button to define your new database." >}}

Use the **Add database** button to define additional databases or select the **Continue button** to display the **Review and create** tab.

Hover over a database to see the **Edit** and **Delete** icons. You can use the **Edit** icon to change a database or the **Delete** icon to remove a database from the list.

{{<image filename="images/rc/icon-edit.png#no-click" width="30px" alt="Use the Edit button to change database settings." class="inline" >}}&nbsp;{{<image filename="images/rc/icon-delete-teal.png#no-click" width="30px" alt="Use the Delete button to remove a database." class="inline">}}


### Review and Create tab

The **Review & Create** tab provides a cost estimate for your Redis Cloud Pro plan:

{{<image filename="images/rc/subscription-new-flexible-review.png" width="75%" alt="The Review & Create tab of the New Flexible subscription screen." >}}

Redis breaks down your databases to Redis Billing Units (RBUs), each with their own size and throughput requirements. For more info, see [Billing unit types](#billing-unit-types).

The **Payment methods** section of this tab shows which payment method you're using for this database. Select the arrow on the top right of this section to view all available payment methods.

{{<image filename="images/rc/subscription-new-flexible-cardlist.png" width="250px" alt="The payment method list." >}}

If you have not added a payment method or want to add a new payment method, select **Add credit card** to add a new credit card.

{{< embed-md "rc-credit-card-add.md" >}}

Select **Back to Sizing** to make changes or **Confirm & Pay** to create your databases.

{{<image filename="images/rc/button-create-db-confirm-pay.png" width="140px" alt="Select Confirm & pay to create your database." >}}

Note that databases are created in the background.  While they are provisioning, you aren't allowed to make changes. This process generally takes 10-15 minutes.

Use the **Database list** to check the status of your databases.



{{< embed-md "rc-pro-billing-units.md" >}}


