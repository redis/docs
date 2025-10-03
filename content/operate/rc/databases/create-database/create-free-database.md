---
Title: Create a free database
alwaysopen: false
categories:
- docs
- operate
- rc
description: Shows how to create a free database.
linkTitle: Create free database
weight: 2
tocEmbedHeaders: true
---

Free databases are perfect for learning and exploring Redis. You get 30 MB of space for you to learn Redis concepts and develop application prototypes.

{{< note >}}
You can only have one free database per account. If you already have a free database, you can [delete it]({{< relref "/operate/rc/databases/delete-database" >}}) or [upgrade it to a paid Essentials plan]({{< relref "/operate/rc/subscriptions/view-essentials-subscription#upgrade-plan" >}}) before creating a new one.
{{</note>}}

{{< embed-md "rc-create-db-first-steps.md" >}} 

3. Select the type of [subscription]({{< relref "/operate/rc/subscriptions" >}}) you need. For this guide, select **Free**.

    {{<image filename="images/rc/create-database-subscription-free.png" alt="The Subscription selection panel with Free selected.">}}

    After you select **Free**, the rest of the database settings will appear.

    {{<image filename="images/rc/create-database-free-settings.png" alt="The database name, cloud vendor, and region settings.">}}

4. Redis will generate a database name for you. If you want to change it, you can do so in the **Database name** field. 

1. Select the **Database version** you want to use.

    A preview of Redis 8.0 is available for databases in selected regions. Select **8.0** to use it. For more information on the changes in Redis 8.0, see [What's new in Redis 8.0]({{<relref "/develop/whats-new/8-0" >}}) and review the [breaking changes]({{<relref "/operate/rc/changelog/version-release-notes/8-0" >}}).

1. Choose your **Cloud vendor** and **Region**. You can choose between **Amazon Web Services (AWS)**, **Google Cloud**, and **Microsoft Azure** for the Cloud Vendor. 

    {{<image filename="images/rc/create-database-essentials-cloud-vendor.png" alt="The Cloud vendor settings.">}}

    See [Supported regions]({{< relref "/operate/rc/supported-regions" >}}) for a list of supported regions by cloud vendor.

6. Select **Create database**.

    {{<image filename="images/rc/button-create-db.png" width="140px" alt="Select the Create database button to create your new database." >}}

    When you create your database, there's a brief pause while your request is processed and then the **Database details** page appears.

You can now [connect to your database]({{< relref "/operate/rc/databases/connect" >}}) and start working with Redis. Once your app is ready to scale up, you can [upgrade to a paid Essentials plan]({{< relref "/operate/rc/subscriptions/view-essentials-subscription#upgrade-plan" >}}) at any time.