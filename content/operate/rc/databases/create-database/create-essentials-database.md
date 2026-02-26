---
Title: Create an Essentials database
alwaysopen: false
categories:
- docs
- operate
- rc
description: Shows how to create an Essentials database.
linkTitle: Create Essentials database
weight: 5
aliases:
    - /operate/rc/subscriptions/create-fixed-subscription
tocEmbedHeaders: true
---

Redis Cloud Essentials is cost-efficient and designed for low-throughput scenarios. You can quickly scale up your Essentials database as your application grows.

{{< embed-md "rc-create-db-first-steps.md" >}} 

3. Select the type of [subscription]({{< relref "/operate/rc/subscriptions" >}}) you need. For this guide, select **Essentials**.

    {{<image filename="images/rc/create-database-subscription-essentials.png" alt="The Subscription selection panel with Essentials selected.">}}

    {{< note >}}
This guide shows how to create a paid Essentials database.
- If you want to create a free Essentials database, see [Create a free database]({{< relref "/operate/rc/rc-quickstart" >}}). You can only have one free database per account.
- If you'd rather create a Redis Flex database on Redis Cloud Essentials, see [Create a Redis Flex database]({{< relref "/operate/rc/databases/create-database/create-flex-database" >}})
- If you'd rather create a Pro database, see [Create a Pro database with a new subscription]({{< relref "/operate/rc/databases/create-database/create-pro-database-new" >}}).
- If you already have a Pro subscription and want to add a database to it, see [Create a Pro database in an existing subscription]({{< relref "/operate/rc/databases/create-database/create-pro-database-existing" >}}).
    {{< /note >}}
    
    After you select **Essentials**, the rest of the database details will appear.

    {{<image filename="images/rc/create-database-essentials-cloud-vendor.png" alt="The database name, cloud vendor, version, region, type, and durability settings.">}}

1. Redis will generate a database name for you. If you want to change it, you can do so in the **Name** field.  

1. Choose a **Cloud vendor** for your database from the list. You can choose between **Amazon Web Services (AWS)**, **Google Cloud**, and **Microsoft Azure** for the Cloud Vendor. 

    {{<image filename="images/rc/create-database-essentials-cloud-vendor-list.png" alt="The list of available cloud vendors.">}}

1. Choose a **Region** from the list. See [Supported regions]({{< relref "/operate/rc/supported-regions" >}}) for a list of supported regions by cloud vendor.

1. Choose your **High availability (replication)** settings.

    Redis Cloud supports the following high availability settings:

    - **None**: You will have a single copy of your database without replication.
    - **Single-Zone**: Your database will have a primary and a replica located in the same cloud zone. If anything happens to the primary, the replica takes over and becomes the new primary.
    - **Multi-Zone**: The primary and its replicas are stored in different zones. This means that your database can remain online even if an entire zone becomes unavailable.

    See [High availability]({{< relref "/operate/rc/databases/configuration/high-availability" >}}) for more information about these settings.

1. Choose your **Data persistence** settings from the list.

    Redis Cloud supports the following Data persistence options:

    - An **Append-Only File** maintains a record (sometimes called a _redo log_ or _journal_) of write operations.  This allows the data to be restored by using the record to reconstruct the database up to the point of failure. For Essentials databases, Redis updates the Append-Only file every second.

    - A **Snapshot** is a copy of the in-memory database, taken at periodic intervals (one, six, or twelve hours). You can restore data to the snapshot's point in time. 
    
    See [Data persistence]({{< relref "/operate/rc/databases/configuration/data-persistence" >}}) for more information about these settings.

1. Select the **Database version** you want to use.

1. The **Type** of database controls the protocol and advanced capabilities. Leave this as **Redis** unless you have a legacy application that uses **Memcached**.
    
1. Select your desired memory limit.

    {{<image filename="images/rc/subscription-new-fixed-tiers.png" alt="Available Essentials plans." >}}

    For a comparison of available plans, see [Redis Cloud Essentials plans]({{< relref "/operate/rc/subscriptions/view-essentials-subscription/essentials-plan-details" >}}).

1.  Enter your payment details.

    If you haven't previously entered a payment method, use the **Add Credit Card** button to add one.

    {{<image filename="images/rc/icon-add.png" width="30px" alt="The Add credit card icon." >}}

    {{< embed-md "rc-credit-card-add.md" >}}

1. Select **Confirm & pay** to create your database.

{{<image filename="images/rc/button-create-db-confirm-pay.png" width="140px" alt="Select Confirm & Pay to create your new database." >}}

When you create your database, there's a brief pause while your request is processed and then the **Database details** page appears.

You can now [connect to your database]({{< relref "/operate/rc/databases/connect" >}}) and start working with Redis.