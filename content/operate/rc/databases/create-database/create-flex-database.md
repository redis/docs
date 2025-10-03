---
Title: Create a Redis Flex database
alwaysopen: false
categories:
- docs
- operate
- rc
description: Shows how to create an Redis Flex database on Redis Cloud and describes the best use cases for Redis Flex. 
linkTitle: Create Redis Flex database
weight: 8
tocEmbedHeaders: true
---

Redis Flex databases have a tiered solid state drive (SSD) and RAM architecture. Using SSDs instead of RAM significantly reduces infrastructure costs, which means developers can build applications that require large datasets using the same Redis API.

Redis Flex databases are compatible with most existing Redis applications, except for applications that use Search and Query and Time Series.

Redis Flex is currently available in preview on Redis Cloud Essentials. 

## Redis Flex use cases

The benefits associated with Redis Flex are dependent on the use case.

Redis Flex is ideal when your:

- working set is significantly smaller than your dataset (high RAM hit rate)
- average key size is smaller than average value size (all key names are stored in RAM)
- most recent data is the most frequently used (high RAM hit rate)

Redis Flex is not recommended for:

- Long key names (all key names are stored in RAM)
- Broad access patterns (any value could be pulled into RAM)
- Large working sets (working set is stored in RAM)
- Frequently moved data (moving to and from RAM too often can impact performance)

Redis Flex is not intended to be used for persistent storage.

## Where is my data?

When using Redis Flex, RAM storage holds:
- All keys (names)
- Key indexes
- Dictionaries
- Hot data (working set)

All data is accessed through RAM. If a value in flash memory is accessed, it becomes part of the working set and is moved to RAM. These values are referred to as "hot data".

Inactive or infrequently accessed data is referred to as "warm data" and stored in flash memory. When more space is needed in RAM, warm data is moved from RAM to flash storage.

## Create a Redis Flex database on Redis Cloud Essentials

{{< embed-md "rc-create-db-first-steps.md" >}} 

3. Select the type of [subscription]({{< relref "/operate/rc/subscriptions" >}}) you need. For this guide, select **Redis Flex**.

    {{<image filename="images/rc/create-database-subscription-flex.png" alt="The Subscription selection panel with Redis Flex selected.">}}

    {{< note >}}
This guide shows how to create a Redis Flex database on Redis Cloud Essentials.
- If you'd rather create a Redis on RAM Essentials database, see [Create an Essentials database]({{< relref "/operate/rc/databases/create-database/create-essentials-database" >}}).
- If you'd rather create a Pro database, see [Create a Pro database with a new subscription]({{< relref "/operate/rc/databases/create-database/create-pro-database-new" >}}).
- If you already have a Pro subscription and want to add a database to it, see [Create a Pro database in an existing subscription]({{< relref "/operate/rc/databases/create-database/create-pro-database-existing" >}}).
    {{< /note >}}
    
    After you select **Redis Flex**, the rest of the database details will appear.

    {{<image filename="images/rc/create-database-flex-cloud-vendor.png" alt="The database name, cloud vendor, region, and type settings.">}}

1. Redis will generate a database name for you. If you want to change it, you can do so in the **Database name** field.  

1. Choose a **Region** on Amazon Web Services for your database. See [Supported regions]({{< relref "/operate/rc/supported-regions" >}}) for a list of supported regions by cloud vendor.

1. Choose your **High availability (replication)** settings from the list. 

    Redis Cloud supports the following high availability settings with Redis Flex:

    - **None**: You will have a single copy of your database without replication.
    - **Single-Zone**: Your database will have a primary and a replica located in the same cloud zone. If anything happens to the primary, the replica takes over and becomes the new primary.

    See [High availability]({{< relref "/operate/rc/databases/configuration/high-availability" >}}) for more information about these settings.

1. Choose your **Data persistence** settings from the list.

    Redis Cloud supports the following Data persistence options:

    - An **Append-Only File** maintains a record (sometimes called a _redo log_ or _journal_) of write operations.  This allows the data to be restored by using the record to reconstruct the database up to the point of failure. For Essentials databases, Redis updates the Append-Only file every second.

    - A **Snapshot** is a copy of the in-memory database, taken at periodic intervals (one, six, or twelve hours). You can restore data to the snapshot's point in time. 
    
    See [Data persistence]({{< relref "/operate/rc/databases/configuration/data-persistence" >}}) for more information about these settings.
    
1. Select your desired memory limit. 

    {{<image filename="images/rc/subscription-new-flex-tiers.png" alt="Available Redis Flex plans." >}}

    For a comparison of available plans, see [Redis Cloud Essentials plans]({{< relref "/operate/rc/subscriptions/view-essentials-subscription/essentials-plan-details" >}}).

1.  Enter your payment details.

    If you haven't previously entered a payment method, use the **Add Credit Card** button to add one.

    {{<image filename="images/rc/icon-add.png" width="30px" alt="The Add credit card icon." >}}

    {{< embed-md "rc-credit-card-add.md" >}}

1. Select **Confirm & pay** to create your database.

{{<image filename="images/rc/button-create-db-confirm-pay.png" width="140px" alt="Select Confirm & Pay to create your new database." >}}

When you create your database, there's a brief pause while your request is processed and then the **Database details** page appears.
