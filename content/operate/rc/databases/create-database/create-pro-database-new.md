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
---

{{< embed-md "rc-create-db-first-steps.md" >}}

{{< note >}}See [Use case settings](#use-case-settings) to view the default settings for each use case.{{< /note >}}

4. Select the type of [subscription]({{< relref "/operate/rc/subscriptions" >}}) you need. For this guide, select **Pro**. 

    {{<image filename="images/rc/create-database-subscription-pro-new.png" alt="The Subscription selection panel with Pro selected.">}}

    {{< note >}}
This guide shows how to create a Pro database with a new subscription.
- If you already have a Pro subscription and want to add a database to it, see [Create a Pro database in an existing subscription]({{< relref "/operate/rc/databases/create-database/create-pro-database-existing" >}}).
- If you'd rather create an Essentials database, see [Create an Essentials database]({{< relref "/operate/rc/databases/create-database/create-essentials-database" >}}).
    {{< /note >}}
    

After you select **Pro**, the **Database settings** section will appear.

{{<image filename="images/rc/create-pro-db-settings.png" alt="The database settings section.">}}

You can choose to create your database in one of two ways:

- [**Easy create**](#easy-create) selects the optimal settings for your use case for you. 
- [**Custom settings**](#custom-settings) lets you select all of the configuration options for your new database.

## Create database with Easy create {#easy-create}

If you choose to create your database with Easy create:

{{<image filename="images/rc/pro-easy-create-vendor.png" alt="The database name, cloud vendor and region settings.">}}

1. Redis will generate a database name for you. If you want to change it, you can do so in the **Database name** field.  

1. Choose a **Cloud Provider** and a **Region**.

1. Review the **Optimal database settings** that we selected for you based on your use case.

    {{<image filename="images/rc/pro-easy-create-optimal-settings.png" alt="The optimal database settings.">}}

    Settings marked with the **Edit later** icon can be changed later. Anything not marked with this icon can't be changed after creation. If you want to change these settings, you can select [**Switch to custom settings**](#custom-settings).

    {{<image filename="images/rc/pro-easy-create-edit-icon.png" alt="The Edit later icon." width=50px >}}

1. Enter your payment details.

    If you haven't previously entered a payment method, use the **Add Credit Card** button to add one.

    {{<image filename="images/rc/icon-add-credit-card.png" alt="The Add credit card icon." >}}

 Select **Confirm & pay** to create your database.

{{<image filename="images/rc/button-create-db-confirm-pay.png" width="140px" alt="Select Confirm & Pay to create your new database." >}}

Note that databases are created in the background.  While they are provisioning, you aren't allowed to make changes. This process generally takes 10-15 minutes.

Use the **Database list** to check the status of your databases.

## Create database with Custom settings {#custom-settings}

If you choose to create your database with custom settings, you need to:

1. Set up the deployment options, including cloud vendor details, high availability settings, and advanced options.

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

{{<image filename="images/rc/subscription-new-flexible-setup-general.png" width="75%" alt="The General settings of the Setup tab." >}}

The following settings are defined in the **General settings** of the **Setup** tab:

| General setting | Description |
|:---------|:-----------|
| **Cloud vendor** | The public cloud vendor to deploy your databases. (_required_) |
| **Region** | The vendor region where you wish to deploy your databases.  (_required_)|
| **Active-Active Redis** | Hosts your datasets in multiple read-write locations to support distributed applications and disaster recovery. See [Create an Active-Active database]({{< relref "/operate/rc/databases/create-database/create-active-active-database" >}}) for specific steps and configuration options exclusive to Active-Active. |
| **Auto Tiering**| Determines if your databases are stored only in memory (RAM) or are split between memory and Flash storage (RAM+Flash).  See [Auto Tiering]({{< relref "/operate/rs/databases/auto-tiering/" >}})|

#### Version {#version}

{{<image filename="images/rc/subscription-new-flexible-version-section.png" width="75%" alt="Version selection between Redis 6.2 and 7.2" >}}

The **Version** section lets you choose the Redis version of your databases. Choose **Redis 7.2** if you want to use the latest advanced features of Redis.

#### Advanced options {#advanced-options}

{{<image filename="images/rc/subscription-new-flexible-setup-advanced.png" width="75%" alt="The Advanced settings of the Setup tab." >}}

The following settings are defined in the **Advanced options** of the **Setup** tab:

| Advanced option | Description |
|---|---|
| **Multi-AZ** | Determines if replication spans multiple Availability Zones, which provides automatic failover when problems occur. See [High Availability]({{< relref "/operate/rc/databases/configuration/high-availability" >}}). |
| **Allowed Availability Zones** | The availability zones for your selected region.<br/><br/>If you choose **Manual selection**, you must select at least one zone ID from the **Zone IDs** list.  For more information, see [Availability zones]({{< relref "/operate/rc/databases/configuration/high-availability#availability-zones" >}}). |
| **Cloud account** | To deploy these databases to an existing cloud account, select it here.  Use the **Add** button to add a new cloud account.<br/><br/>(Available only if [self-managed cloud vendor accounts]({{< relref "/operate/rc/cloud-integrations/aws-cloud-accounts" >}}) are enabled) |
| **VPC configuration** | Select **In a new VPC** to deploy to a new [virtual private cloud](https://en.wikipedia.org/wiki/Virtual_private_cloud) (VPC).<br/><br/>To deploy these databases to an existing virtual private cloud, select **In existing VPC** and then set VPC ID to the appropriate ID value.<br/><br/>(Available only if [self-managed cloud vendor accounts]({{< relref "/operate/rc/cloud-integrations/aws-cloud-accounts" >}}) are enabled) |
| **Deployment CIDR** | The [CIDR](https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing) range of IP addresses for your deployment. Redis creates a new [subnet](https://en.wikipedia.org/wiki/Subnetwork) for the **Deployment CIDR** in your [virtual private cloud](https://en.wikipedia.org/wiki/Virtual_private_cloud) (VPC). It cannot overlap with the CIDR ranges of other subnets used by your account.<br/><br/>For deployments in an existing VPC, the **Deployment CIDR** must be within your VPC's **primary** CIDR range (secondary CIDRs are not supported). |
| **Maintenance windows** | Determines when Redis can perform [maintenance]({{< relref "/operate/rc/subscriptions/maintenance" >}}) on your databases. Select **Manual** if you want to set [manual maintenance windows]({{< relref "/operate/rc/subscriptions/maintenance/set-maintenance-windows" >}}). |

When finished, choose **Continue** to determine your size requirements.

{{<image filename="images/rc/button-subscription-continue.png" width="100px" alt="Select the Continue button to continue to the next step." >}}

### Sizing tab

The **Sizing** tab helps you specify the database, memory, and throughput requirements for your subscription.

{{<image filename="images/rc/subscription-new-flexible-sizing-tab.png" width="75%" alt="The Sizing tab when creating a new Pro subscription." >}}

When you first visit the **Sizing** tab, there are no databases defined.  Select the **Add** button to create one.

{{<image filename="images/rc/icon-add-database.png" width="30px" alt="Use the Add button to define a new database for your subscription." >}}

This opens the **New Database** dialog, which lets you define the requirements for your new database.

{{<image filename="images/rc/flexible-add-database-basic.png" width="75%" alt="The New Database dialog with basic settings." >}}

By default, you're shown basic settings, which include:

| Database&nbsp;setting | Description |
|:---------|:-----------|
| **Name** | A custom name for your database (_required_) |
| **Advanced Capabilities** | Advanced data types used by the database. Choose from [Search and query]({{< relref "/operate/oss_and_stack/stack-with-enterprise/search" >}}), [JSON]({{< relref "/operate/oss_and_stack/stack-with-enterprise/json" >}}), [Time series]({{< relref "/operate/oss_and_stack/stack-with-enterprise/timeseries" >}}), [Probabilistic]({{< relref "/operate/oss_and_stack/stack-with-enterprise/bloom" >}}), or [Graph (EOL)]({{< relref "/operate/oss_and_stack/stack-with-enterprise/deprecated-features/graph" >}}). <br/> Databases with Search and query have specific sizing requirements, see [Search and query sizing]({{< relref "/operate/rc/databases/configuration/advanced-capabilities#search-and-query-sizing" >}}) for more information. |
| **Query performance factor** | *(Search and query databases only)* Adds additional compute power to process your Search and Query workloads and boost your queries per second. See [Search and query sizing]({{< relref "/operate/rc/databases/configuration/advanced-capabilities#search-and-query-sizing" >}}) for more information. |
| **Throughput** | Identifies maximum throughput for the database, which is specified in terms of operations per second (**Ops/sec**). See [Throughput]({{< relref "/operate/rc/databases/configuration/clustering#throughput" >}}) for more information. |
| **Dataset size (GB)** | The amount of data for your dataset. Specify small sizes as decimals of 1.0&nbsp;GB; example: `0.1` GB (minimum). We calculate the total memory limit for you based on the other settings you choose for your database. |
| **High Availability** | Indicates whether a replica copy of the database is maintained in case the primary database becomes unavailable.  (Warning: Doubles memory consumption). See [High Availability]({{< relref "/operate/rc/databases/configuration/high-availability" >}}).  |
| **Data Persistence** | Defines the data persistence policy, if any. See [Data persistence]({{< relref "/operate/rc/databases/configuration/data-persistence.md" >}}). |

Select **More options** to specify values for the following settings.

{{<image filename="images/rc/flexible-add-database-advanced.png" width="75%" alt="The New Database dialog with advanced settings." >}}

| Database&nbsp;option | Description                                                                                                                                                     |
|:---------|:----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **OSS Cluster API** | Enable to use the [Redis Cluster API]({{< relref "/operate/rc/databases/configuration/clustering#oss-cluster-api" >}}).                                                                                                                |
| **Type** | Set to **Redis**, otherwise **Memcached** database for legacy database support.                                                                                     |
| **Supported Protocol(s)** | Choose between RESP2 and RESP3 _(Redis 7.2 only)_. See [Redis serialization protocol]({{< relref "/develop/reference/protocol-spec" >}}#resp-versions) for details |
| **Quantity** | Number of databases to create with these settings.                                                                                                              |

When finished, select **Save configuration** to save your database configuration.

{{<image filename="images/rc/button-configuration-save.png" width="140px" alt="Select the Save configuration button to define your new database." >}}

Use the **Add database** button to define additional databases or select the **Continue button** to display the **Review and create** tab.

Hover over a database to see the **Edit** and **Delete** icons. You can use the **Edit** icon to change a database or the **Delete** icon to remove a database from the list.

{{<image filename="images/rc/icon-database-edit.png#no-click" width="30px" alt="Use the Edit button to change database settings." class="inline" >}}&nbsp;{{<image filename="images/rc/icon-database-delete.png#no-click" width="30px" alt="Use the Delete button to remove a database." class="inline">}}


### Review and Create tab

The **Review & Create** tab provides a cost estimate for your Redis Cloud Pro plan:

{{<image filename="images/rc/subscription-new-flexible-review.png" width="75%" alt="The Review & Create tab of the New Flexible subscription screen." >}}

Redis breaks down your databases to Redis Billing Units (RBUs), each with their own size and throughput requirements. For more info, see [Billing unit types](#billing-unit-types).

Select **Back to Sizing** to make changes or **Confirm & Pay** to create your databases.

{{<image filename="images/rc/button-create-db-confirm-pay.png" width="140px" alt="Select Confirm & pay to create your database." >}}

Note that databases are created in the background.  While they are provisioning, you aren't allowed to make changes. This process generally takes 10-15 minutes.

Use the **Database list** to check the status of your databases.



{{< embed-md "rc-pro-use-cases-billing-units.md" >}}


