---
Title: Create a Flex database
alwaysopen: false
categories:
- docs
- operate
- rc
description: Shows how to create a Flex database on Redis Cloud and describes the best use cases for Flex. 
linkTitle: Create Flex database
weight: 8
tocEmbedHeaders: true
---

Flex allows your dataset to span both high-performance RAM and cost-efficient dedicated Flash memory. Flex automatically manages data placement between the two tiers, keeping frequently accessed (“hot”) data in RAM for sub-millisecond latency, while moving less active (“warm”) data to Flash to optimize capacity and cost. This dual memory architecture delivers predictable performance at scale, enabling larger datasets without compromising speed or operational simplicity.

Flex databases are currently compatible with most existing Redis applications, except for applications that use Search and Query and Time Series.

Flex is available on both Redis Cloud Essentials and Redis Cloud Pro.

## When to use Flex

Flex is ideal for workloads that demand large-scale, low-latency data access with the flexibility to optimize cost and performance.

Consider Flex when you need to:

- Run Redis at terabyte scale while maintaining high throughput and sub-10 ms latency.
- Power real-time feature stores for machine learning applications such as fraud detection, recommendation systems, and personalization engines.
- Operate large distributed caches that require elastic scaling and consistent performance under heavy load.
- Optimize infrastructure cost by combining high-speed RAM with cost-efficient Flash storage through Flex's automatic data tiering.

Flex is **not** a durable data store. It is designed for performance, elasticity, and scalability, not for long-term data persistence. While Flex can temporarily retain data in memory or Flash, it should not be used as a primary system of record or persistent storage layer.

For workloads that require durability and recovery across restarts or failures, use Redis Cloud's [Data persistence]({{< relref "/operate/rc/databases/configuration/data-persistence" >}}) features.

## Create a Flex database 

### Redis Cloud Essentials

{{< embed-md "rc-create-db-first-steps.md" >}} 

3. Select the type of [subscription]({{< relref "/operate/rc/subscriptions" >}}) you need. For this guide, select **Essentials**.

    {{<image filename="images/rc/create-database-subscription-essentials.png" alt="The Subscription selection panel with Essentials selected.">}}

    After you select **Essentials**, the rest of the database details will appear. Select **Flex (RAM + SSD)** to use Flex.

    {{<image filename="images/rc/create-database-flex-cloud-vendor.png" alt="The database name, cloud vendor, version, region, type, and durability settings.">}}

1. Redis will generate a database name for you. If you want to change it, you can do so in the **Database name** field.  

1. Choose a **Region** on Amazon Web Services for your database. See [Supported regions]({{< relref "/operate/rc/supported-regions" >}}) for a list of supported regions by cloud vendor.

1. Select the **Database version** you want to use.

1. Select your desired memory limit. 

    {{<image filename="images/rc/subscription-new-flex-tiers.png" alt="Available Flex plans." >}}

    For a comparison of available plans, see [Redis Cloud Essentials plans]({{< relref "/operate/rc/subscriptions/view-essentials-subscription/essentials-plan-details" >}}).

    All Flex plans on Redis Cloud Essentials have a default RAM percentage of 10%. 

1. Choose your **High availability (replication)** settings from the list. 

    Redis Cloud supports the following high availability settings with Flex:

    - **None**: You will have a single copy of your database without replication.
    - **Single-Zone**: Your database will have a primary and a replica located in the same cloud zone. If anything happens to the primary, the replica takes over and becomes the new primary.

    See [High availability]({{< relref "/operate/rc/databases/configuration/high-availability" >}}) for more information about these settings.

1. Choose your **Data persistence** settings from the list.

    Redis Cloud supports the following data persistence options:

    - An **Append-Only File** maintains a record (sometimes called a _redo log_ or _journal_) of write operations.  This allows the data to be restored by using the record to reconstruct the database up to the point of failure. For Essentials databases, Redis updates the Append-Only file every second.

    - A **Snapshot** is a copy of the in-memory database, taken at periodic intervals (one, six, or twelve hours). You can restore data to the snapshot's point in time. 
    
    See [Data persistence]({{< relref "/operate/rc/databases/configuration/data-persistence" >}}) for more information about these settings.

1. Select the **Database version** you want to use.

1.  Enter your payment details.

    If you haven't previously entered a payment method, use the **Add Credit Card** button to add one.

    {{<image filename="images/rc/icon-add.png" width="30px" alt="The Add credit card icon." >}}

    {{< embed-md "rc-credit-card-add.md" >}}

1. Select **Confirm & pay** to create your database.

{{<image filename="images/rc/button-create-db-confirm-pay.png" width="140px" alt="Select Confirm & Pay to create your new database." >}}

When you create your database, there's a brief pause while your request is processed and then the **Database details** page appears.

### Redis Cloud Pro

To create a Flex database on Redis Cloud Pro, [create a new Pro database with custom settings]({{< relref "/operate/rc/databases/create-database/create-pro-database-new#custom-settings" >}}). 

In the **Advanced options** of the **Setup** tab, select **Redis Flex**.

{{<image filename="images/rc/pro-flex-on.png" width="75%" alt="The Flex setting selected." >}}

During the **Sizing** step, when you are provisioning your databases, you can select the RAM percentage for your database. The default is 20%, but you can select a percentage between 10% and 50%. Lower RAM percentages reduce cost but may increase latency, while higher RAM percentages improve throughput and latency at higher cost.

{{<image filename="images/rc/pro-flex-ram-percentage.png" width="75%" alt="The RAM percentage setting." >}}

Continue with the instructions to [create your database]({{< relref "/operate/rc/databases/create-database/create-pro-database-new#custom-settings" >}}).